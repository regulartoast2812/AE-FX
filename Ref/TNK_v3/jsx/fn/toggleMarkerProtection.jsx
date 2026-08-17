function toggleMarkerProtection() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Toggle Marker Protection", function() {
    var t = comp.time;
    var markers = comp.markerProperty;
    for (var i = 1; i <= markers.numKeys; i++) {
      var mt = markers.keyTime(i);
      var mv = markers.keyValue(i);
      if (mv.duration > 0 && t >= mt && t <= mt + mv.duration) {
        mv.protectedRegion = !mv.protectedRegion;
        markers.setValueAtKey(i, mv);
      }
    }
    return "Marker protection toggled";
  });
}
