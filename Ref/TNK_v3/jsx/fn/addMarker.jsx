function addMarker(label) {
  var c = getComp(); if (!c) return "No comp";
  return _undo("TNK: Add Marker", function() {
    var mv = new MarkerValue(label || "");
    var layers = getSelectedLayers();
    if (layers.length > 0) {
      for (var i = 0; i < layers.length; i++) {
        layers[i].property("Marker").setValueAtTime(c.time, mv);
      }
      return "Marker added to " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
    } else {
      c.markerProperty.setValueAtTime(c.time, mv);
      return "Comp marker added";
    }
  });
}
