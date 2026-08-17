function toggleAllMarkerProtection() {
  var comp = getComp(); if (!comp) return "No comp";
  var markers = comp.markerProperty;
  if (!markers.numKeys) return "No comp markers";
  return _undo("TNK: Toggle All Marker Protection", function() {
    var firstProtected = markers.keyValue(1).protectedRegion;
    for (var i = 1; i <= markers.numKeys; i++) {
      var mv = markers.keyValue(i);
      mv.protectedRegion = !firstProtected;
      markers.setValueAtKey(i, mv);
    }
    return "All marker protection toggled";
  });
}
