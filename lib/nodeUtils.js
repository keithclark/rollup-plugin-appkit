import { NODE_TYPE_TEXT, NODE_TYPE_ELEMENT, NODE_TYPE_DOCTYPE } from '@keithclark/tiny-parsers';

/**
 * @typedef {import("@keithclark/tiny-parsers").SgmlNodeList} NodeList 
 * @typedef {import("@keithclark/tiny-parsers").SgmlNode} Node
 * @typedef {import('@keithclark/tiny-parsers').SgmlElement} Element
 * @typedef {import('@keithclark/tiny-parsers').SgmlText} Text
 * @typedef {import('@keithclark/tiny-parsers').SgmlDoctype} Doctype
 * @typedef {(node:Node)=>boolean} NodePredicate
 * @typedef {'prepend'|'append'} InsertPoint
 */


/**
 * A generator that recursively walks a node tree
 * @param {Node} tree 
 * @returns {Generator<Node>}
 */
function* walkTree(tree) {
  const queue = [tree];
  while (queue.length) {
    const value = queue.shift();
    yield value;
    if (value.type === NODE_TYPE_ELEMENT) {
      queue.push(...value.children);
    }
  }
};


/**
 * Returns the first node from a given tree that passes the test implemented by 
 * the provided function. The starting node is included in the search.
 * 
 * @param {Node} startNode The node to start searching from
 * @param {NodePredicate} predicate The function to run. Returning a truthy value will stop execution and return the current node.
 * @returns {Node|null} A `Node` instance or `null` if no matching node could be found
 */
export const findNode = (startNode, predicate) => {
  for (const node of walkTree(startNode)) {
    if (predicate(node)) {
      return node;
    }
  }
  return null;
};


/**
 * Returns an array of nodes from a given tree that pass the test implemented by 
 * the provided function. The starting node is included in the search.
 * 
 * @param {Node} startNode The node to start searching from
 * @param {NodePredicate} predicate The function to run. Returning a truthy value will add the current node to the results.
 * @returns {NodeList} An array of `Node` instances that passed the predicate test
 */
export const findNodes = (startNode, predicate) => {
  /** @type {NodeList} */
  const results = [];
  for (const node of walkTree(startNode)) {
    if (predicate(node)) {
      results.push(node);
    }
  }
  return results;
};


/**
 * Searches the supplied nodes and their descendants looking for any that match
 * with the giventype.
 * 
 * @param {NodeList} nodes A collection of nodes to search
 * @param {number} type The node type find
 * @returns {NodeList|null}
 */
export const findNodesByType = (nodes, type) => {
  return findNodes(nodes, (node) => {
    return node.type === type;
  });
};


/**
 * Searches the supplied nodes and their descendants looking for any elements 
 * with the given tag name.
 * 
 * @param {NodeList} nodes A collection of nodes to search
 * @param {string} name The name of the element to find
 * @returns {NodeList|null}
 */
export const findElementsByName = (nodes, name) => {
  return findNodes(nodes, (node) =>{
    return node.type === NODE_TYPE_ELEMENT && node.name === name
  });
};


/**
 * Searches the supplied nodes and their descendants looking for the first  
 * element with the given tag name.
 * 
 * @param {NodeList} nodes A collection of nodes to search
 * @param {string} name The name of the element to find
 * @returns {Node|null}
 */
export const findElementByName = (tree, name) => {
  return findNode(tree, (node) => {
    return node.type === NODE_TYPE_ELEMENT && node.name === name
  });
};


/**
 * Inserts a node into the node tree.
 * 
 * @param {Node} node The node to insert
 * @param {Element} parentNode the node that will be parent
 * @param {InsertPoint} [position] where to insert the node.
 * @returns {Node}
 */
