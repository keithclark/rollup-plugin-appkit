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
   
partialDeepStrictEqual(
  html('<!-- test -->\n<div>test</div>\n<!-- test -->'),
  { code: '<div>test</div>' },
  'HTML comments should be removed'
);

partialDeepStrictEqual(
  html('\n <div> <span> X </span>\n</div>\n'),
  { code: '<div><span> X </span></div>' },
  'Whitespace should be normalised'
);

partialDeepStrictEqual(
  html(' \n <pre>1\n 2\n  3\n    4</pre> \n '),
  { code: '<pre>1\n 2\n  3\n    4</pre>' },
  'Whitespace sensitive element should not have whitespace normalised'
);
