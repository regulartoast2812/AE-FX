function animInDir(params, dir) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime = params ? (params.inTime || 1)   : 1;
  var pixels = params ? (params.pixels || 100) : 100;
  var ei     = params ? (params.easeIn  || 75) : 75;
  var eo     = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Animation In (" + dir + ")", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      try { var ex = layer.effect("Animation - In"); if (ex) layer.Effects.property("Animation - In").remove(); } catch(e) {}
      var fx = layer.Effects.addProperty("ADBE Geometry2"); fx.name = "Animation - In";
      var cp = fx.property("Position").value;
      var sp;
      if      (dir === "up")    sp = [cp[0], cp[1] + pixels];
      else if (dir === "down")  sp = [cp[0], cp[1] - pixels];
      else if (dir === "left")  sp = [cp[0] + pixels, cp[1]];
      else                      sp = [cp[0] - pixels, cp[1]];
      var pos = fx.property("Position");
      pos.setValueAtTime(layer.inPoint, sp);
      pos.setValueAtTime(layer.inPoint + inTime, cp);
      pos.setTemporalEaseAtKey(1, [eIn], [eOut]);
      pos.setTemporalEaseAtKey(2, [eIn], [eOut]);
      var op = fx.property("Opacity");
      if (op) {
        op.setValueAtTime(layer.inPoint, 0);
        op.setValueAtTime(layer.inPoint + inTime, 100);
        op.setTemporalEaseAtKey(1, [eIn], [eOut]);
        op.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Anim in (" + dir + ") on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}
