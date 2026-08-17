function applyVHS() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: VHS", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      try { fx.addProperty("ADBE ChromaticAberration"); } catch(e) {}
      try { fx.addProperty("ADBE Noise"); } catch(e) {}
    }
    return "VHS applied";
  });
}