export const insertNode = (node, parentNode, position) => {
  if (node.type === NODE_TYPE_TEXT) {
    if (position === 'prepend') {
      parentNode.children.unshift(node);
    } else {
      parentNode.children.push(node);
    }
  } else if (node.type === NODE_TYPE_ELEMENT || node.type === NODE_TYPE_DOCTYPE) {
    if (position === 'prepend') {
      // if the current first child is an element, add a line break
      if (parentNode.children.at(0)?.type === NODE_TYPE_ELEMENT) {
        parentNode.children.unshift(createText('\n'));
      }
      parentNode.children.unshift(node);
      parentNode.children.unshift(createText('\n'));
    } else {
      if (parentNode.children.at(-1)?.type === NODE_TYPE_ELEMENT) {
        parentNode.children.push(createText('\n'));
      }
      parentNode.children.push(node);
      parentNode.children.push(createText('\n'));
    } 
  }
  return node;
};


/**
 * Moves a node from one parent to another in the same or different tree
 * 
 * @param {Node} node The node to insert
 * @param {Element} currentParentNode the current parent of the node
 * @param {Element} newParentNode the parent that will adopt the node
 * @param {InsertPoint} [position] where to insert the node.
 * @returns {Node}
 */
export const adoptNode = (node, currentParentNode, newParentNode, position) => {
  const removedNode = removeNode(node, currentParentNode);
  if (position === 'prepend') {
    newParentNode.children.unshift(removedNode);
  } else {
    newParentNode.children.push(removedNode);
  }
  return node;
};


/**
 * Removes a node from a parent
 * 
 * @param {Node} node The node to remove
 * @param {Element} parentElement the current parent of the node
 * @returns {Node}
 */
export const removeNode = (node, parentElement) => {
  const index = parentElement.children.indexOf(node);
  if (index == -1) {
    throw new Error('Invalid node structure');
  }
  return parentElement.children.splice(index, 1)[0];
};


/**
 * Creates a new SgmlText node containing text content 
 * @param {string} value The text content of the node
 * @returns {SgmlText}
 */
export const createText = (value) => ({
  type: NODE_TYPE_TEXT,
  value
});


/**
 * Creates a new SgmlText node containing text content 
 * @param {string} value The text content of the node
 * @param {{[name: string]: string}} [attributes] Node attributes
 * @param {NodeList} [children] Node children
 * @returns {Element}
 */
export const createElement = (name, attributes = {}, children = []) => ({
  type: NODE_TYPE_ELEMENT,
  name,
  attributes,
  children
});


/**
 * Creates a new SgmlDoctype node
 * @param {string} name The name of the doctype
 * @returns {Doctype}
 */
export const createDoctype = (name) => ({
  type: NODE_TYPE_DOCTYPE,
  name
});


/**
 * Determines if a node is text type and only contains whitespace characters
 * 
 * @param {Node} node The node to check
 * @returns {boolean}
 */
export const isWhitespaceNode = (node) => {
  return node.type === NODE_TYPE_TEXT && node.value.trim() === '';
};


/**
 * Removes the first and last nodes from a node list if they only contain 
 * whitespace characters
 * 
 * @param {NodeList} nodeList 
 */
export const trimWhitespaceNodes = (nodeList) => {
  const [firstChild] = nodeList.children;
  if (firstChild && isWhitespaceNode(firstChild)) {
    removeNode(firstChild, nodeList);
  }
  const lastChild = nodeList.children.at(-1);
  if (lastChild && isWhitespaceNode(lastChild)) {
    removeNode(lastChild, nodeList);
  }
};


/**
 * Determines if an element is sensative to whitespace normalization
 * @param {Element} node 
 * @returns {boolean}
 */
export const isWhitespaceSensitiveElement = (node) => {
  const { name } = node;
  return (
    name === 'pre' ||
    name === 'textarea' ||
    name === 'script' ||
    name === 'style'
  );
};


/**
 * Determines if a node belongs in the `<head>` element
 * 
 * @param {Node} node The node to check
 * @returns {boolean}
 */
export const isHeadChildNode = (node) => {
  if (node.type !== NODE_TYPE_ELEMENT) {
    return false;
  }
  return (
    node.name === 'link' || 
    node.name === 'title' || 
    node.name === 'meta' ||
    node.name === 'style'
  );
};