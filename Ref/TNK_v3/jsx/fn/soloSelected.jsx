function soloSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Solo Selected", function() {
    var anyNotSoloed = false;
    for (var i = 0; i < layers.length; i++) { if (!layers[i].solo) { anyNotSoloed = true; break; } }
    for (var i = 0; i < layers.length; i++) layers[i].solo = anyNotSoloed;
    return anyNotSoloed ? "Soloed" : "Unsoloed";
  });
}
