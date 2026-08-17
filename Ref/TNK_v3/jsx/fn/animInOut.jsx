function animInOut(params, dir) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime  = params ? (params.inTime  || 1)  : 1;
  var outTime = params ? (params.outTime || 1)  : 1;
  var pixels  = params ? (params.pixels  || 100): 100;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  var d = dir || "up";
  return _undo("TNK: Animation In+Out (" + d + ")", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      // IN
      try { var exi = layer.effect("Animation - In"); if (exi) layer.Effects.property("Animation - In").remove(); } catch(e) {}
      var fxIn = layer.Effects.addProperty("ADBE Geometry2"); fxIn.name = "Animation - In";
      var cp = fxIn.property("Position").value;
      var sp;
      if      (d === "up")    sp = [cp[0], cp[1] + pixels];
      else if (d === "down")  sp = [cp[0], cp[1] - pixels];
      else if (d === "left")  sp = [cp[0] + pixels, cp[1]];
      else                    sp = [cp[0] - pixels, cp[1]];
      var posIn = fxIn.property("Position");
      posIn.setValueAtTime(layer.inPoint, sp);
      posIn.setValueAtTime(layer.inPoint + inTime, cp);
      posIn.setTemporalEaseAtKey(1, [eIn], [eOut]);
      posIn.setTemporalEaseAtKey(2, [eIn], [eOut]);
      var opIn = fxIn.property("Opacity");
      if (opIn) {
        opIn.setValueAtTime(layer.inPoint, 0);
        opIn.setValueAtTime(layer.inPoint + inTime, 100);
        opIn.setTemporalEaseAtKey(1, [eIn], [eOut]);
        opIn.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
      // OUT
      try { var exo = layer.effect("Animation - Out"); if (exo) layer.Effects.property("Animation - Out").remove(); } catch(e) {}
      var fxOut = layer.Effects.addProperty("ADBE Geometry2"); fxOut.name = "Animation - Out";
      var ep;
      if      (d === "up")    ep = [cp[0], cp[1] - pixels];
      else if (d === "down")  ep = [cp[0], cp[1] + pixels];
      else if (d === "left")  ep = [cp[0] - pixels, cp[1]];
      else                    ep = [cp[0] + pixels, cp[1]];
      var posOut = fxOut.property("Position");
      posOut.setValueAtTime(layer.outPoint - outTime, cp);
      posOut.setValueAtTime(layer.outPoint, ep);
      try { posOut.setTemporalEaseAtKey(1, [eIn], [eOut]); posOut.setTemporalEaseAtKey(2, [eIn], [eOut]); } catch(e) {}
      var opOut = fxOut.property("Opacity");
      if (opOut) {
        opOut.setValueAtTime(layer.outPoint - outTime, 100);
        opOut.setValueAtTime(layer.outPoint, 0);
        opOut.setTemporalEaseAtKey(1, [eIn], [eOut]);
        opOut.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Anim in+out (" + d + ") on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}
