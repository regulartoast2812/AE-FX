function applyLinear() {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Linear", function() {
    for (var i = 0; i < layers.length; i++) {
      var props = layers[i].selectedProperties;
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (!prop.canVaryOverTime) continue;
        for (var k = 1; k <= prop.numKeys; k++) {
          try {
            var e = new KeyframeEase(0, 0);
            prop.setTemporalEaseAtKey(k, [e], [e]);
          } catch(e2) {}
        }
      }
    }
    return "Linear applied";
  });
}
