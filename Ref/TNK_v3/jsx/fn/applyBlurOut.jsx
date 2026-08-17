function applyBlurOut() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Blur Out", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var blur = layer.property("Effects").addProperty("ADBE Camera Lens Blur");
      if (blur) {
        var blurProp = blur.property("ADBE Camera Lens Blur Radius");
        blurProp.setValueAtTime(layer.outPoint - 0.2, 0);
        blurProp.setValueAtTime(layer.outPoint, 15);
      }
    }
    return "Blur out applied";
  });
}
