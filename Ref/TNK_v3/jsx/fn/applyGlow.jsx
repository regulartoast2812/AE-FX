function applyGlow() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Glow", function() {
    for (var i = 0; i < layers.length; i++) {
      try { layers[i].property("Effects").addProperty("ADBE Glow2"); } catch(e) {}
    }
    return "Glow applied";
  });
}
