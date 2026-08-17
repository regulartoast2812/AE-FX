function labelLayers(colorIndex) {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Label Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].label = colorIndex;
    return "Layers labeled";
  });
}
