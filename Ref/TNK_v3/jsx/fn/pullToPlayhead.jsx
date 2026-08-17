function pullToPlayhead(useOut) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Pull to Playhead", function() {
    var t = comp.time;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var dur = layer.outPoint - layer.inPoint;
      if (useOut) {
        layer.outPoint = t;
        layer.inPoint  = t - dur;
      } else {
        layer.inPoint  = t;
        layer.outPoint = t + dur;
      }
    }
    return "Pulled to playhead";
  });
}
