// Opacity IN+OUT — ADBE Geometry2 on both ends, 0→100 in, current→0 out.
function animOpacityInOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime  = params ? (params.inTime  || 1)  : 1;
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Fade In+Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      // IN
      try { var exi = layer.effect("Animation - In"); if (exi) layer.Effects.property("Animation - In").remove(); } catch(e) {}
      var fxIn = layer.Effects.addProperty("ADBE Geometry2"); fxIn.name = "Animation - In";
      var opIn = fxIn.property("Opacity");
      if (opIn) {
        opIn.setValueAtTime(layer.inPoint,                   0);
        opIn.setValueAtTime(layer.inPoint + inTime * 0.75, 100);
        opIn.setTemporalEaseAtKey(1, [eIn], [eOut]);
        opIn.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
      // OUT
      try { var exo = layer.effect("Animation - Out"); if (exo) layer.Effects.property("Animation - Out").remove(); } catch(e) {}
      var fxOut = layer.Effects.addProperty("ADBE Geometry2"); fxOut.name = "Animation - Out";
      var opOut = fxOut.property("Opacity");
      if (opOut) {
        var cur = opOut.value;
        opOut.setValueAtTime(layer.outPoint - outTime * 0.75, cur);
        opOut.setValueAtTime(layer.outPoint,                    0);
        opOut.setTemporalEaseAtKey(1, [eIn], [eOut]);
        opOut.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Fade in+out on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}
