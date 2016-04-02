import { readFile } from 'fs';
import { basename, dirname, extname, join, normalize, relative } from 'path';

import { Promise, promisify } from 'bluebird';
import { parse } from 'esprima';
import { partialRight, values } from 'lodash';
import { walk } from 'walk';

const preadFile = promisify(readFile);

/**
 * Supported file extensions for odules
 * @type {String[]}
 */
export const extensions = ['.js', '.es6', '.jsx', '.es'];

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
 * @return {string} The node id
 */
export function getNodeId(path) {
  return path === '.' ? '/' : path;
}

/**
 * Get a node name from a relative path
 * @param {string} path Relative path
 * @return {string} The node name
 */
export function getNodeName(path) {
  return basename(path);
}

/**
 * Tranform a file path into a module name
 * @param {string} path Relative path to a file
 * @return {string} Relative path to the module
 */
export function getModuleName(path) {
  const extension = extname(path);
  return basename(path, extension);
}

/**
 * Build a node from a file/directory path
 * @param {string} path Relative path
 * @param {string} type Type of node
 * @return {{string} id, {string} name, {string} type} A new node
 */
export function buildNodeFromPath(path, type, namer = getNodeName) {
  return {
    id: getNodeId(path),
    name: namer(path),
    type,
  };
}

/**
 * Test whether a path is a module path
 * @param {string} path Relative path
 * @return {boolean} Whether the given path is a module
 */
export function isModule(path) {
  const extension = extname(path);
  return extensions.indexOf(extension) !== -1;
}

/**
 * Build a node from a file path
 * @param {string} path Relative path
 * @return {{string} id, {string} name, {string} type} A new node
 */
export function buildNodeFromFile(path) {
  return isModule(path)
    ? buildNodeFromPath(path, 'module', getModuleName)
    : buildNodeFromPath(path, 'file');
}

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

export function resolveModule(modulePaths, dir, importName) {
  let resolvedPath;
  extensions.some(extension =>
    modulePaths.some(modulePath => {
      const path = normalize(join(dir, importName + extension));
      if (path === modulePath) {
        resolvedPath = path;
        return true;
      }
      return false;
    })
  );
  return resolvedPath;
}

/**
 * Get all import links from a parsed ES module
 * @param {AST} ast Parsed ES module
 * @param {string} id Id of the module node
 * @return {object[]} An array containing all links from the module modules to its imported modules
 */
export function getImportLinksFromAst(moduleIds, ast, id) {
  return ast.body
    .filter(s => s.type === 'ImportDeclaration')
    .map(importDeclaration => ({
      source: id,
      target: resolveModule(moduleIds, dirname(id), importDeclaration.source.value),
      type: 'import',
    }));
}

/**
 * Parse an ES module and return all its node and links
 * @param {string} id Id of the module to parse
 * @param {string} path Absolute path to the module file
 * @return {{object}[] nodes, {object}[] links} All nodes and links contained in the ES module
 */
export function parseModule(moduleIds, id, path) {
  const nodes = [];
  const links = [];
  return preadFile(path)
    .then(code => parse(code, { sourceType: 'module' }))
    .then(ast => {
      links.push(...getImportLinksFromAst(moduleIds, ast, id));
      return { nodes, links };
    });
}

/**
 * Parse a modules from a graph an return a the graph mutated
 * @param {string} root Path to the root of the graph
 * @param {object} graph An existing graph
 * @return {object} The same graph, with links and nodes added
 */
export function parseModules(root, graph) {
  const moduleIds = Object.keys(graph.nodes);
  return Promise.resolve(values(graph.nodes))
    .filter(node => node.type === 'module')
    .map(node => parseModule(moduleIds, node.id, join(root, node.id)))
    .each(subGraph => {
      graph.links.push(...subGraph.links);
    })
    .then(() => graph);
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
          const path = relative(root, join(parent, fileStats.name));
          const { node, link } = buildItemsFromFile(path);
          nodes[node.id] = node;
          links.push(link);
        })
        .then(next);
    });

    // Errors
    walker.on('errors', (parent, nodeStatsArray) => reject(getErrorMessage(nodeStatsArray)));

    // End
    walker.on('end', () => resolve({ nodes, links }));
  })
  .then(graph => parseModules(root, graph))
  .then(graph => ({
    nodes: values(graph.nodes),
    links: graph.links,
  }));
}
