function deleteAllMarkersEverywhere() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Delete All Markers", function() {
    var cm = comp.markerProperty;
    for (var m = cm.numKeys; m >= 1; m--) cm.removeKey(m);
    for (var i = 1; i <= comp.numLayers; i++) {
      var lm = comp.layer(i).property("Marker");
      for (var m = lm.numKeys; m >= 1; m--) lm.removeKey(m);
    }
    return "All markers deleted";
  });
}
