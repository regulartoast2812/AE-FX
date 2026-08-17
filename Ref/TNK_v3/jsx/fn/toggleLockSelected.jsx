function toggleLockSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Lock", function() {
    var anyUnlocked = false;
    for (var i = 0; i < layers.length; i++) { if (!layers[i].locked) { anyUnlocked = true; break; } }
    for (var i = 0; i < layers.length; i++) layers[i].locked = anyUnlocked;
    return anyUnlocked ? "Layers locked" : "Layers unlocked";
  });
}
