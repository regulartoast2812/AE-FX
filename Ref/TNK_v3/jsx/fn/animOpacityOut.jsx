// Opacity OUT — ADBE Geometry2 "Animation - Out", Opacity current→0 at outPoint (75% of outTime).
function animOpacityOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Fade Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      try { var ex = layer.effect("Animation - Out"); if (ex) layer.Effects.property("Animation - Out").remove(); } catch(e) {}
      var fx = layer.Effects.addProperty("ADBE Geometry2"); fx.name = "Animation - Out";
      var op = fx.property("Opacity");
      if (op) {
        var cur = op.value;
        op.setValueAtTime(layer.outPoint - outTime * 0.75, cur);
        op.setValueAtTime(layer.outPoint,                    0);
        op.setTemporalEaseAtKey(1, [eIn], [eOut]);
        op.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Fade out on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}
