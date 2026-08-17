function applyWiggle(params) {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  var freq = params ? (params.wFreq || 3)  : 3;
  var amp  = params ? (params.wAmp  || 20) : 20;
  return _undo("TNK: Wiggle", function() {
    for (var i = 0; i < layers.length; i++) {
      var props = layers[i].selectedProperties;
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (!prop.canSetExpression) continue;
        try { prop.expression = "wiggle(" + freq + "," + amp + ")"; } catch(e) {}
      }
    }
    return "Wiggle applied";
  });
}
