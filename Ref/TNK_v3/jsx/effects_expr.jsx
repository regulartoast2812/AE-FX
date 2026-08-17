// ── TEXT ANIMATION UP (key Y) ─────────────────────────────────────────────────
// Adds proper AE text animators (position + opacity) with range selectors.
// Overwrites existing animators. click=in+out, shift=in only, ctrl=out only.
// ── TEXT ANIMATION MASTER (range selector, marker-driven) ────────────────────
function applyTextAnimMaster(dir, basedOn, usePos, useOpac, useScale, textIn, textOut, mode) {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";

  // mode: 'in' | 'out' | 'both' — default 'in' for backward compat
  var doIn  = (!mode || mode === 'in'  || mode === 'both');
  var doOut = (mode === 'out' || mode === 'both');

  var dirMap = {
    "up":    [0,  100, 0],
    "down":  [0, -100, 0],
    "left":  [100,  0, 0],
    "right": [-100, 0, 0]
  };
  var posInVal  = dirMap[dir] || [0, 100, 0];
  var posOutVal = [-posInVal[0], -posInVal[1], -posInVal[2]];

  return _undo("TNK: Text Anim Master", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof TextLayer)) continue;

      // Anchor Point Grouping (word grouping)
      var moreOpts = layer.property("Text").property("ADBE Text More Options");
      if (moreOpts) {
        var anchorProp = moreOpts.property("ADBE Text Anchor Point Option");
        if (anchorProp) anchorProp.setValue(2); // Word
      }

      // Remove old animators for modes being (re)applied
      var animators = layer.property("Text").property("Animators");
      for (var ai = animators.numProperties; ai >= 1; ai--) {
        var an = animators.property(ai).name;
        if ((doIn && an === "Animator - In") || (doOut && an === "Animator - Out")) {
          animators.property(ai).remove();
        }
      }

      if (doIn) {
        // ---- ANIMATOR - IN ----
        var animIn = animators.addProperty("ADBE Text Animator");
        animIn.name = "Animator - In";

        var propsIn = animIn.property("ADBE Text Animator Properties");
        if (usePos)   propsIn.addProperty("ADBE Text Position 3D").setValue(posInVal);
        if (useOpac)  propsIn.addProperty("ADBE Text Opacity").setValue(0);
        if (useScale) propsIn.addProperty("ADBE Text Scale 3D").setValue([0, 0, 100]);

        var selIn = animIn.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var advIn = selIn.property("Advanced") || selIn.property("ADBE Text Range Advanced");
        if (advIn) {
          var boIn = advIn.property("Based On") || advIn.property("ADBE Text Range Advanced Based On");
          if (boIn) { try { boIn.setValue(basedOn); } catch(e) {} }
          var shIn = advIn.property("Shape") || advIn.property("ADBE Text Range Advanced Shape");
          if (shIn) shIn.setValue(2); // Ramp Up
          var ehIn = advIn.property("Ease High") || advIn.property("ADBE Text Range Advanced Ease High");
          if (ehIn) ehIn.setValue(-50);
          var elIn = advIn.property("Ease Low") || advIn.property("ADBE Text Range Advanced Ease Low");
          if (elIn) elIn.setValue(100);
        }
        var offsetIn = selIn.property("Offset");
        if (offsetIn) {
          offsetIn.expression =
            "tIN = inPoint + " + (textIn || 0.5) + ";\n" +
            "for (i = 1; i <= thisLayer.marker.numKeys; i++) {\n" +
            "  mk = thisLayer.marker.key(i);\n" +
            "  c = mk.comment;\n" +
            "  isIn = (c == 'IN') || (c && c.length >= 3 && c.substr(c.length-3,3) == '_IN');\n" +
            "  if (isIn) { tIN = mk.time; break; }\n" +
            "}\n" +
            "clamp(linear(time, inPoint, tIN, -100, 100), -100, 100);";
        }
      }

      if (doOut) {
        // ---- ANIMATOR - OUT ----
        var animOut = animators.addProperty("ADBE Text Animator");
        animOut.name = "Animator - Out";

        var propsOut = animOut.property("ADBE Text Animator Properties");
        if (usePos)   propsOut.addProperty("ADBE Text Position 3D").setValue(posOutVal);
        if (useOpac)  propsOut.addProperty("ADBE Text Opacity").setValue(0);
        if (useScale) propsOut.addProperty("ADBE Text Scale 3D").setValue([0, 0, 100]);

        var selOut = animOut.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var advOut = selOut.property("Advanced") || selOut.property("ADBE Text Range Advanced");
        if (advOut) {
          var boOut = advOut.property("Based On") || advOut.property("ADBE Text Range Advanced Based On");
          if (boOut) { try { boOut.setValue(basedOn); } catch(e) {} }
          var shOut = advOut.property("Shape") || advOut.property("ADBE Text Range Advanced Shape");
          if (shOut) shOut.setValue(3); // Ramp Down
          var ehOut = advOut.property("Ease High") || advOut.property("ADBE Text Range Advanced Ease High");
          if (ehOut) ehOut.setValue(-50);
          var elOut = advOut.property("Ease Low") || advOut.property("ADBE Text Range Advanced Ease Low");
          if (elOut) elOut.setValue(100);
        }
        var offsetOut = selOut.property("Offset");
        if (offsetOut) {
          offsetOut.expression =
            "tOUT = outPoint - " + (textOut || 0.5) + ";\n" +
            "for (i = 1; i <= thisLayer.marker.numKeys; i++) {\n" +
            "  mk = thisLayer.marker.key(i);\n" +
            "  c = mk.comment;\n" +
            "  isOut = (c == 'OUT') || (c && c.length >= 4 && c.substr(c.length-4,4) == '_OUT');\n" +
            "  if (isOut) { tOUT = mk.time; break; }\n" +
            "}\n" +
            "clamp(linear(time, tOUT, outPoint, -100, 100), -100, 100);";
        }
      }

      // Add IN/OUT markers if missing (only for the modes being applied)
      var markerProp = layer.marker;
      var hasIN = false, hasOUT = false;
      for (var mi = 1; mi <= markerProp.numKeys; mi++) {
        var mc = markerProp.keyValue(mi).comment;
        if (mc === "IN")  hasIN  = true;
        if (mc === "OUT") hasOUT = true;
      }
      if (doIn && !hasIN) {
        var keyIN = markerProp.addKey(layer.inPoint + (textIn || 0.5));
        markerProp.setValueAtKey(keyIN, new MarkerValue("IN"));
      }
      if (doOut && !hasOUT) {
        var keyOUT = markerProp.addKey(layer.outPoint - (textOut || 0.5));
        markerProp.setValueAtKey(keyOUT, new MarkerValue("OUT"));
      }
    }
    return "Text Anim " + (mode || 'in') + " applied";
  });
}

// ── TEXT ANIMATION BOUNCE (expression selector, bounce-in / staged-out) ──────

