function clearLayerMarkerNumbers() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Clear Marker Numbers", function() {
    var count = 0;
    for (var j = 0; j < sel.length; j++) {
      var mp = sel[j].property("Marker");
      for (var i = 1; i <= mp.numKeys; i++) {
        var existing = mp.keyValue(i);
        if (!/^\d+$/.test(existing.comment)) continue;
        var nv = new MarkerValue("");
        nv.duration = existing.duration; nv.chapter = existing.chapter;
        nv.url = existing.url; nv.frameTarget = existing.frameTarget;
        mp.setValueAtKey(i, nv); count++;
      }
    }
    return "Cleared " + count + " number" + (count !== 1 ? "s" : "");
  });
}
