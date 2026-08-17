// ── TEXT ANIMATION BOUNCE (expression selector, bounce-in / staged-out) ──────
function applyTextAnimBounce(dir, basedOn, usePos, useOpac, useScale, textIn, textOut, mode) {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";

  var doIn  = (!mode || mode === 'in'  || mode === 'both');
  var doOut = (mode === 'out' || mode === 'both');

  var dirMap = {
    "up":    [0,  200, 0],
    "down":  [0, -200, 0],
    "left":  [200,  0, 0],
    "right": [-200, 0, 0]
  };
  var posInVal  = dirMap[dir] || [0, 200, 0];
  var posOutVal = [-posInVal[0], -posInVal[1], -posInVal[2]];

  return _undo("TNK: Text Anim Bounce", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof TextLayer)) continue;

      // Sliders: remove old, add fresh
      var fx = layer.Effects;
      for (var oi = fx.numProperties; oi >= 1; oi--) {
        var n = fx.property(oi).name;
        if (n === "Bounce Freq" || n === "Bounce Amplitude" || n === "Bounce Decay") {
          fx.property(oi).remove();
        }
      }
      var sf = fx.addProperty("ADBE Slider Control"); sf.name = "Bounce Freq";      sf.property(1).setValue(2.0);
      var sa = fx.addProperty("ADBE Slider Control"); sa.name = "Bounce Amplitude"; sa.property(1).setValue(150.0);
      var sd = fx.addProperty("ADBE Slider Control"); sd.name = "Bounce Decay";     sd.property(1).setValue(6.0);

      // Anchor Point Grouping
      var moreOpts = layer.property("Text").property("ADBE Text More Options");
      if (moreOpts) {
        var anchorProp = moreOpts.property("ADBE Text Anchor Point Option");
        if (anchorProp) anchorProp.setValue(2); // Word
      }

      // Remove old animators for modes being (re)applied
      var animators = layer.property("Text").property("Animators");
      for (var ai = animators.numProperties; ai >= 1; ai--) {
        var an = animators.property(ai).name;
        if ((doIn  && an === "Animator In") ||
            (doOut && (an === "Animator Out" || an === "Animator Out Opacity"))) {
          animators.property(ai).remove();
        }
      }

      if (doIn) {
      var animIn = animators.addProperty("ADBE Text Animator");
      animIn.name = "Animator In";
      var propsIn = animIn.property("ADBE Text Animator Properties");
      if (usePos)   propsIn.addProperty("ADBE Text Position 3D").setValue(posInVal);
      if (useOpac)  propsIn.addProperty("ADBE Text Opacity").setValue(0);
      if (useScale) propsIn.addProperty("ADBE Text Scale 3D").setValue([0, 0, 100]);

      var exprSelIn = animIn.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
      exprSelIn.name = "Expression Selector 1";
      var boIn = exprSelIn.property("Based On");
      if (boIn) boIn.setValue(basedOn);

      exprSelIn.property("Amount").expression =
        "delay = 0.15;\n" +
        "tIn = inPoint + delay*textTotal;\n" +
        "for (i = 1; i <= thisLayer.marker.numKeys; i++){\n" +
        "  mk = thisLayer.marker.key(i);\n" +
        "  c = mk.comment;\n" +
        "  isIn = (c == 'IN') || (c && c.length >= 3 && c.substr(c.length-3,3) == '_IN');\n" +
        "  if (isIn){ tIn = mk.time; break; }\n" +
        "}\n" +
        "delayFromMarker = (tIn - inPoint) / Math.max(1, textTotal);\n" +
        "if (delayFromMarker >= 0) delay = delayFromMarker;\n" +
        "myDelay = delay*textIndex;\n" +
        "t = (time - inPoint) - myDelay;\n" +
        "if (t >= 0) {\n" +
        "  freq = effect('Bounce Freq')('ADBE Slider Control-0001');\n" +
        "  amplitude = effect('Bounce Amplitude')('ADBE Slider Control-0001');\n" +
        "  decay = effect('Bounce Decay')('ADBE Slider Control-0001');\n" +
        "  s = amplitude*Math.cos(freq*t*2*Math.PI)/Math.exp(decay*t);\n" +
        "  s;\n" +
        "} else {\n" +
        "  value\n" +
        "}";
      } // end doIn

      if (doOut) {
      // ---- ANIMATOR OUT (position) ----
      var animOut = animators.addProperty("ADBE Text Animator");
      animOut.name = "Animator Out";
      var propsOut = animOut.property("ADBE Text Animator Properties");
      if (usePos)   propsOut.addProperty("ADBE Text Position 3D").setValue(posOutVal);
      if (useScale) propsOut.addProperty("ADBE Text Scale 3D").setValue([0, 0, 100]);

      var exprSelOut = animOut.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
      exprSelOut.name = "Expression Selector 1";
      var boOut = exprSelOut.property("Based On");
      if (boOut) boOut.setValue(basedOn);

      exprSelOut.property("Amount").expression =
        "riseDur  = 0.06;\n" +
        "dipDur   = 0.10;\n" +
        "exitDur  = 0.14;\n" +
        "totalDur = riseDur + dipDur + exitDur;\n" +
        "delay    = totalDur * 0.5;\n" +
        "tStart   = outPoint - totalDur - delay * (textTotal - 1);\n" +
        "for (i = 1; i <= thisLayer.marker.numKeys; i++){\n" +
        "  mk = thisLayer.marker.key(i);\n" +
        "  c = mk.comment;\n" +
        "  isOut = (c == 'OUT') || (c && c.length >= 4 && c.substr(c.length-4,4) == '_OUT');\n" +
        "  if (isOut){\n" +
        "    delay  = (outPoint - totalDur - mk.time) / Math.max(1, textTotal - 1);\n" +
        "    tStart = mk.time;\n" +
        "    break;\n" +
        "  }\n" +
        "}\n" +
        "myDelay = delay * textIndex;\n" +
        "t = (time - tStart) - myDelay;\n" +
        "if (t <= 0){\n" +
        "  0\n" +
        "} else if (t < riseDur){\n" +
        "  ease(t, 0, riseDur, 0, 10)\n" +
        "} else if (t < riseDur + dipDur){\n" +
        "  ease(t - riseDur, 0, dipDur, 10, -40)\n" +
        "} else if (t < totalDur){\n" +
        "  easeIn(t - riseDur - dipDur, 0, exitDur, -40, 100)\n" +
        "} else {\n" +
        "  100\n" +
        "}";

      // ---- ANIMATOR OUT OPACITY ----
      if (useOpac) {
        var animOutOpac = animators.addProperty("ADBE Text Animator");
        animOutOpac.name = "Animator Out Opacity";
        var propsOutOpac = animOutOpac.property("ADBE Text Animator Properties");
        propsOutOpac.addProperty("ADBE Text Opacity").setValue(0);

        var exprSelOutOpac = animOutOpac.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
        exprSelOutOpac.name = "Expression Selector 1";
        var boOutOpac = exprSelOutOpac.property("Based On");
        if (boOutOpac) boOutOpac.setValue(basedOn);

        exprSelOutOpac.property("Amount").expression =
          "riseDur  = 0.06;\n" +
          "dipDur   = 0.10;\n" +
          "fadeDur  = 0.14;\n" +
          "totalDur = riseDur + dipDur + fadeDur;\n" +
          "delay    = totalDur * 0.5;\n" +
          "tStart   = outPoint - totalDur - delay * (textTotal - 1);\n" +
          "for (i = 1; i <= thisLayer.marker.numKeys; i++){\n" +
          "  mk = thisLayer.marker.key(i);\n" +
          "  c = mk.comment;\n" +
          "  isOut = (c == 'OUT') || (c && c.length >= 4 && c.substr(c.length-4,4) == '_OUT');\n" +
          "  if (isOut){\n" +
          "    delay  = (outPoint - totalDur - mk.time) / Math.max(1, textTotal - 1);\n" +
          "    tStart = mk.time;\n" +
          "    break;\n" +
          "  }\n" +
          "}\n" +
          "myDelay = delay * textIndex;\n" +
          "t = (time - tStart) - myDelay - riseDur - dipDur;\n" +
          "if (t <= 0){\n" +
          "  0\n" +
          "} else if (t >= fadeDur){\n" +
          "  100\n" +
          "} else {\n" +
          "  linear(t, 0, fadeDur, 0, 100)\n" +
          "}";
      }

      } // end doOut

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
    return "Text Anim Bounce " + (mode || 'in') + " applied";
  });
}

