function swapFillStroke() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  function swapGroup(group) {
    var fills = [], strokes = [];
    for (var i = 1; i <= group.numProperties; i++) {
      try {
        var p = group.property(i); var mn = p.matchName;
        if (mn === "ADBE Vector Graphic - Fill") fills.push(p);
        else if (mn === "ADBE Vector Graphic - Stroke") strokes.push(p);
        else if (p.numProperties > 0) swapGroup(p);
      } catch(e) {}
    }
    for (var j = 0; j < Math.min(fills.length, strokes.length); j++) {
      try {
        var fc = fills[j].property("ADBE Vector Fill Color").value;
        var sc = strokes[j].property("ADBE Vector Stroke Color").value;
        fills[j].property("ADBE Vector Fill Color").setValue(sc);
        strokes[j].property("ADBE Vector Stroke Color").setValue(fc);
      } catch(e) {}
    }
  }
  return _undo("TNK: Swap Fill/Stroke", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i] instanceof TextLayer) {
        try {
          var tp = layers[i].property("Source Text"), doc = tp.value;
          if (doc.applyFill && doc.applyStroke) {
            var of = doc.fillColor, os = doc.strokeColor;
            doc.fillColor = os; doc.strokeColor = of; tp.setValue(doc); count++;
          }
        } catch(e) {}
      } else if (layers[i] instanceof ShapeLayer) {
        try { swapGroup(layers[i].property("Contents")); count++; } catch(e) {}
      }
    }
    return "Fill/Stroke swapped on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}
