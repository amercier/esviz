/* eslint-disable */

var graph = JSON.parse(document.getElementById('data').textContent);

var width = 2000,
    height = 2000;

var color = d3.scale.category20();

var force = d3.layout.force();

var svg = d3.select('body').append('svg')
    .attr('id', 'viz')
    .attr('width', width)
    .attr('height', height)
    .attr('viewbox', '0 0 ' + width + ' ' + height)
    .attr('preserveAspectRatio', 'xMidYMid meet');

    // build the arrow.
    svg.append('svg:defs').selectAll('marker')
        .data(['end'])      // Different link/path types can be defined here
      .enter().append('svg:marker')    // This section adds in the arrows
        .attr('id', String)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', -1.5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

graph.nodes.forEach(function(node) {
  node.group = ['directory', 'file'].indexOf(node.type) + 1;
  node.group = { directory: 2, file: 1 }[node.type];
});

function getNodeIndexById(id) {
  var index;
  graph.nodes.some(function(node, i) {
    if (node.id === id) {
      index = i;
      return true;
    }
  });

  if (!index) {
    console.warn('Can\'t find node', id);
    return 0;
  }

  return index;
}

var modes = {
  dir: { subdir: 0.5, child: 1, import: 0.05 },
  // module: { subdir: 0, child: 0, import: 1 }
  module: { subdir: 0.1, child: 0.1, import: 1 }
};

function updateMode(updateGraph) {
  svg.attr('class', 'mode-' + mode);

  graph.links.forEach(function(link) {
    link.value = modes[mode][link.type];
  });

  if (updateGraph) {
    force.start();
  }
}
updateMode();

graph.links.forEach(function(link) {
  link.group = { subdir: 1, child: 2, import: 3 }[link.type];
  link.source = getNodeIndexById(link.source);
  link.target = getNodeIndexById(link.target);
});

force
  .nodes(graph.nodes)
  .links(graph.links)
  .linkStrength(function(d) {
    return d.value;
  })
  .friction(0.9);

var link = svg.selectAll('.link')
  .data(graph.links);

link.enter().append('line')
  .attr('class', function(d) {
    return ['link', ['link', d.type].join('-'), ['link', d.type, graph.nodes[d.target].type].join('-')].join(' ');
  });

var node = svg.selectAll('.node')
  .data(graph.nodes)
  .enter()
  .append('g')
  .attr('class', function(d) {
    return 'node node-' + d.type;
  })
  .call(force.drag);

node.append('text')
  .attr('dx', 0)
  .attr('dy', '-1em')
  .text(function(d) { return d.name });


var circle = node.append('circle')
circle.append('title')
  .text(function(d) { return d.name; });

force.on('tick', function() {
  link.attr('x1', function(d) { return d.source.x; })
    .attr('y1', function(d) { return d.source.y; })
    .attr('x2', function(d) { return d.target.x; })
    .attr('y2', function(d) { return d.target.y; });

  node.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
});

function updateGraphDimensions() {
  svg.attr('width', window.innerWidth);
  svg.attr('height', window.innerHeight);
  var circleRadius = Math.max(5, Math.min(window.innerWidth, window.innerHeight) / 150);
  svg.selectAll('circle').attr('r', circleRadius);

  var markerSize = circleRadius / 3;
  svg.select('#end')
    .attr('refX', 9 * circleRadius / markerSize)
    .attr('refY', 0)
    .attr('markerWidth', markerSize)
    .attr('markerHeight', markerSize)

  force
    .size([window.innerWidth, window.innerHeight])
    .linkDistance(
      Math.min(100, Math.min(window.innerWidth, window.innerHeight) / 5)
    )
    .charge(-Math.min(window.innerWidth, window.innerHeight) / 2)
    .start();
}
window.addEventListener('resize', updateGraphDimensions);
updateGraphDimensions();
