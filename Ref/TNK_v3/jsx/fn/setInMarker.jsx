function setInMarker() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var t = comp.time;
  return _undo("TNK: Set IN Marker", function() {
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = mp.numKeys; m >= 1; m--) {
        var c = mp.keyValue(m).comment;
        if (c === "IN" || c === "_IN" || c === "in") mp.removeKey(m);
      }
      var mv = new MarkerValue("IN");
      mp.setValueAtTime(t, mv);
    }
    return "IN marker set";
  });
}
