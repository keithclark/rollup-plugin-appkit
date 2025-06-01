import { stringifyCss } from "@keithclark/tiny-parsers";


/**
 * Creates JavaScript code for exporting CSS content as a `CSSStyleSheet`
 * 
 * @param {import("@keithclark/tiny-parsers").CssNode[]} stylesheet The CSS code
 * @returns {string} JavaScript source 
 */
export const createScriptFromStylesheet = (stylesheet) => {
  const lines = [
    `const stylesheet = new CSSStyleSheet();`,
    `stylesheet.replaceSync(${JSON.stringify(stringifyCss(stylesheet))});`,
    'export default stylesheet;'
  ];
  return {
    code: lines.join('\n'),
    defs: 'declare const $$AK$$contents: CSSStyleSheet;\nexport default $$AK$$contents;'
  }
};


export const minify = (stylesheet) => {
};
