/* eslint-disable */

var mode = $('#control-display-mode').val();

/**
 * [getVizViewBox description]
 * @param [SVGElement[]] svgElements A list of SVG elements
 * @return {object} An object contaning x, y, width and height
 */
function getSvgViewBox(svgElements, padding) {
  var xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;

  svgElements.forEach(function(element) {
    const rect = element.getBoundingClientRect();
    xMin = Math.min(xMin, rect.left);
    yMin = Math.min(yMin, rect.top);
    xMax = Math.max(xMax, rect.left + rect.width);
    yMax = Math.max(yMax, rect.top + rect.height);
  });

  xMin = Math.floor(xMin);
  yMin = Math.floor(yMin);

  xMax = Math.ceil(xMax);
  yMax = Math.ceil(yMax);

  return {
    x: xMin - (padding.left || padding),
    y: yMin - (padding.top || padding),
    width: xMax - xMin + (padding.left || padding) + (padding.right || padding),
    height: yMax - yMin + (padding.top || padding) + (padding.bottom || padding)
  };
}

$(document).ready(function() {
  $('select').material_select();

  $('#control-display-mode').on('change', function() {
    mode = this.value;
    updateMode(true);
  });

  $('#control-download').on('click', function() {
    var viz = $('#viz');
    var viewBox = getSvgViewBox(viz.children(':not(style, defs)').toArray(), 20);
    var viewBoxAttr = [viewBox.x, viewBox.y, viewBox.width, viewBox.height].join(' ');

    var data = [
      '<?xml version="1.0"?>',
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"'
        + ' width="' + viewBox.width + '" height="' + viewBox.height + '"'
        + ' viewBox="' + viewBoxAttr + '" class="mode-' + mode + '">',
      '<style>' + $('#styles').html() + '</style>',
      viz.html(),
      '</svg>'
    ].join('\n');
    download(data, 'esviz.svg', 'image/svg+xml');
  });
});
