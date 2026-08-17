function applyEaseInOut(params) {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  var ei = params ? params.easeIn  : 75;
  var eo = params ? params.easeOut : 75;
  return _undo("TNK: Ease In/Out", function() {
    for (var i = 0; i < layers.length; i++) {
      var props = layers[i].selectedProperties;
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (!prop.canVaryOverTime) continue;
        for (var k = 1; k <= prop.numKeys; k++) {
          try {
            var eIn  = new KeyframeEase(0, ei);
            var eOut = new KeyframeEase(0, eo);
            prop.setTemporalEaseAtKey(k, [eIn], [eOut]);
          } catch(e) {}
        }
      }
    }
    return "Ease applied";
  });
}
