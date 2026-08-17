function recolorMarkerAtPlayhead(colorIndex) {
  var c = getComp(); if (!c) return "No comp";
  var markers = c.markerProperty;
  var t = c.time;
  for (var i = 1; i <= markers.numKeys; i++) {
    var mt = markers.keyTime(i);
    var mv = markers.keyValue(i);
    if (t >= mt && t <= mt + mv.duration) {
      return _undo("TNK: Recolor Marker", function() {
        mv.label = colorIndex;
        markers.setValueAtKey(i, mv);
        return "Marker recolored";
      });
    }
  }
  return "No marker at playhead";
}
