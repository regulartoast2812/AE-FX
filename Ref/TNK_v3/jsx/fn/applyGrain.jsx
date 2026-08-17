function applyGrain() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Grain", function() {
    for (var i = 0; i < layers.length; i++) {
      try { layers[i].property("Effects").addProperty("ADBE Add Grain"); } catch(e) {}
    }
    return "Grain applied";
  });
}
