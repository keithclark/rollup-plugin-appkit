import { dirname, parse, resolve } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

// Content generators
import generateIndexDocument from './lib/generators/indexDocument.mjs'
import generateManifest from './lib/generators/manifest.mjs'

// Content transformers
import transformHtml from './lib/transformers/html.mjs'
import transformCss from './lib/transformers/css.mjs'

/**
 * @typedef {import('rollup').Plugin} Plugin
 * @typedef {import('rollup').EmittedFile} EmittedFile 
 */
/**
 * @typedef AppkitPluginOptions
 * @property {string} [name] The name of the application. Required for PWAs. Defaults to "name" in "package.json"
 * @property {string} [version] The version of the application. Defaults to "version" in "package.json"
 * @property {string} [description] A short description of the application.
 * @property {string} [icon] The path to the application icon. Required for PWAs
 * @property {string} [image] The path to the application image. Used for Open Graph metadata
 * @property {string} [url] The URL the application will be served from.
 * @property {boolean} [manifest=false] Should a manifest.json be generated for this application
 * @property {boolean} [dynamicTypes=true] Should type definitions be generated for imported CSS and HTML dependencies
 */

/**
 * @param {AppkitPluginOptions} opts The plugin options
 * @returns {Plugin}
 */ 
export default (opts = {}) => {

  opts.name ??= process.env.npm_package_name;
  opts.version ??= process.env.npm_package_version;
  opts.url ??= '';
  opts.dynamicTypes ??= true;

  const manifestFile = 'manifest.json';
  const indexFile = 'index.html';
  const typesDir = '@types';

  const basePath = process.env.npm_config_local_prefix;

  const resolveUrl = (url, base = opts.url) => {
    if (base && !base.endsWith('/')) {
      base += '/';
    }
    return `${base}${url}`;
  };

  const writeTypeFile = (id, code) => {
    if (!id.startsWith(basePath)) {
      return this.error('File path');
    }
    const localName = typesDir + id.slice(basePath.length) + '.d.ts';
    const localPath = resolve(basePath, localName);
    mkdir(dirname(localPath), { recursive: true }).then(()=>writeFile(localPath, code));
  };

  return {
    name: "appkit",

    async transform(code, id) {
      let transformedCode;

      if (id.endsWith('.css')) {
        transformedCode = transformCss(code);
      } else if (id.endsWith('.html')) {
        transformedCode = transformHtml(code);
      }

      // If the code was transformed then we can return it as an ES module.
      if (transformedCode) {
        if (opts.dynamicTypes) {
          writeTypeFile(id, transformedCode.typeDefinitions);
        }
        return {
          ast: this.parse(transformedCode.module),
          code: transformedCode.module,
          moduleSideEffects: false,
          map: null,
          meta: {
            raw: transformedCode.code
          }
        }
      }


      // If we get here then the source code should be JavaScript. 
      const program = this.parse(code);

      // Look for top-level HTML and CSS `import` declarations to determine if 
      // their original contents need to be emitted as a file in the final 
      // bundle because they were imported for side-effect purposes (i.e 
      // `import 'index.html'`)
      for (const node of program.body) {
        if (node.type !== 'ImportDeclaration') {
          continue;
        } 

        const { ext, base } = parse(node.source.value);
        if (ext !== '.css' && ext !== '.html') {
          continue;
        }

        // Not having named or default exports means this file is being imported
        // for side-effects, which means the asset must be added to the bundle.
        let emit = node.specifiers.length === 0;

        // For HTML files we will still need to emit the file if importing an 
        // element by ID
        if (!emit && ext === '.html') {
          emit = node.specifiers.some((specifier) => {
            return specifier.type !== 'ImportDefaultSpecifier';
          });
        }

        if (!emit) {
          continue;
        }

        /** @type {string} */
        let path;

        // Try and resolve this import in case it's a node module
        let resolved = await this.resolve(node.source.value);
        if (resolved) {
          path = resolved.id;
        } else {
          // The import is local, resolve it the to current module
          path = resolve(parse(id).dir, node.source.value);
        }

        const moduleInfo = await this.load({ id: path });

        this.emitFile({
          type: 'asset',
          source: moduleInfo.meta.raw,
          originalFileName: path,
          name: base === indexFile ? null : base,
          fileName: base === indexFile ? base : null,
        });

        // Since this is loaded as a side-effect we need to watch the original
        // file so we can rebuild the asset if it changes.
        this.addWatchFile(path);
      }

      return {
        ast: program,
        code,
        map: null
      };
      
    },


    async generateBundle(output, bundle) {

      
      //console.log(bundle)
      let imageUrl;
      let iconUrl;
      let manifestUrl = null;

      // Create the Icon image asset if it's required
      if (opts.icon) {
        const referenceId = this.emitFile({
          type: 'asset',
          source: await readFile(opts.icon),
          name: parse(opts.icon).base
        });
        iconUrl = resolveUrl(this.getFileName(referenceId));
      }

      // Create the Open Graph image asset if it's required
      if (opts.image) {
        const referenceId = this.emitFile({
          type: 'asset',
          source: await readFile(opts.image),
          name: parse(opts.image).base
        });
        imageUrl = resolveUrl(this.getFileName(referenceId));
      }

      // Create the `manifest.json` asset if it's required
      if (opts.manifest) {
        const missing = [];
        if (!iconUrl) {
          missing.push('icon');
        }
        if (!opts.url) {
          missing.push('URL');
        }
        if (!opts.name) {
          missing.push('name');
        }

        if (missing.length) {
          this.warn(`Cannot create a manifest file. Missing application ${missing.join(' and ')}`);
        } else {
          this.emitFile({
            type: 'asset',
            source: generateManifest({
              name: opts.name,
              url: opts.url,
              icon: iconUrl
            }),
            fileName: manifestFile
          });
          manifestUrl = resolveUrl(manifestFile);
        }
      }

      if (indexFile in bundle) {
        const indexDocument = bundle[indexFile];
        
        const scripts = Object.entries(bundle).filter(([_, item]) => {
          return item.type === 'chunk';
        }).map(([file, data]) => {
          return {
            url: resolveUrl(file)
          }
        });

        const stylesheets = Object.entries(bundle).filter(([_, item]) => {
          return item.type === 'asset' && item.fileName.endsWith('.css');
        }).map(([file, data]) => {
          return {
            url: resolveUrl(file)
          }
        });

        indexDocument.source = generateIndexDocument(indexDocument.source, {
          title: opts.name,
          url: opts.url,
          description: opts.description,
          manifestUrl,
          imageUrl,
          iconUrl,
          scripts,
          stylesheets
        });
      }
    }
  };
};
