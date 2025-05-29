import { stringifyCss } from "@keithclark/tiny-parsers";


/**
 * Creates JavaScript code for exporting CSS content as a `CSSStyleSheet`
 * 
 * @param {string} code The CSS code
 * @returns {string} JavaScript source 
 */
export const createScriptFromStylesheet = (stylesheet) => {
  const lines = [
    `const stylesheet = new CSSStyleSheet();`,
    `stylesheet.replaceSync(${JSON.stringify(stringifyCss(stylesheet))});`,
    'export default stylesheet;'
  ];
  return lines.join('\n');
};


export const minify = (stylesheet) => {
};
