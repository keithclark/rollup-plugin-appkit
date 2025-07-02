import { partialDeepStrictEqual } from 'node:assert/strict';
import css from '../lib/transformers/css.mjs';

partialDeepStrictEqual(
  css('h1 { color: red }'), {
    typeDefinitions: 
      'declare const $$AK$$contents: CSSStyleSheet;\n' +
      'export default $$AK$$contents;'
  },
  'CSS transformer should generate a type definifion for a stylesheet'
);

partialDeepStrictEqual(
  css('h1 { color: red }'), {
    module: 
      'const stylesheet = new CSSStyleSheet();\n' +
      'stylesheet.replaceSync("h1{color:red}");\n' +
      'export default stylesheet;',
  },
  'CSS transformer should generate a JavaScript module containing an exported CSSStyleSheet'
);
