function deleteUnnamedMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete Unnamed Markers", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = mp.numKeys; m >= 1; m--) {
        if (!mp.keyValue(m).comment) { mp.removeKey(m); count++; }
      }
    }
    return count + " unnamed marker" + (count !== 1 ? "s" : "") + " deleted";
  });
}
