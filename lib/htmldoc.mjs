import { NODE_TYPE_DOCTYPE } from '@keithclark/tiny-parsers';
import { createDoctype, createElement, createText, findElementByName, findNode, findNodesByType, insertNode } from './nodeUtils.js';

/**
 * @typedef {import('./html2/types.js').Node} Node 
 * @typedef {import('./html2/types.js').NodeList} NodeList 
 * @typedef {import('./html2/types.js').AttributeList} AttributeList 
 */


/**
 * 
 * @param {NodeList} nodes 
 * @param {*} options 
 * @returns 
 */
export const createDocument = (nodes, options = {}) => {

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
      if (attributes.name) {
        if (headElem.children.some((node) => node.attributes?.name == attributes.name)) {
          return
        }
      }
    }
    insertNode(createElement('meta', attributes), headElem, position);
  };

  const document = {
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

  let doctypeElem = findNode(document, (node) => node.type === NODE_TYPE_DOCTYPE);
  let htmlElem = findElementByName(document, 'html');
  let headElem = findElementByName(document, 'head');
  let bodyElem = findElementByName(document, 'body');

  if (!doctypeElem) {
    doctypeElem = createDoctype('html');
    if (htmlElem) {
      document.children = [doctypeElem, createText('\n'), ...document.children]
    }
  }

  if (!htmlElem) {
    htmlElem = createElement('html', { lang: 'en' }, document.children.filter(e => e !== doctypeElem));
    document.children = [doctypeElem, createText('\n'), htmlElem]
  }

  if (!bodyElem) {
    bodyElem = createElement('body');
    if (headElem) {
      bodyElem.children = htmlElem.children.filter(e => e !== headElem);
      htmlElem.children = [headElem, createText('\n'), bodyElem];
    } else {
      bodyElem.children = htmlElem.children;
      htmlElem.children = [bodyElem];
    }
  }

  if (!headElem) {
    headElem = createElement('head', null, []);
    insertNode(headElem, htmlElem, 'prepend')
  }

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
  setMeta({ name: "apple-mobile-web-app-title", content: title });

  // Open graph
  if (title) {
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

  // Add these last so they appear at the top of the <head> element
  setMeta({ name: "viewport", content: 'width=device-width,initial-scale=1'}, 'prepend' );
  setMeta({ charset: "utf-8" }, 'prepend');

  // Add application <script> elements
  options.scripts?.forEach((script) => {
    insertNode(createElement('script', {src: script.url}), bodyElem);
  });

  return document.children;
};
