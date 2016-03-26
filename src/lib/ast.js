import { readFile } from 'fs';
import { basename, dirname, extname, join, normalize, relative } from 'path';

import { Promise, promisify } from 'bluebird';
import { parse } from 'esprima';
import { partialRight, values } from 'lodash';
import { walk } from 'walk';

const preadFile = promisify(readFile);

/**
 * Tansform an arrat of file stats into an error message
 * @param {{type: string, error: Error, name: String}[]} nodeStatsArray Array of file stats
 * @return {string} Return an error message
 */
export function getErrorMessage(nodeStatsArray) {
  return nodeStatsArray
    .map(n => `[ERROR] ${n.name} ${n.error.message || `${n.error.code}: ${n.error.path}`}`)
    .join('\n');
}

/**
 * Get a node id from a relative path
 * @param {string} path Relative path
 * @return {[type]}      [description]
 */
export function getNodeId(path) {
  return path === '.' ? '/' : path;
}

/**
 * Build a node from a path
 * @param {string} path Relative path
 * @param {string} type Type of node
 * @return {{string} id, {string} name, {string} type} A new node
 */
export function buildNodeFromPath(path, type) {
  const id = getNodeId(path);
  const name = basename(id);
  return { id, name, type };
}

/**
 * Build a node from a file path
 * @param {string} path Relative path
 * @return {{string} id, {string} name, {string} type} A new node
 */
const buildNodeFromFile = partialRight(buildNodeFromPath, 'module');

/**
 * Build a node from a directory path
 * @param {string} path Relative path
 * @return {{string} id, {string} name, {string} type} A new node
 */
const buildNodeFromDirectory = partialRight(buildNodeFromPath, 'directory');

/**
 * Build a link from a node to its parent
 * @param {string} nodeId Child node id
 * @param {string} type Link type
 * @return {{string} source, {string} target, {string} type} A new link
 */
export function buildLinkToParentNode(nodeId, type) {
  const source = getNodeId(dirname(nodeId));
  const target = nodeId;
  return { source, target, type };
}

/**
 * Build a node and a link to its parent from a directory path
 * @param {string} path Relative path
 * @return {{object} node, {object} link} A new node and a new link to its parent
 */
export function buildItemsFromDirectory(path) {
  const node = buildNodeFromDirectory(path);
  const link = buildLinkToParentNode(node.id, 'subdir');
  return { node, link };
}

/**
 * Build a node and a link to its parent from a file path
 * @param {string} path Relative path
 * @return {{object} node, {object} link} A new node and a new link to its parent
 */
export function buildItemsFromFile(path) {
  const node = buildNodeFromFile(path);
  const link = buildLinkToParentNode(node.id, 'child');
  return { node, link };
}

/**
 * Test whether a path is a module path
 * @param {string} path Relative path
 * @return {boolean} Whether the given path is a module
 */
export function isModule(path) {
  const extension = extname(path);
  return ['.js', '.es6', '.jsx', '.es'].indexOf(extension) !== -1;
}

/**
 * Tranform a file path into a module path
 * @param {string} path Relative path to a file
 * @return {string} Relative path to the module
 */
export function getModulePath(path) {
  const extension = extname(path);
  return join(dirname(path), basename(path, extension));
}

/**
 * Get all import links from a parsed ES module
 * @param {AST} ast Parsed ES module
 * @param {string} id Id of the module node
 * @return {object[]} An array containing all links from the module modules to its imported modules
 */
export function getImportLinksFromAst(ast, id) {
  return ast.body
    .filter(s => s.type === 'ImportDeclaration')
    .map(importDeclaration => ({
      source: id,
      target: normalize(join(dirname(id), importDeclaration.source.value)),
      type: 'import',
    }));
}

/**
 * Parse an ES module and return all its node and links
 * @param {string} id Id of the module to parse
 * @param {string} path Absolute path to the module file
 * @return {{object}[] nodes, {object}[] links} All nodes and links contained in the ES module
 */
export function parseModule(id, path) {
  const nodes = [];
  const links = [];

  return preadFile(path)
    .then(code => parse(code, { sourceType: 'module' }))
    .then(ast => {
      links.push(...getImportLinksFromAst(ast, id));
      return { nodes, links };
    });
}

/**
 * Parse a directory an return all nodes and links it contains, recursively
 * @param {string} root Absolute path to the directory
 * @return {{object}[] nodes, {object}[] links} All nodes and links contained in the directory
 * and the subdirectories and ES modules it contains, recursively
 */
export function parseDirectory(root) {
  return new Promise((resolve, reject) => {
    const rootId = getNodeId('.');
    const nodes = {
      [rootId]: { id: rootId, name: rootId, type: 'root' },
    };
    const links = [];

    const walker = walk(root, { followLinks: true });

    // Errors
    walker.on('errors', (parent, nodeStatsArray) => reject(getErrorMessage(nodeStatsArray)));

    // End
    walker.on('end', () => resolve({
      nodes: values(nodes),
      links,
    }));

    // Process directories
    walker.on('directory', (parent, fileStats, next) => {
      const path = relative(root, join(parent, fileStats.name));
      const { node, link } = buildItemsFromDirectory(path);
      nodes[node.id] = node;
      links.push(link);
      next();
    });

    // Process files
    walker.on('file', (parent, fileStats, next) => {
      Promise.resolve()
        .then(() => {
          if (!isModule(fileStats.name)) {
            // console.warn(`Warning: ${fileStats.name} is not a ES6 file`);
            return { nodes: [], links: [] };
          }

          const path = relative(root, getModulePath(join(parent, fileStats.name)));
          const { node, link } = buildItemsFromFile(path);
          nodes[node.id] = node;
          links.push(link);

          return parseModule(node.id, join(parent, fileStats.name));
        })
        .then(subGraph => {
          subGraph.nodes.forEach(node => {
            nodes[node.id] = node;
          });
          links.push(...subGraph.links);
        })
        .then(next);
    });
  });
}
