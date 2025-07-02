import {
  NODE_TYPE_DOCTYPE,
  NODE_TYPE_ELEMENT,
  NODE_TYPE_TEXT,
  parseHtml,
  stringifyHtml
} from '@keithclark/tiny-parsers';

import {
  adoptNode,
  createDoctype,
  createElement,
  createText,
  findElementByName,
  findNode,
  insertNode,
  removeNode
} from '../nodeUtils.js';

/**
 * @typedef {import('@keithclark/tiny-parsers').SgmlNode} Node 
 * @typedef {import('@keithclark/tiny-parsers').SgmlNodeList} NodeList 
 * @typedef {import('@keithclark/tiny-parsers').SgmlAttributeList} AttributeList 
 */

/**
 * Determines if a node is text type and only contains whitespace characters
 * 
 * @param {Node} node The node to check
 * @returns {boolean}
 */
const isWhitespace = (node) => {
  return node.type === NODE_TYPE_TEXT && node.value.trim() === '';
};


/**
 * Determines if a node is text type and only contains whitespace characters
 * 
 * @param {Node} node The node to check
 * @returns {boolean}
 */
const isHeadElement = (node) => {
  if (node.type !== NODE_TYPE_ELEMENT) {
    return false;
  }
  return (node.name === 'link' || node.name === 'title' || node.name==='meta')
};


/**
 * Removes the first and last nodes from a node list if they only contain 
 * whitespace characters
 * 
 * @param {NodeList} nodeList 
 */
const trimWhitespaceNodes = (nodeList) => {
  const [firstChild] = nodeList.children;
  if (firstChild && isWhitespace(firstChild)) {
    removeNode(firstChild, nodeList);
  }
  const lastChild = nodeList.children.at(-1);
  if (lastChild && isWhitespace(lastChild)) {
    removeNode(lastChild, nodeList);
  }
};


/**
 * 
 * @param {string} code 
 * @param {*} options 
 * @returns {string}
 */
export default (code, options = {}) => {

  /**
   * 
   * @param {Node} headElem 
   * @param {AttributeList} attributes 
   * @returns {Node}
   */
  const addLink = (attributes) => {
    return insertNode(createElement('link', attributes), headElem);
  };


  /**
   * 
   * @param {Node} headElem 
   * @param {AttributeList} attributes 
   * @returns {Node}
   */
  const setMeta = (attributes, position) => {
    if (attributes) {
      // If we're setting `<meta [name|poperty]="" content="">`, check to see
      // if the combination already exists. If it does then bail out and leave
      // the current element as it was set manually elsewhere.
      if (Object.keys(attributes).length === 2 && ('content' in attributes)) {
        if (('name' in attributes)) {
          if (headElem.children.some((node) => node.attributes?.name == attributes.name)) {
            return
          }
        } else if (('property' in attributes)) {
          if (headElem.children.some((node) => node.attributes?.property == attributes.property)) {
            return
          }
        }
      }
    }
    insertNode(createElement('meta', attributes), headElem, position);
  };

  const nodes = parseHtml(code);

  const document = {
    children: []
  };

  const srcTree = {
    type: NODE_TYPE_ELEMENT,
    children: nodes
  };

  const {
    description,
    title,
    image,
    url,
    manifestUrl,
    iconUrl
  } = options;

  let doctypeElem = findNode(srcTree, (node) => node.type === NODE_TYPE_DOCTYPE);
  let htmlElem = findElementByName(srcTree, 'html');
  let headElem = findElementByName(srcTree, 'head');
  let bodyElem = findElementByName(srcTree, 'body');
  let child;

  if (htmlElem) {
    adoptNode(htmlElem, srcTree, document, 'append');
  } else {
    htmlElem = createElement('html', { lang: 'en' });
    while (child = srcTree.children.at(0)) {
      adoptNode(child, srcTree, htmlElem);
    }
    insertNode(htmlElem, document, 'prepend');
  }

  if (headElem) {
    adoptNode(headElem, htmlElem, htmlElem, 'prepend');
  } else {
    headElem = createElement('head');
    while (child = htmlElem.children.at(0)) {
      // Whitespace is useless in `<head>` elements
      if (isWhitespace(child)) {
        removeNode(child, htmlElem);
        continue;
      }
      if (!isHeadElement(child)) {
        break;
      }
      adoptNode(child, htmlElem, headElem);
    }
    insertNode(headElem, htmlElem, 'prepend');
  }

  if (bodyElem) {
    adoptNode(bodyElem, htmlElem, htmlElem, 'append');
  } else {
    bodyElem = createElement('body');
    while (child = htmlElem.children.at(2)) {
      adoptNode(child, htmlElem, bodyElem);
    }
    insertNode(bodyElem, htmlElem, 'append');
  }


  // Add a <!DOCTYPE>
  if (!doctypeElem) {
    doctypeElem = createDoctype('html');
    insertNode(doctypeElem, document, 'prepend');
  }

  // Title
  if (title) {
    let titleElem = findElementByName(headElem, 'title');
    if (!titleElem) {
      titleElem = createElement('title', null, [createText(title)]);
      insertNode(titleElem, headElem, 'prepend');
    }
  }

  // Google font prefetches
  addLink({ rel: 'preconnect', href: 'https://fonts.googleapis.com' });
  addLink({ rel: 'preconnect', href: 'https://fonts.gstatic.com' });

  // Application stylesheets
  options.stylesheets?.forEach((stylesheet) => {
    addLink({ rel: 'stylesheet', href: stylesheet.url });
  });

  // Google font CSS
  addLink({ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Poppins&display=swap' });

  // Add <meta> description
  if (description) {
    setMeta({ name: "description", content: description });
  }

  // App icons
  if (iconUrl) {
    addLink({ rel: 'apple-touch-icon', href: iconUrl });
    addLink({ rel: 'shortcut icon', href: iconUrl });
  }

  // Theme
  setMeta({ name: "theme-color", content: "#eeeeee", media: "(prefers-color-scheme: light)" });
  setMeta({ name: "theme-color", content: "#22262d", media: "(prefers-color-scheme: dark)" });
  
  // Apple mobile specifics
  setMeta({ name: "apple-mobile-web-app-capable", content: "yes" });

  // Open graph
  if (title) {
    setMeta({ name: "apple-mobile-web-app-title", content: title });
    setMeta({ property: "og:title", content: title });
    setMeta({ property: "og:site_name", content: title });
  }
  if (description) {
    setMeta({ property: "og:description", content: description });
  }
  if (image) {
    setMeta({ property: "og:image", content: image });
  }
  if (url) {
    setMeta({ property: "og:url", content: url });
  }
  setMeta({ property: "og:type", content: "website" });


  // App `manifest.json`
  if (manifestUrl) {
    addLink({ rel: 'manifest', href: manifestUrl });
  }

  // Canonical URL
  if (url) {
    addLink({ rel: 'canonical', href: url });
  }

  // Add these last so they appear at the top of the <head> element
  setMeta({ name: "viewport", content: 'width=device-width,initial-scale=1'}, 'prepend' );
  setMeta({ charset: "utf-8" }, 'prepend');

  // Add application <script> elements
  options.scripts?.forEach((script) => {
    const attrs = {
      src: script.url
    }
    if (script.isEsModule) {
      attrs.type = 'module';
    }
    insertNode(createElement('script', attrs), bodyElem);
  });

  trimWhitespaceNodes(document);

  return stringifyHtml(document.children);
};
