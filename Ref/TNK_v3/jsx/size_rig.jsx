function applySizeRig() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var count = 0;
  return _undo("TNK: Size Rig", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;

      // Add Width + Height sliders to Effects
      var fx = layer.property("Effects");
      var wFx = fx.addProperty("ADBE Slider Control");
      wFx.name = "Width";
      var hFx = fx.addProperty("ADBE Slider Control");
      hFx.name = "Height";

      var applied = false;
      var contents = layer.property("Contents");

      // Walk top-level items in Contents
      for (var g = 1; g <= contents.numProperties; g++) {
        if (applied) break;
        try {
          var topItem = contents.property(g);
          // Each top item is typically an ADBE Vector Group
          // Try to get its Contents
          var groupContents;
          try { groupContents = topItem.property("Contents"); } catch(e) { groupContents = null; }
          if (!groupContents) groupContents = topItem; // fallback: treat directly

          // Walk items inside the group
          for (var s = 1; s <= groupContents.numProperties; s++) {
            if (applied) break;
            try {
              var shapeItem = groupContents.property(s);
              var mn = shapeItem.matchName;
              // Rectangle path
              if (mn === "ADBE Vector Shape - Rect") {
                var sizeProp = shapeItem.property("ADBE Vector Rect Size");
                var curSize = sizeProp.value;
                wFx.property("Slider").setValue(curSize[0]);
                hFx.property("Slider").setValue(curSize[1]);
                sizeProp.expression = '[effect("Width")("Slider"), effect("Height")("Slider")]';
                applied = true;
              }
            } catch(e2) {}
          }
        } catch(e) {}
      }

      if (applied) { count++; } else {
        // Clean up unused sliders if nothing found
        try { fx.property("Width").remove(); } catch(e) {}
        try { fx.property("Height").remove(); } catch(e) {}
      }
    }
      return count ? "Size rig applied to " + count + " layer" + (count !== 1 ? "s" : "") : "No Rectangle paths found";
});
  if (count === 0) return "No Rectangle paths found in selected shape layers";
  return "Size rig applied to " + count + " layer" + (count !== 1 ? "s" : "");
}

// ── SWAP FILL / STROKE — text layers + shape layers ───────────────────────
function swapFillStroke() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var count = 0;
  return _undo("TNK: Swap Fill/Stroke", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      // TEXT LAYERS
      if (layer instanceof TextLayer) {
        try {
          var textProp = layer.property("Source Text");
          var textDoc = textProp.value;
          if (textDoc.applyFill && textDoc.applyStroke) {
            var oldFill = textDoc.fillColor;
            var oldStroke = textDoc.strokeColor;
            textDoc.fillColor = oldStroke;
            textDoc.strokeColor = oldFill;
            textProp.setValue(textDoc);
            count++;
          } else if (textDoc.applyFill && !textDoc.applyStroke) {
            // enable stroke with fill color, set fill to white-ish
            textDoc.applyStroke = true;
            textDoc.strokeColor = textDoc.fillColor;
            textDoc.strokeWidth = 2;
            textProp.setValue(textDoc);
            count++;
          }
        } catch(e) {}
      }
      // SHAPE LAYERS — swap fill and stroke colors in Contents
      else if (layer instanceof ShapeLayer) {
        try {
          _swapShapeFillStroke(layer.property("Contents"));
          count++;
        } catch(e) {}
      }
    }
    return "Fill/Stroke swapped on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}

function _swapShapeFillStroke(group) {
  // Collect fills and strokes at this level
  var fills = [], strokes = [];
  for (var i = 1; i <= group.numProperties; i++) {
    try {
      var p = group.property(i);
      var mn = p.matchName;
      if (mn === "ADBE Vector Graphic - Fill") fills.push(p);
      else if (mn === "ADBE Vector Graphic - Stroke") strokes.push(p);
      else if (p.numProperties > 0) _swapShapeFillStroke(p); // recurse groups
    } catch(e) {}
  }
  // Swap colors between paired fill/stroke
  var pairs = Math.min(fills.length, strokes.length);
  for (var j = 0; j < pairs; j++) {
    try {
      var fillColorProp   = fills[j].property("ADBE Vector Fill Color");
      var strokeColorProp = strokes[j].property("ADBE Vector Stroke Color");
      if (fillColorProp && strokeColorProp) {
        var fc = fillColorProp.value;
        var sc = strokeColorProp.value;
        fillColorProp.setValue(sc);
        strokeColorProp.setValue(fc);
      }
    } catch(e) {}
  }
  // If only fill exists, add stroke with fill color (or vice versa)
  if (fills.length > 0 && strokes.length === 0) {
    try {
      var fillColorProp = fills[0].property("ADBE Vector Fill Color");
      var fc = fillColorProp.value;
      // Add stroke
      var stroke = group.addProperty("ADBE Vector Graphic - Stroke");
      stroke.property("ADBE Vector Stroke Color").setValue(fc);
      stroke.property("ADBE Vector Stroke Width").setValue(4);
      // Make fill transparent
      fills[0].property("ADBE Vector Fill Opacity").setValue(0);
    } catch(e) {}
  }
}

// ── ANTICIPATION — correct keyframe-based implementation ──────────────────
// For each animated property with ≥2 keyframes on selected layers,
// between every PAIR of keyframes inserts:
//   t_pullback  = t1 + span*0.25 → value pulled BACK from v1 by 20% of delta
//   t_overshoot = t1 + span*0.65 → value overshoots v2 by 15% of delta
// This gives: v1 → pullback → v2_overshoot → v2
// Both inserted keys get label color 2 (yellow).
// Works for scalar and array (multi-value) properties.
// applyAnticipation — inserts pullback + overshoot keys ONLY between already-selected keyframes
// Operates on comp.selectedProperties so it only touches what the user has highlighted.
// For each selected property: reads ONLY the selected key indices, inserts between those pairs.
// applyAnticipation / applyAnticipationN
// half=1 → 1 pullback key + 1 overshoot key per pair (symmetric dip, ~10% of delta each side)
// half=N → N pullback + N overshoot keys distributed evenly
// Overshoot deliberately matches pullback magnitude (symmetric, like a small ease-tool dip)
// SINGLE outer undo group — all setValueAtTime calls happen inside it.
