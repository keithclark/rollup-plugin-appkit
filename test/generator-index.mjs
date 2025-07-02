import { equal, match } from 'node:assert/strict';
import generator from '../lib/generators/indexDocument.mjs';

equal(
  generator(''), 
  '<!doctype html>\n' +
  '<html lang="en">\n' +
  '<head>\n' +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com">\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins&#38;display=swap">\n' +
  '<meta name="theme-color" content="#eeeeee" media="(prefers-color-scheme: light)">\n' +
  '<meta name="theme-color" content="#22262d" media="(prefers-color-scheme: dark)">\n' +
 '<meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '<meta property="og:type" content="website">\n' +
  '</head>\n' +
  '<body></body>\n' +
  '</html>',
  'Empty document should generate a valid HTML scaffold'
);

match(
  generator('<title>My App</title>'), 
  /<head>[\w\W]*?<title>My App<\/title>[\w\W]*?<\/head>/,
  'If `title` is in the passed markup, it should still be in the output document `<head>`'
);

match(
  generator('<title>My App</title>Test'), 
  /<head>[\w\W]*?<title>My App<\/title>[\w\W]*?<\/head>\s*<body>\s*Test\s*<\/body>/,
  'implied <head> and <body>'
);

match(
  generator('<html>My App</html>'), 
  /^<!doctype html>\s*<html>\s*<head>[\w\W]+<\/head>\s*<body>My App<\/body>\s*<\/html>$/,
  'implied <head> and <body>'
);


match(
  generator('<html id="testhtml"><head id="testhead"></head></html>'), 
  /^<!doctype html>\s*<html id="testhtml">\s*<head id="testhead">[\w\W]+<\/head>\s*<body>\s*<\/body>\s*<\/html>$/,
  'implied <body> in a <html> should appear after a <head>'
);


match(
  generator('<html id="testhtml"><body id="testbody"></body></html>'), 
  /^<!doctype html>\s*<html id="testhtml">\s*<head>[\w\W]+<\/head>\s*<body id="testbody">\s*<\/body>\s*<\/html>$/,
  'implied <head> in a <html> should appear before a <body>'
);


match(
  generator('<head id="test"></head>'), 
  /^<!doctype html>\s*<html[^>]*?>\s*<head id="test">[\w\W]+<\/head>\s*<body>\s*<\/body>\s*<\/html>$/,
  'implied <body> in an implied <html> should appear after a <head>'
);


match(
  generator('<body id="test"></body>'), 
  /^<!doctype html>\s*<html[^>]*?>\s*<head>[\w\W]+<\/head>\s*<body id="test"><\/body>\s*<\/html>$/,
  'implied <head> in an implied <html> should appear before a <body>'
);


match(
  generator('', {title: 'My App'}), 
  /<head>[\w\W]*?<title>My App<\/title>[\w\W]*?<\/head>/,
  'If `title` is passed, a <title> element should be added to the document'
);

match(
  generator('', {title: 'My App'}), 
  /<meta property="og:title" content="My App">/,
  'If `title` is passed, a <meta og:title> element should be added to the document'
);

match(
  generator('', {url: 'https://test.com'}), 
  /<head>[\w\W]*?<meta property="og:url" content="https:\/\/test.com">[\w\W]*?<\/head>/,
  'If `title` is passed, a <title> element should be added to the document'
);

match(
  generator('', {url: 'https://test.com'}), 
  /<head>[\w\W]*?<link rel="canonical" href="https:\/\/test.com">[\w\W]*?<\/head>/,
  'If `title` is passed, a <title> element should be added to the document'
);
