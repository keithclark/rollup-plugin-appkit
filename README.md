# What does it do?

rollup-plugin-appkit was designed to simplify building applications and Web Components in my AppKit framework. Although it was written for AppKit, it can be used in any Rollup-based project.

* **HTML imports**: Import an entire HTML document as a `DocumentFragment`, or references to individual `HTMLElement`s using their ID attribute.
* **CSS Imports**: Import a stylesheet as `CSSStyleSheet`.
* **Application host document**: Builds the index page that serves your application.
* **Manifest**: Generates a `manifest.json` for your application.
* **Types**: Optionally generates TypeScript `.d.ts` files for imported stylesheets and HTML fragments / elements.

## Install

```
npm i git+https://github.com/keithclark/rollup-plugin-appkit
```

## Usage

```js
import appkit from '@keithclark/rollup-plugin-appkit';

export default {
  input: 'src/app.js',
  output: {
    format: 'esm',
    file: 'public/build.js'
  },
  plugins:[
    appkit({
      /* options */
    })
  ]
}
```

### Options

Name | Type | Description
-|-|-
`name` | string | The name of the application. Required for manifests. Defaults to `name` in `package.json`
`version` | string | The version of the application. Defaults to `version` in `package.json`
`description` | string | A short description of the application.
`icon` | string | The path to the application icon. Required for manifests.
`image` | string | The path to the application image. Used for Open Graph metadata.
`url` | string | The URL the application will be served from. Required for manifests.
`manifest` | boolean | Should a `manifest.json` be generated for this application. Defaults to `false`.
`dynamicTypeDefinitions` | boolean | Should TypeScript definitions be generated for CSS and HTML imports. Defaults to `true`.

## Example

Given the following input:

`rollup.config.js`:
```js
import appkit from '@keithclark/rollup-plugin-appkit';

const version = process.env.npm_package_version;

export default [{
  input: 'src/app.js',
  output: {
    format: 'cjs',
    sourcemap: true,
    dir: './public',
    entryFileNames: `build-${version}.js`,
    assetFileNames: `[name]-${version}[extname]`
  },
  plugins:[
    appkit()
  ]
}]
```

`src/app.js`:
```js
import './styles.css';
import { title } from './index.html';

title.textContent = 'Hello World!';
```


`src/index.html`:
```html
<h1 id="title"></h1>
```

`src/styles.css`:
```css
h1 {
  color: red;
}
```

Rollup will generate:

`public/build-1.0.0.js`:
```js
const title = document.getElementById('title');
title.textContent = 'Hello World!';
```

`public/styles-1.0.0.css`:
```css
h1{color:red}
```

`public/index.html`:
```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="styles-1.0.0.css">
<!-- Note: other elements removed for brevity -->
</head>
<body>
<h1 id="title"></h1>
<script src="build-1.0.0.js"></script>
</body>
</html>
```

# Documentation

## HTML Imports

Appkit can import HTML documents and element references directly into JavaScript.

```js
/* Side-effect import: "index.html" will be added to the bundle */
import './index.html';

/* Default import: `fragment` will contain a `DocumentFragment` populated with the contents of "index.html". The file "index.html" will NOT be added to the bundle */
import fragment from './index.html';

/* Named import: `title` will be reference to the `HTMLElement` with `id="title"` in "index.html". "index.html" will be added to the bundle */
import { title } from './index.html';

/* Mixed import: See comments above. "index.html" will be added to the bundle because of the named import */
import fragment, { title } from './index.html';   
```

### `default` import

The `default` export for a HTML module is a [DocumentFragment]() contining the document contents. During build, the document is loaded from disk, parsed, minified and the resulting string is embedded into the JavaScript bundle. This is useful for embedding HTML templates into applications or web components.

#### Example input 

`src/index.html`:
```html
<h1 id="title"></title>
```

`src/app.js`:
```js
import document from './index.html'; 

// `document` is a DocumentFragment
document.querySelector('h1').textContent = 'Hello world!'
```

#### Generated output

`dist/app.js`:
```js
var document$1 = /*@__PURE__*/ (() => {
  const template = document.createElement('template');
  template.innerHTML = "<h1 id=\"title\"></title>";
  return template.content;
})();

document$1.querySelector('#title').textContent = 'Hello World';
```



### Named imports

Each element in the document with an `id` attribute is exported as an `HTMLElement` from the module using its ID as a named export. Internally, a named import resolves to a `document.getElementById()` statement, which requires the HTML document to be included the rollup bundle. The plugin will automatically handle this for you, adding any missing HTML document structure. It will also add a `<script>` element referencing the script that imported it.

#### Example input 

`src/app.js`:
```js
import { title } from './index.html';

// `title` is a HTMLHeadingElement
title.textContent = 'Hello world!';
```

`src/index.html`:
```html
<h1 id="title"></title>
```

#### Generated output

`dist/index.html`:
```html
<!doctype html>
<html>
<head>
  ...
</head>
<body>
  <h1 id="title"></title>
  <script src="app.js"></script>
</body>
</html>
```

`dist/app.js`:
```js
const title = /*@__PURE__*/ document.getElementById('title');

// `title` is a HTMLHeadingElement
title.textContent = 'Hello world!';
```


### Side-effect imports

A side-effect import will result in rollup adding a minfied version of the HTML document to the build directory. As with named imports, any missing HTML document structure will be added along with a `<script>` element referencing the script that imported it. If the rollup is configured generate an ES module, a `type="module"` attribute will also be added.

#### Example input 

`src/index.html`:
```html
<h1 id="title"></title>
```

`src/app.js`:
```js
import './index.html';

alert('Oh, hai!');
```

#### Generated output

`dist/index.html`:
```html
<!doctype html>
<html>
<head>
  ...
</head>
<body>
<h1 id="title"></title>
<script src="app.js"></script>
</body>
</html>
```


`dist/app.js`:
```js
alert('Oh, hai!');
```

## CSS imports

### `default` import

The `default` export for a CSS module is a [CSSStyleSheet]() contining the stylesheet contents. During build, the document is loaded from disk, parsed, minified and the resulting string is embedded into the JavaScript bundle. A copy of the CSS file will not appear in the output directory when importing using this method.

#### Example input 

`src/app.js`:
```js
import stylesheet from './main.css'; 

// `stylesheet` is a `CSSStyleSheet`
document.adoptedStyleSheets.push(stylesheet);

// or in a Web Component
this.shadowRoot.adoptedStyleSheets.push(stylesheet);
```

`src/main.css`:
```css
body {
  color: red;
}
```

#### Generated output

`dist/app.js`:
```js
const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync("body{color:red}");
document.adoptedStyleSheets.push(stylesheet);
this.shadowRoot.adoptedStyleSheets.push(stylesheet); // (if in a Web Component)
```

### Side-effect imports

A side-effect import will result in rollup adding a minfied version of the stylesheet to the output directory. If the application also imports a HTML document, a link to the stylesheet is automatically added to the `<head>` element.

#### Example input 

`src/app.js`:
```js
import './main.css';
alert('Hello world!');
```

`src/main.css`:
```css
body {
  color: red;
}
```

#### Generated output

`dist/app.js`:
```js
alert('Hello world!');
```

`dist/main.css`:
```css
body{color:red}
```
