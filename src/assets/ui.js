/* eslint-disable */

var mode = $('#control-display-mode').val();

$(document).ready(function() {
  $('select').material_select();

  $('#control-display-mode').on('change', function() {
    mode = this.value;
    console.log('mode', mode);
    updateMode(true);
  });

  $('#control-download').on('click', function() {
    var viz = $('#viz');
    var width = viz.width();
    var height = viz.height();
    var viewBox = '0 0 ' + width  + ' + ' + height;
    var data = [
      '<?xml version="1.0"?>',
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + width + '" height="' + height + '" viewBox="' + viewBox + '" class="mode-' + mode + '">',
      '<style>' + $('#styles').html() + '</style>',
      viz.html(),
      '</svg>'
    ].join('\n');
    download(data, 'esviz.svg', 'image/svg+xml');
  });
});
