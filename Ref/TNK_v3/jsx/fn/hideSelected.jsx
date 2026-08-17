function hideSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Hide Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].enabled = false;
    return "Layers hidden";
  });
}
