function toggleVisibility() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Visibility", function() {
    var anyVisible = false;
    for (var i = 0; i < layers.length; i++) { if (layers[i].enabled) { anyVisible = true; break; } }
    for (var i = 0; i < layers.length; i++) layers[i].enabled = !anyVisible;
    return anyVisible ? "Layers hidden" : "Layers shown";
  });
}
