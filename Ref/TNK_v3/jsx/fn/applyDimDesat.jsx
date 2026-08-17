function applyDimDesat() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Dim + Desat", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      try {
        var lum = fx.addProperty("ADBE Lumetri");
        if (lum) {
          try { lum.property("ADBE Lumetri-0001").property("ADBE Lumetri-0010").setValue(-2); } catch(e) {}
          try { lum.property("ADBE Lumetri-0001").property("ADBE Lumetri-0016").setValue(0); } catch(e) {}
        }
      } catch(e) {}
    }
    return "Dim + Desat applied";
  });
}
