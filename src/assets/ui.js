/* eslint-disable */

var mode = $('#control-display-mode').val();

$(document).ready(function() {
  $('select').material_select();

  $('#control-display-mode').on('change', function() {
    mode = this.value;
    console.log('mode', mode);
    updateMode(true);
  });
});
