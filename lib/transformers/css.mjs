import { parseCss, stringifyCss } from "@keithclark/tiny-parsers";


/**
 * Creates JavaScript code for exporting CSS content as a `CSSStyleSheet`
 * 
 * @param {string} code The CSS code
 * @returns {import('../types.js').TransformResult} JavaScript source 
 */
export default (code) => {
  const stylesheet = parseCss(code)
  minify(stylesheet)
  const cssText = stringifyCss(stylesheet);
  const lines = [
    `const stylesheet = new CSSStyleSheet();`,
    `stylesheet.replaceSync(${JSON.stringify(cssText)});`,
    'export default stylesheet;'
  ];
  return {
    module: lines.join('\n'),
    typeDefinitions: 'declare const $$AK$$contents: CSSStyleSheet;\nexport default $$AK$$contents;',
    code: cssText
  }
};


export const minify = (stylesheet) => {
};
