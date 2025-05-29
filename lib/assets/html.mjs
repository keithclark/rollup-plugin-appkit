import { createDocument } from '../htmldoc.mjs';
//import { parse as parseHtml, stringify as stringifyHtml } from '../html2/main.js';
import { NODE_TYPE_ELEMENT, NODE_TYPE_TEXT, parseHtml, stringifyHtml } from '@keithclark/tiny-parsers';

/**
 * Creates JavaScript code for exporting the HTML as a `DocumentFragment` and 
 * element IDs as HTMLElement instances
 * 
 * @param {import('@keithclark/tiny-parsers').NodeList} fragment The HTML document code
 * @returns {string} JavaScript source 
 */
export const createScriptFromHtmlFragment = (fragment) => {
  const exports = new Set();

  for (let node of walkTree(fragment)) {
    if (node.type === NODE_TYPE_ELEMENT) {
      if ('id' in node.attributes) {
        const { id } = node.attributes;
        if (id.includes('-')) {
          throw new Error(`Invalid element ID "${id}"`);
        }
        if (exports.has(id)) {
          throw new Error(`Duplicate element ID "${id}"`);  
        }
        exports.add(id);
      }
    }
  }

  // Export each <element id=""> as a named export
  const lines = Array.from(exports).map((name) => {
    return `export const ${name} = /*@__PURE__*/ document.getElementById('${name}');`;
  });

  // the HTML text content as default
  lines.push(
    `export default /*@__PURE__*/ (() => {`,
    `  const template = document.createElement('template');`,
    `  template.innerHTML = ${JSON.stringify(stringifyHtml(fragment))};`,
    `  return template.content;`,
    `})();`,
  );

  return lines.join('\n');
};


/**
 * 
 * @param {string} code 
 * @param {*} options 
 * @returns 
 */
export const createAppIndexDocument = (code, options) => {
  const domFragment = parseHtml(code);
  const domDocument = createDocument(domFragment, options);
  return stringifyHtml(domDocument);
};


/**
 * Note: Mutates a node list
 * 
 * @param {import('@keithclark/tiny-parsers').NodeList} fragment 
 * @returns {void}
 */
export const minify = (fragment) => {
  for (let node of walkTree(fragment)) {
    if (node.type === NODE_TYPE_TEXT) {
      node.value = node.value.trim();
    }
  }
};


/**
 * @generator
 * @param {import('@keithclark/tiny-parsers').NodeList} nodeList
 * @yields {import('@keithclark/tiny-parsers').Node}
 * @returns {Generator<import('@keithclark/tiny-parsers').Node>}
 */
function* walkTree(nodeList) {
  for (const node of nodeList) {
    yield node;
    if (node.type === NODE_TYPE_ELEMENT) {
      yield* walkTree(node.children);
    }
  }
};