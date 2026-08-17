function addDashesToStroke() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Add Dashes", function() {
    function process(prop) {
      for (var i = 1; i <= prop.numProperties; i++) {
        var p = prop.property(i);
        if (p.matchName === "ADBE Vector Stroke" || p.matchName === "ADBE Vector Graphic - Stroke") {
          var dashes; try { dashes = p.property("ADBE Vector Stroke Dashes"); } catch(e) {}
          if (dashes && dashes.numProperties === 0) {
            dashes.addProperty("ADBE Vector Stroke Dash 1");
            try { dashes.addProperty("ADBE Vector Stroke Gap 1"); } catch(e) {}
          }
        }
        if (p.numProperties) process(p);
      }
    }
    for (var i = 0; i < layers.length; i++) {
      if (!(layers[i] instanceof ShapeLayer)) continue;
      process(layers[i].property("Contents"));
    }
    return "Dashes added";
  });
}
