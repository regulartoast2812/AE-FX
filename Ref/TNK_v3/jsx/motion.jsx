// ── MOTION & TIMING ───────────────────────────────────────────────────────────

function applyEaseInOut(easeIn, easeOut) {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Ease In/Out", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      for (var p = 0; p < layer.selectedProperties.length; p++) {
        var prop = layer.selectedProperties[p];
        if (prop.numKeys > 0) {
          for (var k = 1; k <= prop.numKeys; k++) {
            var eIn  = new KeyframeEase(easeIn  || 75, 33);
            var eOut = new KeyframeEase(easeOut || 75, 33);
            prop.setTemporalEaseAtKey(k, [eIn], [eOut]);
          }
        }
      }
    }
    return "Ease applied";
  });
}

function applyLinear() {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Linear", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      for (var p = 0; p < layer.selectedProperties.length; p++) {
        var prop = layer.selectedProperties[p];
        if (prop.numKeys > 0) {
          for (var k = 1; k <= prop.numKeys; k++) {
            var e = new KeyframeEase(0, 33);
            prop.setTemporalEaseAtKey(k, [e], [e]);
          }
        }
      }
    }
    return "Linear applied";
  });
}

// ── OVERSHOOT (Pseudo Effect) ─────────────────────────────────────────────────

// ── OVERSHOOT — slider-based (no pseudo effect / no FFX binary) ───────────────
// Adds named ADBE Slider Control effects on each layer, referenced by expression.
// Each selected property gets: "Overshoot – <propname>" with sub-sliders
// Amplitude (default 50), Frequency (default 3), Decay (default 4)

function _overshoot_getName(prop) {
    var contextName = null;
    try {
        if (prop.propertyDepth > 1) {
            var pg = prop.propertyGroup(prop.propertyDepth - 1);
            if (pg && pg.matchName !== "ADBE Transform Group" && pg.matchName !== "ADBE Effect Parade") {
                contextName = pg.name;
            }
        }
    } catch(e) {}
    return contextName ? "Overshoot - " + contextName + " - " + prop.name
                       : "Overshoot - " + prop.name;
}

function _overshoot_hasEffect(layer, name) {
    try {
        var fx = layer.property("ADBE Effect Parade");
        for (var i = 1; i <= fx.numProperties; i++) {
            if (fx.property(i).name === name) return true;
        }
    } catch(e) {}
    return false;
}

function applyOvershoot() {
    var comp = getComp();
    if (!comp) return "No comp active";
    var selectedProps = comp.selectedProperties;
    if (!selectedProps || selectedProps.length === 0) return "No properties selected";

    // Snapshot props + parent layers BEFORE any mutations
    var snapshots = [];
    for (var i = 0; i < selectedProps.length; i++) {
        var prop = selectedProps[i];
        if (!prop.canSetExpression) continue;
        // Walk up to find layer (propertyGroup(depth) where depth reaches layer level)
        var layer = null;
        try {
            var pg = prop;
            while (pg.propertyDepth > 0) pg = pg.propertyGroup(1);
            if (pg && pg.index !== undefined) layer = pg;
        } catch(e) {}
        if (!layer) continue;
        snapshots.push({ prop: prop, layer: layer, fxName: _overshoot_getName(prop) });
    }
    if (snapshots.length === 0) return "No expressible properties selected";

    return _undo("TNK: Apply Overshoot", function() {
        for (var i = 0; i < snapshots.length; i++) {
            var s      = snapshots[i];
            var prop   = s.prop;
            var layer  = s.layer;
            var fxName = s.fxName;

            // Add slider effects if not already on this layer
            if (!_overshoot_hasEffect(layer, fxName)) {
                var fx = layer.property("ADBE Effect Parade");
                // Amplitude slider
                var ampFx = fx.addProperty("ADBE Slider Control");
                if (ampFx) { ampFx.name = fxName + " | Amp";   ampFx.property("ADBE Slider Control-0001").setValue(50); }
                // Frequency slider
                var freqFx = fx.addProperty("ADBE Slider Control");
                if (freqFx) { freqFx.name = fxName + " | Freq";  freqFx.property("ADBE Slider Control-0001").setValue(3); }
                // Decay slider
                var decFx = fx.addProperty("ADBE Slider Control");
                if (decFx) { decFx.name = fxName + " | Decay"; decFx.property("ADBE Slider Control-0001").setValue(4); }
            }

            // Expression referencing the sliders
            var expr =
                "try {\n" +
                "amp   = effect(\"" + fxName + " | Amp\")(\"ADBE Slider Control-0001\");\n" +
                "freq  = effect(\"" + fxName + " | Freq\")(\"ADBE Slider Control-0001\");\n" +
                "decay = effect(\"" + fxName + " | Decay\")(\"ADBE Slider Control-0001\");\n" +
                "n = 0;\n" +
                "if (numKeys > 0) {\n" +
                "  n = nearestKey(time).index;\n" +
                "  if (key(n).time > time) n--;\n" +
                "}\n" +
                "if (n > 0) {\n" +
                "  t = time - key(n).time;\n" +
                "  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);\n" +
                "  value + v / 100 * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n" +
                "} else {\n" +
                "  value;\n" +
                "}\n" +
                "} catch(e) { value; }";

            try {
                prop.expression = expr;
                prop.expressionEnabled = true;
            } catch(e) {}
        }
          return "Overshoot applied to " + snapshots.length + " propert" + (snapshots.length === 1 ? "y" : "ies");
});
}

function applyWiggle(freq, amp) {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Wiggle", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var pos = layer.property("Position");
      if (pos) {
        pos.expression = "wiggle(" + (freq || 3) + ", " + (amp || 20) + ");";
      }
    }
    return "Wiggle applied";
  });
}

function clearExpressions() {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Clear Expressions", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var props = ["Position", "Scale", "Rotation", "Opacity"];
      for (var p = 0; p < props.length; p++) {
        var prop = layer.property(props[p]);
        if (prop) prop.expression = "";
      }
    }
    return "Expressions cleared";
  });
}
