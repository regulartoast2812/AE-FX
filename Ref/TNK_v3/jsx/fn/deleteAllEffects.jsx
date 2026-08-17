function deleteAllEffects() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Effects", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      while (fx && fx.numProperties > 0) { try { fx.property(1).remove(); } catch(e) { break; } }
    }
    return "Effects deleted";
  });
}
