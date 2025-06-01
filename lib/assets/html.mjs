import { createDocument } from '../htmldoc.mjs';
import { NODE_TYPE_ELEMENT, NODE_TYPE_TEXT, parseHtml, stringifyHtml } from '@keithclark/tiny-parsers';

const tagNameMap = {
  a: "HTMLAnchorElement",
  abbr: "HTMLElement",
  address: "HTMLElement",
  area: "HTMLAreaElement",
  article: "HTMLElement",
  aside: "HTMLElement",
  audio: "HTMLAudioElement",
  b: "HTMLElement",
  base: "HTMLBaseElement",
  bdi: "HTMLElement",
  bdo: "HTMLElement",
  blockquote: "HTMLQuoteElement",
  body: "HTMLBodyElement",
  br: "HTMLBRElement",
  button: "HTMLButtonElement",
  canvas: "HTMLCanvasElement",
  caption: "HTMLTableCaptionElement",
  cite: "HTMLElement",
  code: "HTMLElement",
  col: "HTMLTableColElement",
  colgroup: "HTMLTableColElement",
  data: "HTMLDataElement",
  datalist: "HTMLDataListElement",
  dd: "HTMLElement",
  del: "HTMLModElement",
  details: "HTMLDetailsElement",
  dfn: "HTMLElement",
  dialog: "HTMLDialogElement",
  div: "HTMLDivElement",
  dl: "HTMLDListElement",
  dt: "HTMLElement",
  em: "HTMLElement",
  embed: "HTMLEmbedElement",
  fieldset: "HTMLFieldSetElement",
  figcaption: "HTMLElement",
  figure: "HTMLElement",
  footer: "HTMLElement",
  form: "HTMLFormElement",
  h1: "HTMLHeadingElement",
  h2: "HTMLHeadingElement",
  h3: "HTMLHeadingElement",
  h4: "HTMLHeadingElement",
  h5: "HTMLHeadingElement",
  h6: "HTMLHeadingElement",
  head: "HTMLHeadElement",
  header: "HTMLElement",
  hgroup: "HTMLElement",
  hr: "HTMLHRElement",
  html: "HTMLHtmlElement",
  i: "HTMLElement",
  iframe: "HTMLIFrameElement",
  img: "HTMLImageElement",
  input: "HTMLInputElement",
  ins: "HTMLModElement",
  kbd: "HTMLElement",
  label: "HTMLLabelElement",
  legend: "HTMLLegendElement",
  li: "HTMLLIElement",
  link: "HTMLLinkElement",
  main: "HTMLElement",
  map: "HTMLMapElement",
  mark: "HTMLElement",
  menu: "HTMLMenuElement",
  meta: "HTMLMetaElement",
  meter: "HTMLMeterElement",
  nav: "HTMLElement",
  noscript: "HTMLElement",
  object: "HTMLObjectElement",
  ol: "HTMLOListElement",
  optgroup: "HTMLOptGroupElement",
  option: "HTMLOptionElement",
  output: "HTMLOutputElement",
  p: "HTMLParagraphElement",
  picture: "HTMLPictureElement",
  pre: "HTMLPreElement",
  progress: "HTMLProgressElement",
  q: "HTMLQuoteElement",
  rp: "HTMLElement",
  rt: "HTMLElement",
  ruby: "HTMLElement",
  s: "HTMLElement",
  samp: "HTMLElement",
  script: "HTMLScriptElement",
  search: "HTMLElement",
  section: "HTMLElement",
  select: "HTMLSelectElement",
  slot: "HTMLSlotElement",
  small: "HTMLElement",
  source: "HTMLSourceElement",
  span: "HTMLSpanElement",
  strong: "HTMLElement",
  style: "HTMLStyleElement",
  sub: "HTMLElement",
  summary: "HTMLElement",
  sup: "HTMLElement",
  svg: "SVGSVGElement",
  table: "HTMLTableElement",
  tbody: "HTMLTableSectionElement",
  td: "HTMLTableCellElement",
  template: "HTMLTemplateElement",
  textarea: "HTMLTextAreaElement",
  tfoot: "HTMLTableSectionElement",
  th: "HTMLTableCellElement",
  thead: "HTMLTableSectionElement",
  time: "HTMLTimeElement",
  title: "HTMLTitleElement",
  tr: "HTMLTableRowElement",
  track: "HTMLTrackElement",
  u: "HTMLElement",
  ul: "HTMLUListElement",
  var: "HTMLElement",
  video: "HTMLVideoElement",
  wbr: "HTMLElement",
}

/**
 * Creates JavaScript code for exporting the HTML as a `DocumentFragment` and 
 * element IDs as HTMLElement instances
 * 
 * @param {import('@keithclark/tiny-parsers').SgmlNode[]} fragment The HTML document code
 * @returns {string} JavaScript source 
 */
export const createScriptFromHtmlFragment = (fragment) => {
  const exports = new Map();

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
        exports.set(id, node.name);
      }
    }
  }

  // Export each <element id=""> as a named export
  const lines = Array.from(exports.keys()).map((name) => {
    return `export const ${name} = /*@__PURE__*/ document.getElementById('${name}');`;
  });

  // Export a typedef for each element
  const defs = Array.from(exports.entries()).map(([name, value]) => {
    return `export const ${name}: ${tagNameMap[value] || `Element /* <${value}> */`};`;
  });

  // the HTML text content as default
  lines.push(
    `export default /*@__PURE__*/ (() => {`,
    `  const template = document.createElement('template');`,
    `  template.innerHTML = ${JSON.stringify(stringifyHtml(fragment))};`,
    `  return template.content;`,
    `})();`,
  );

  defs.push('declare const $$AK$$contents: DocumentFragment;\nexport default $$AK$$contents;\n')
  return {
    defs: defs.join('\n'),
    code: lines.join('\n')
  };
};


/**
 * 
 * @param {string} code 
 * @param {*} options 
 * @returns {string}
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
 * @param {import('@keithclark/tiny-parsers').SgmlNode[]} nodeList
 * @returns {Generator<import('@keithclark/tiny-parsers').SgmlNode>}
 */
function* walkTree(nodeList) {
  for (const node of nodeList) {
    yield node;
    if (node.type === NODE_TYPE_ELEMENT) {
      yield* walkTree(node.children);
    }
  }
};