function addColoredMarker(colorIndex) {
  var c = getComp(); if (!c) return "No comp";
  return _undo("TNK: Add Colored Marker", function() {
    var m = new MarkerValue(""); m.label = colorIndex || 0;
    var layers = getSelectedLayers();
    if (layers.length > 0) {
      layers[0].property("Marker").setValueAtTime(c.time, m);
    } else {
      c.markerProperty.setValueAtTime(c.time, m);
    }
    return "Marker added";
  });
}
