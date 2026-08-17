function lockSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Lock Selected", function() {
    for (var i = 0; i < layers.length; i++) layers[i].locked = true;
    return "Locked " + layers.length + " layers";
  });
}
