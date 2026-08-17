function shapeToMask() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Shape to Mask", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var pathShape = null;
      outer: for (var g = 1; g <= contents.numProperties; g++) {
        try {
          var grp = contents.property(g);
          var gc; try { gc = grp.property("Contents"); } catch(e) { gc = grp; }
          for (var s = 1; s <= gc.numProperties; s++) {
            try {
              var sh = gc.property(s);
              if (sh.matchName === "ADBE Vector Shape - Group" || sh.matchName === "ADBE Vector Shape") {
                pathShape = sh.property("ADBE Vector Shape"); break outer;
              }
              if (sh.matchName === "ADBE Vector Shape - Rect")
                return "Convert Rectangle to Bezier first (right-click path > Convert to Bezier)";
            } catch(e2) {}
          }
        } catch(e) {}
      }
      if (!pathShape) continue;
      var masks = layer.property("Masks");
      var newMask = masks.addProperty("Mask");
      newMask.property("Mask Path").setValue(pathShape.value);
      count++;
    }
    return count ? "Mask created on " + count + " layer" + (count !== 1 ? "s" : "") : "No convertible paths found";
  });
}