function applyWiggleFFX(freq, amp) {
  var comp = getComp();
  if (!comp) return "No comp";
  var selectedProps = comp.selectedProperties;
  if (!selectedProps.length) return "No properties selected";
  return _undo("TNK: Wiggle FFX", function() {
    var presetFile = new File("C:/Program Files (x86)/Common Files/Adobe/CEP/extensions/TN Keyboard/ffx/Wiggle.ffx");
    for (var i = 0; i < selectedProps.length; i++) {
      var prop = selectedProps[i];
      var layer = prop.propertyGroup(prop.propertyDepth);
      if (presetFile.exists) {
        layer.applyPreset(presetFile);
      } else {
        // Fallback: simple wiggle expression using panel params
        if (prop.canSetExpression) {
          prop.expression = "wiggle(" + (freq || 3) + ", " + (amp || 20) + ")";
        }
        continue;
      }
      var fx = layer.effect(layer.effect.numProperties);
      if (fx) {
        var newName = "Wiggle - " + prop.name;
        fx.name = newName;
        var expr =
          "try{\nvar fx = effect(\"" + newName + "\");\ne = fx(1).value;\nif(e){\n" +
          "pos = fx(\"Posterize time\");\nif(pos!=0) posterizeTime(pos);\n" +
          "freq = fx(\"Frequency\");\namp = fx(\"Amount\");\nloop = fx(\"Loop duration(sec)\");\n" +
          "complexity = fx(\"Complexity\");\nmultiplier = 1;\nseed = fx(\"Seed\");\nseedRandom(seed);\n" +
          "if(loop==0) loop=thisComp.duration;\nt=(time%loop)-loop;\n" +
          "w1=wiggle(freq,amp,complexity,multiplier,t);\nw2=wiggle(freq,amp,complexity,multiplier,t-loop);\n" +
          "w=ease(t,-loop,0,w1,w2);\nw+value-valueAtTime(0);\n}else value;\n}catch(err){value};";
        prop.expression = expr;
      }
    }
    return "Wiggle applied";
  });
}
