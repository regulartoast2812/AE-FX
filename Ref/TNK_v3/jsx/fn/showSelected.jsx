function showSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Show Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].enabled = true;
    return "Layers shown";
  });
}
