// Opacity IN — ADBE Geometry2 "Animation - In", Opacity 0→100 at inPoint (75% of inTime).
function animOpacityIn(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime = params ? (params.inTime || 1)   : 1;
  var ei     = params ? (params.easeIn  || 75) : 75;
  var eo     = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Fade In", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      try { var ex = layer.effect("Animation - In"); if (ex) layer.Effects.property("Animation - In").remove(); } catch(e) {}
      var fx = layer.Effects.addProperty("ADBE Geometry2"); fx.name = "Animation - In";
      var op = fx.property("Opacity");
      if (op) {
        op.setValueAtTime(layer.inPoint,                   0);
        op.setValueAtTime(layer.inPoint + inTime * 0.75, 100);
        op.setTemporalEaseAtKey(1, [eIn], [eOut]);
        op.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Fade in on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}
