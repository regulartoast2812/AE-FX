function animOutDir(params, dir) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var outTime = params ? (params.outTime || 1)  : 1;
  var pixels  = params ? (params.pixels  || 100): 100;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Animation Out (" + dir + ")", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      try { var ex = layer.effect("Animation - Out"); if (ex) layer.Effects.property("Animation - Out").remove(); } catch(e) {}
      var fx = layer.Effects.addProperty("ADBE Geometry2"); fx.name = "Animation - Out";
      var cp = fx.property("Position").value;
      var ep;
      if      (dir === "up")    ep = [cp[0], cp[1] - pixels];
      else if (dir === "down")  ep = [cp[0], cp[1] + pixels];
      else if (dir === "left")  ep = [cp[0] - pixels, cp[1]];
      else                      ep = [cp[0] + pixels, cp[1]];
      var pos = fx.property("Position");
      pos.setValueAtTime(layer.outPoint - outTime, cp);
      pos.setValueAtTime(layer.outPoint, ep);
      try { pos.setTemporalEaseAtKey(1, [eIn], [eOut]); pos.setTemporalEaseAtKey(2, [eIn], [eOut]); } catch(e) {}
      var op = fx.property("Opacity");
      if (op) {
        var cur = op.value;
        op.setValueAtTime(layer.outPoint - outTime, cur);
        op.setValueAtTime(layer.outPoint, 0);
        op.setTemporalEaseAtKey(1, [eIn], [eOut]);
        op.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Anim out (" + dir + ") on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}
