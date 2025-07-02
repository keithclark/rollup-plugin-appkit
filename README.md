# What does it do?

* **HTML imports**: import individual DOM nodes, or an entire HTML document into your application.
* **CSS Imports**: import stylesheets into your application.
* **Application host document**: Builds the index page that serves your application.
* **Manifest**: Generates a `manifest.json` for your application.
* **Types**: Generates type definitions for imported CSS and HTML.

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
`name` | string | The name of the application. Required for PWAs. Defaults to `name` in `package.json`
`version` | string | The version of the application. Defaults to `version` in `package.json`
`description` | string | A short description of the application.
`icon` | string | The path to the application icon. Required for PWAs.
`image` | string | The path to the application image. Used for Open Graph metadata.
`url` | string | The URL the application will be served from. Required for PWAs.
`manifest` | boolean | Should a `manifest.json` be generated for this application. Defaults to `false`.
`dynamicTypeDefinitions` | boolean | Should TypeScript definitions be generated for CSS and HTML imports. Defaults to `true`.



# Documentation

## HTML Imports

Appkit can import HTML documents and element references directly into JavaScript.

```js
/* Side-effect import: Adds "index.html" to the bundle */
import './index.html';

/* Named import: Reference to `HTMLElement` with `id="title"` in "index.html". "index.html" is added to the bundle */
import { title } from './index.html';

/* Default import: The entire document as a `DocumentFragment`. "index.html" is not added to the bundle */
import fragment from './index.html';   
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
