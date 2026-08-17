function applyBlurInOut() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Blur In+Out", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var fx = layer.property("Effects");
      var blur = fx.addProperty("ADBE Camera Lens Blur");
      if (blur) {
        var blurProp = blur.property("ADBE Camera Lens Blur Radius");
        blurProp.setValueAtTime(layer.inPoint, 15);
        blurProp.setValueAtTime(layer.inPoint + 0.2, 0);
        blurProp.setValueAtTime(layer.outPoint - 0.2, 0);
        blurProp.setValueAtTime(layer.outPoint, 15);
      }
    }
    return "Blur in+out applied";
  });
}
