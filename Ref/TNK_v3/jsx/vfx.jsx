// ── APPLY GLOW ────────────────────────────────────────────────────────────
function applyGlow() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Glow", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      var glow = fx.addProperty("ADBE Glo2");
      glow.property("ADBE Glo2-0001").setValue(0);
      glow.property("ADBE Glo2-0002").setValue(60);
      glow.property("ADBE Glo2-0003").setValue(25);
      glow.property("ADBE Glo2-0004").setValue(1);
    }
    return "Glow applied";
  });
}

// ── APPLY VHS ─────────────────────────────────────────────────────────────
function applyVHS() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: VHS", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      var ca = fx.addProperty("ADBE Shift Channels");
      if (ca) {
        ca.property("ADBE Shift Channels-0001").setValue(1);
        ca.property("ADBE Shift Channels-0002").setValue(1);
      }
      var noise = fx.addProperty("ADBE Add Grain");
      if (noise) noise.property("ADBE Add Grain-0001").setValue(0.15);
    }
    return "VHS applied";
  });
}

// ── APPLY BLUR (static or animated) ──────────────────────────────────────
// applyBlurInOut — focus shift: 15 at in/out (edges), 0 in the middle
function applyBlurInOut(inTime, outTime, ease1, ease2) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Blur In+Out", function() {
    var eIn = new KeyframeEase(0, ease1), eOut = new KeyframeEase(0, ease2);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var fx = layer.property("Effects");
      var blur = fx.addProperty("ADBE Box Blur2");
      blur.property("ADBE Box Blur2-0002").setValue(3); // repeat edge
      var amtProp = blur.property("ADBE Box Blur2-0001");
      var t0 = layer.inPoint,            t1 = layer.inPoint  + inTime;
      var t2 = layer.outPoint - outTime, t3 = layer.outPoint;
      amtProp.setValueAtTime(t0, 0);   // inPoint = 0 blur
      amtProp.setValueAtTime(t1, 15);  // after inTime = 15 (in focus)
      amtProp.setValueAtTime(t2, 15);  // before outTime = 15 (in focus)
      amtProp.setValueAtTime(t3, 0);   // outPoint = 0 blur
      amtProp.setTemporalEaseAtKey(1, [eIn], [eOut]);
      amtProp.setTemporalEaseAtKey(2, [eIn], [eOut]);
      amtProp.setTemporalEaseAtKey(3, [eIn], [eOut]);
      amtProp.setTemporalEaseAtKey(4, [eIn], [eOut]);
    }
    return "Blur In+Out applied";
  });
}

// applyBlurOut — blur out only: 0 → 15 at outpoint (layer exits to blur)
function applyBlurOut(outTime, ease1, ease2) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Blur Out", function() {
    var eIn = new KeyframeEase(0, ease1), eOut = new KeyframeEase(0, ease2);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var fx = layer.property("Effects");
      var blur = fx.addProperty("ADBE Box Blur2");
      blur.property("ADBE Box Blur2-0002").setValue(3);
      var amtProp = blur.property("ADBE Box Blur2-0001");
      var t0 = layer.outPoint - outTime, t1 = layer.outPoint;
      amtProp.setValueAtTime(t0, 0);
      amtProp.setValueAtTime(t1, 15);
      amtProp.setTemporalEaseAtKey(1, [eIn], [eOut]);
      amtProp.setTemporalEaseAtKey(2, [eIn], [eOut]);
    }
    return "Blur Out applied";
  });
}

// ── APPLY DIM + DESATURATE — Lumetri Color, exposure -2, saturation 0 ────
function applyDimDesat() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Dim + Desat", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      // Lumetri Color matchName
      var lum = fx.addProperty("ADBE LMT Correction");
      // Basic Correction > Exposure  = "ADBE LMT Correction-0003"
      // Basic Correction > Saturation = "ADBE LMT Correction-0009"
      try { lum.property("ADBE LMT Correction-0003").setValue(-2); } catch(e) {}
      try { lum.property("ADBE LMT Correction-0009").setValue(0);  } catch(e) {}
    }
    return "Dim + Desat applied";
  });
}

// ── SIZE RIG ──────────────────────────────────────────────────────────────
// AE path: layer → Contents → Shape (ADBE Vector Group) →
//          Contents → Rectangle Path (ADBE Vector Shape - Rect) → Size

