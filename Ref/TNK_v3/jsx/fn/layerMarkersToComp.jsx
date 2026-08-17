function layerMarkersToComp(numberAndMove) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Layer Markers to Comp", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var lm = layer.property("Marker");
      for (var m = 1; m <= lm.numKeys; m++) {
        var mv = lm.keyValue(m);
        var mt = lm.keyTime(m);
        var newMv = new MarkerValue(mv.comment || "");
        newMv.duration = mv.duration; newMv.label = mv.label;
        newMv.protectedRegion = mv.protectedRegion;
        comp.markerProperty.setValueAtTime(mt, newMv);
        count++;
      }
    }
    return count + " marker" + (count !== 1 ? "s" : "") + " transferred to comp";
  });
}
