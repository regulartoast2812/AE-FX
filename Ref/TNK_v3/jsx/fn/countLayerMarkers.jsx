function countLayerMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Count Layer Markers", function() {
    var allMarkers = [];
    for (var j = 0; j < sel.length; j++) {
      var mp = sel[j].property("Marker");
      for (var i = 1; i <= mp.numKeys; i++) {
        var t = mp.keyTime(i);
        if (t >= sel[j].inPoint && t <= sel[j].outPoint)
          allMarkers.push({ layer: sel[j], time: t, keyIndex: i });
      }
    }
    allMarkers.sort(function(a, b) { return a.time - b.time; });
    for (var m = 0; m < allMarkers.length; m++) {
      var entry = allMarkers[m];
      var mp2 = entry.layer.property("Marker");
      var existing = mp2.keyValue(entry.keyIndex);
      var nv = new MarkerValue(String(m + 1));
      nv.duration = existing.duration; nv.chapter = existing.chapter;
      nv.url = existing.url; nv.frameTarget = existing.frameTarget;
      mp2.setValueAtKey(entry.keyIndex, nv);
    }
    return "Numbered " + allMarkers.length + " marker" + (allMarkers.length !== 1 ? "s" : "");
  });
}
