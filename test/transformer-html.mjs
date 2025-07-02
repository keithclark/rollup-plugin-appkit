import { partialDeepStrictEqual } from 'node:assert/strict';
import html from '../lib/transformers/html.mjs';

partialDeepStrictEqual(
  html('<h1>Testing</h1>'), {
    typeDefinitions: 
      'declare const $$AK$$contents: DocumentFragment;\n' +
      'export default $$AK$$contents;\n'
  },
  'HTML transformer should generate a type definifion for a document fragment'
);

partialDeepStrictEqual(
  html('<h1 id="test">Testing</h1>'), {
    typeDefinitions: 
      'export const test: HTMLHeadingElement;\n' +
      'declare const $$AK$$contents: DocumentFragment;\n' +
      'export default $$AK$$contents;\n'
  },
  'HTML transformer should return type definifions for any elements with an ID'
);

partialDeepStrictEqual(
  html('<h1 id="test">Testing</h1>'), {
    module: 
      'export const test = /*@__PURE__*/ document.getElementById(\'test\');\n' +
      'export default /*@__PURE__*/ (() => {\n' +
      '  const template = document.createElement(\'template\');\n' +
      '  template.innerHTML = "<h1 id=\\"test\\">Testing</h1>";\n' +
      '  return template.content;\n' +
      '})();'
  },
  'HTML transformer should return a JavaScript module containing an exported template and "elementById" list'
);
   