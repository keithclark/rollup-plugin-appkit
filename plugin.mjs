import { parse, resolve } from 'node:path';
import { createScriptFromHtmlFragment, minify as minifyHtml, createAppIndexDocument } from './lib/assets/html.mjs';
import { createScriptFromStylesheet, minify as minifyCss } from './lib/assets/css.mjs';
import { createManifest } from './lib/assets/manifest.mjs';
import { parseCss, parseHtml, stringifyCss } from '@keithclark/tiny-parsers';
import { readFile } from 'node:fs/promises';

/**
 * @typedef {import('/Users/keithclark/.npm/lib/node_modules/rollup/dist/rollup.d.ts').Plugin} Plugin
 * @typedef {import('/Users/keithclark/.npm/lib/node_modules/rollup/dist/rollup.d.ts').EmittedFile} EmittedFile 
 */
/**
 * @typedef AppkitPluginOptions
 * @property {string} [name] The name of the application. Required for PWAs
 * @property {string} [version] The version of the application. Defaults to "version" in "package.json"
 * @property {string} [description] A short description of the application.
 * @property {string} [icon] The path to the application icon. Required for PWAs
 * @property {string} [image] The path to the application image. Used for Open Graph metadata
 * @property {string} [url] The URL the application will be served from.
 * @property {boolean} [manifest=false] Should a manifest.json be generated for this application
 */


/**
 * @param {AppkitPluginOptions} opts The plugin options
 * @returns {Plugin}
 */ 
export default (opts = {}) => {

  opts.name ??= process.env.npm_package_name;
  opts.version ??= process.env.npm_package_version;
  opts.url ??= '';

  /** @type {Map<string,EmittedFile>} */
  let emitted = new Map();

  const indexFile = 'index.html';

  const resolveUrl = (url, base = opts.url) => {
    if (base && !base.endsWith('/')) {
      base += '/'
    }
    return `${base}${url}`;
  }

  return {
    name: "appkit",

    transform(code, id) {
      if (id.endsWith('.css')) {
        const stylesheet = parseCss(code);
        minifyCss(stylesheet);
        return {
          code: createScriptFromStylesheet(stylesheet),
          moduleSideEffects: false,
          map: null
        }
      }
      if (id.endsWith('.html')) {
        const document = parseHtml(code);
        minifyHtml(document);
        return {
          code: createScriptFromHtmlFragment(document),
          moduleSideEffects: false,
          map: null
        }
      }
    },

    async moduleParsed(moduleInfo) {
      // Look for top-level HTML and CSS `import` declarations to determine if 
      // their original contents need to be emitted as a file in the final 
      // bundle because they were imported for side-effect purposes (i.e 
      // `import 'index.html'`)
      for (const node of moduleInfo.ast.body) {
        if (node.type !== 'ImportDeclaration') {
          continue;
        }

        const { ext, base } = parse(node.source.value);
        if (ext !== '.css' && ext !== '.html') {
          continue;
        }

        // No named or default exports means side-effects, which in this case is
        // copy the file
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

        let path;

        // Try and resolve this import in case it's a node module
        let resolved = await this.resolve(node.source.value);
        if (resolved) {
          path = resolved.id;
        } else {
          // The import is local, resolve it the to current module
          path = resolve(parse(moduleInfo.id).dir, node.source.value)
        }

        if (!emitted.has(path)) {
          emitted.set(path, {
            type: 'asset',
            source: (await readFile(path)).toString(),
            originalFileName: path,
            name: base === indexFile ? null : base,
            fileName: base === indexFile ? base : null,
          });

          // test inline minification
          if (path.endsWith('.css')) {
            const stylesheet = parseCss(emitted.get(path).source);
            emitted.get(path).source = stringifyCss(stylesheet);
          }
        }
      
      }
    },

    async generateBundle(output, bundle) {

      let imageUrl;
      let iconUrl;
      let manifestUrl;


      for (const asset of emitted.values()) {
        this.emitFile(asset);
      }

      emitted.clear()

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
        if (!iconUrl) {
          this.error('Cannot create a manifest file without an application icon');
        }
        if (!opts.url) {
          this.error('Cannot create a manifest file without an application URL');
        }
        if (!opts.name) {
          this.error('Cannot create a manifest file without an application name');
        }

        const fileName = 'manifest.json';
        this.emitFile({
          type: 'asset',
          source: createManifest({
            name: opts.name,
            url: opts.url,
            icon: iconUrl
          }),
          fileName
        });
        manifestUrl = resolveUrl(fileName);
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
          return item.fileName.endsWith('.css');
        }).map(([file, data]) => {
          return {
            url: resolveUrl(file)
          }
        });

        indexDocument.source = createAppIndexDocument(indexDocument.source, {
          title: opts.name,
          url: opts.url,
          description: opts.description,
          manifestUrl: opts.manifest,
          imageUrl,
          iconUrl,
          scripts,
          stylesheets
        });
      }
    }
  };
};
