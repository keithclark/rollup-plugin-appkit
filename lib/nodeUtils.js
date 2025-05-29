import { NODE_TYPE_TEXT, NODE_TYPE_ELEMENT, NODE_TYPE_DOCTYPE } from '@keithclark/tiny-parsers';

/**
 * @typedef {import("./html/types.js").Tree} Tree 
 * @typedef {import("./html/types.js").Node} Node
 * 
 * @typedef {(node:Node)=>*} NodePredicate
 */

/**
 * @typedef {'prepend'|'append'} InsertPoint
 */


/**
 * A generator that recursively walks a node tree
 * 
 * @return {Generator<Node>}
 */
function* walkTree(tree) {
  const queue = [tree];
  while (queue.length) {
    const value = queue.shift();
    yield value;
    if (value.children) {
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
 * @returns {Node[]} An array of `Node` instances that passed the predicate test
 */
export const findNodes = (startNode, predicate) => {
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
 * @param {Node} parentNode the node that will be parent
 * @param {InsertPoint} [position] where to insert the node.
 * @returns {Node}
 */
export const insertNode = (node, parentNode, position) => {
  if (position === 'prepend') {
    parentNode.children.unshift(node);
    parentNode.children.unshift(createText('\n'));
  } else {
    parentNode.children.push(node);
    parentNode.children.push(createText('\n'));
  } 
  return node;
}


export const createText = (text) => ({
  type: NODE_TYPE_TEXT,
  value: text
});


export const createElement = (name, attributes = {}, children = []) => ({
  type: NODE_TYPE_ELEMENT,
  name,
  attributes,
  children
});


export const createDoctype = (name) => ({
  type: NODE_TYPE_DOCTYPE,
  name
});
