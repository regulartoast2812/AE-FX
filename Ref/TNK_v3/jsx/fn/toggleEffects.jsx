function toggleEffects() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Effects", function() {
    for (var i = 0; i < layers.length; i++) {
      try { layers[i].property("Effects").enabled = !layers[i].property("Effects").enabled; } catch(e) {}
    }
    return "Effects toggled";
  });
}
