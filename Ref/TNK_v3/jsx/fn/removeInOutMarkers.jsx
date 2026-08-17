// removeInOutMarkers — removes any marker labelled IN or OUT from selected layers
function removeInOutMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Remove IN/OUT Markers", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = mp.numKeys; m >= 1; m--) {
        var c = mp.keyValue(m).comment.toUpperCase();
        if (c === "IN" || c === "OUT" || c === "_IN" || c === "_OUT") {
          mp.removeKey(m); count++;
        }
      }
    }
    return count + " IN/OUT marker" + (count !== 1 ? "s" : "") + " removed";
  });
}
