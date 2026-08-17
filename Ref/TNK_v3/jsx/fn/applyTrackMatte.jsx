function applyTrackMatte(mode) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (sel.length < 2) return "Select at least 2 layers";
  if (mode === "break") {
    return _undo("TNK: Break Matte", function() {
      for (var i = 0; i < sel.length; i++) sel[i].trackMatteType = TrackMatteType.NO_TRACK_MATTE;
      return "Matte removed";
    });
  }
  return _undo("TNK: Track Matte", function() {
    var lastLayer = sel[sel.length - 1];
    for (var i = 0; i < sel.length - 1; i++) {
      var layer = sel[i];
      lastLayer.moveBefore(layer);
      layer.trackMatteType = TrackMatteType.ALPHA;
      if (mode === "matte_parent") layer.parent = lastLayer;
      if (mode === "matte_blend")  layer.blendingMode = BlendingMode.ADD;
    }
    for (var i = 0; i < sel.length - 1; i++) sel[i].moveBefore(lastLayer);
    lastLayer.enabled = true; lastLayer.selected = false;
    return "Track matte applied";
  });
}
function breakMatte() { return applyTrackMatte("break"); }
