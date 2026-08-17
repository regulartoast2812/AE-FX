// layerMarkersToCompNumbered — number layer markers sequentially then move to comp
function layerMarkersToCompNumbered() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Layer Markers to Comp (Numbered)", function() {
    // 1. Collect all layer markers across selected layers, sorted by time
    var all = [];
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = 1; m <= mp.numKeys; m++) {
        all.push({ time: mp.keyTime(m), val: mp.keyValue(m) });
      }
    }
    all.sort(function(a, b) { return a.time - b.time; });

    // 2. Write to comp timeline with sequential numbers as labels
    for (var j = 0; j < all.length; j++) {
      var mv = new MarkerValue(String(j + 1));
      mv.duration        = all[j].val.duration;
      mv.label           = all[j].val.label;
      mv.protectedRegion = all[j].val.protectedRegion;
      comp.markerProperty.setValueAtTime(all[j].time, mv);
    }
    return all.length + " marker" + (all.length !== 1 ? "s" : "") + " numbered and moved to comp";
  });
}
