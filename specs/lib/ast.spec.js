import { dirname, join } from 'path';

import { expect } from 'chai';

import { ast } from '../../src/lib/index';

const fixturePath = join(dirname(__dirname), 'fixture');

/** @test {ast} */
describe('ast', () => {
  it('exists', () => {
    expect(ast.parseDirectory).to.exist;
  });

  it('is an object', () => {
    expect(ast).to.be.an('object');
  });

  /** @test {parseDirectory} */
  describe('parseDirectory', () => {
    let result;

    beforeEach(() =>
      ast.parseDirectory(fixturePath).then(graph => {
        result = graph;
      })
    );

    it('exists', () => {
      expect(ast.parseDirectory).to.exist;
    });

    it('returns a thenable', () => {
      expect(ast.parseDirectory(fixturePath)).to.have.property('then').that.is.a('function');
    });

    it('returns an obect', () => {
      expect(result).to.be.an('object');
    });

    it('returns an object that contains an array of nodes', () => {
      expect(result).to.have.property('nodes').that.is.an('array');
    });

    it('adds a root node', () => {
      expect(result.nodes).to.deep.contain({ id: '/', name: '/', type: 'root' });
    });

    it('adds directory nodes', () => {
      [
        { id: 'lib', name: 'lib', type: 'directory' },
        { id: 'lib/arithmetic', name: 'arithmetic', type: 'directory' },
        { id: 'lib/geometry', name: 'geometry', type: 'directory' },
        { id: 'lib/util', name: 'util', type: 'directory' },
      ].forEach(dirNode => expect(result.nodes).to.deep.contain(dirNode));
    });

    it('adds module nodes', () => {
      [
        { id: 'lib.js', name: 'lib', type: 'module' },
        { id: 'lib/arithmetic/tripple.js', name: 'tripple', type: 'module' },
        { id: 'lib/geometry/polygon.js', name: 'polygon', type: 'module' },
        { id: 'lib/geometry/rectangle.js', name: 'rectangle', type: 'module' },
        { id: 'lib/geometry/square.js', name: 'square', type: 'module' },
        { id: 'lib/util/console.js', name: 'console', type: 'module' },
      ].forEach(dirNode => expect(result.nodes).to.deep.contain(dirNode));
    });

    it('adds dir -> subdir links', () => {
      [
        { source: 'lib', target: 'lib/arithmetic', type: 'subdir' },
        { source: 'lib', target: 'lib/geometry', type: 'subdir' },
        { source: 'lib', target: 'lib/util', type: 'subdir' },
      ].forEach(dirNode => expect(result.links).to.deep.contain(dirNode));
    });

    it('adds root -> dir subdir links', () => {
      expect(result.links).to.deep.contain({ source: '/', target: 'lib', type: 'subdir' });
    });

    it('adds dir -> module child links', () => {
      [
        { source: 'lib/arithmetic', target: 'lib/arithmetic/tripple.js', type: 'child' },
        { source: 'lib/geometry', target: 'lib/geometry/polygon.js', type: 'child' },
        { source: 'lib/geometry', target: 'lib/geometry/rectangle.js', type: 'child' },
        { source: 'lib/geometry', target: 'lib/geometry/square.js', type: 'child' },
        { source: 'lib/util', target: 'lib/util/console.js', type: 'child' },
      ].forEach(dirNode => expect(result.links).to.deep.contain(dirNode));
    });

    it('adds root -> module child links', () => {
      expect(result.links).to.deep.contain({ source: '/', target: 'lib', type: 'subdir' });
    });

    it('adds module import links', () => {
      [
        { source: 'lib.js', target: 'lib/geometry/polygon.js', type: 'import' },
        { source: 'lib.js', target: 'lib/geometry/rectangle.js', type: 'import' },
        { source: 'lib.js', target: 'lib/geometry/square.js', type: 'import' },
        { source: 'lib.js', target: 'lib/arithmetic/tripple.js', type: 'import' },
        { source: 'lib.js', target: 'lib/util/console.js', type: 'import' },
        { source: 'lib/geometry/polygon.js', target: 'lib/util/console.js', type: 'import' },
        { source: 'lib/geometry/rectangle.js', target: 'lib/util/console.js', type: 'import' },
        { source: 'lib/geometry/rectangle.js', target: 'lib/geometry/polygon.js', type: 'import' },
        { source: 'lib/geometry/square.js', target: 'lib/geometry/polygon.js', type: 'import' },
      ].forEach(dirNode => expect(result.links).to.deep.contain(dirNode));
    });

    // it('debug', () => {
    //   console.log(result);
    // });
  });
});
