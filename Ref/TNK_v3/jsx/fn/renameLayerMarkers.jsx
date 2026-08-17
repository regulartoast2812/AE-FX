function renameLayerMarkers(prefix) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Rename Markers", function() {
    var total = 0;
    for (var j = 0; j < layers.length; j++) {
      var mp = layers[j].property("Marker");
      for (var i = 1; i <= mp.numKeys; i++) {
        var mv = mp.keyValue(i);
        mv.comment = prefix ? (prefix + " " + i) : String(i);
        mp.setValueAtKey(i, mv);
        total++;
      }
    }
    return total + " marker" + (total !== 1 ? "s" : "") + " renamed";
  });
}
