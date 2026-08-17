// applyAnticipation — inserts sampled keyframes between selected key pairs
// using the same easeFunc shape as the overshoot script, but mirrored:
// ring phase first (dips before key1), then linear ramp to key2.
// No expression, no pseudo effect — just baked keyframes.

function applyAnticipation() {
  var comp = getComp(); if (!comp) return "No comp";
  var selProps = comp.selectedProperties;
  if (!selProps || !selProps.length) return "Select keyframe properties first";

  // ── easeFunc constants (matching overshoot script) ────────────────────────
  var F = 0.56; // fraction: ring phase = [0, 1-F], linear phase = [1-F, 1]
  var G = 0.71; // oscillation frequency multiplier
  var H = 2;    // decay rate

  // Samples: how many keyframes to insert per pair
  // Ring phase gets most of them; linear phase gets a couple
  var RING_SAMPLES  = 10;
  var RAMP_SAMPLES  = 3;
  var TOTAL_SAMPLES = RING_SAMPLES + RAMP_SAMPLES;

  // ── Anticipation curve (scalar, normalized) ───────────────────────────────
  // a ∈ [0,1], b = start, c = delta
  function easeAntic(a, b, c) {
    if (a <= 0) return b;
    if (a >= 1) return b + c;
    var ringPhase = 1 - F;
    if (a <= ringPhase) {
      // Damped ring: starts at b, oscillates below, decays back toward b
      var i = -(c / F);
      var j = G * Math.PI * 2;
      return b + i * (Math.sin(a * j) / Math.exp(H * a) / j);
    }
    // Linear ramp from b to b+c over the final F fraction
    var a3 = (a - ringPhase) / F;
    return b + c * a3;
  }

  function anticipateVal(v1, v2, a) {
    if (typeof v1 === "number") {
      return easeAntic(a, v1, v2 - v1);
    }
    // Multi-dimensional (Position, Scale, etc.)
    var result = [];
    for (var i = 0; i < v1.length; i++) {
      result.push(easeAntic(a, v1[i], v2[i] - v1[i]));
    }
    return result;
  }

  // ── Collect keyframe pairs ─────────────────────────────────────────────────
  var workList = [];
  for (var pi = 0; pi < selProps.length; pi++) {
    var prop = selProps[pi];
    try {
      if (!prop || prop.numKeys < 2) continue;
      var mn = prop.matchName || "";
      if (mn === "ADBE Marker" || mn === "ADBE Time Remap") continue;
      if (prop.expressionEnabled) continue;
      if (prop.numProperties && prop.numProperties > 0) continue;

      var selKeys = [];
      for (var k = 1; k <= prop.numKeys; k++) {
        try { if (prop.keySelected(k)) selKeys.push(k); } catch(e) {}
      }
      if (selKeys.length < 2) continue;

      var pairs = [];
      for (var si = 0; si < selKeys.length - 1; si++) {
        pairs.push({
          t1: prop.keyTime(selKeys[si]),
          v1: prop.keyValue(selKeys[si]),
          t2: prop.keyTime(selKeys[si + 1]),
          v2: prop.keyValue(selKeys[si + 1])
        });
      }
      if (pairs.length) workList.push({ prop: prop, pairs: pairs });
    } catch(e) {}
  }
  if (!workList.length) return "No selected keyframe pairs found";

  return _undo("TNK: Anticipation", function() {
    var totalPairs = 0;
    for (var wi = 0; wi < workList.length; wi++) {
      var prop  = workList[wi].prop;
      var pairs = workList[wi].pairs;

      // Process backwards so inserted keys don't shift existing indices
      for (var ki = pairs.length - 1; ki >= 0; ki--) {
        var t1 = pairs[ki].t1, v1 = pairs[ki].v1;
        var t2 = pairs[ki].t2, v2 = pairs[ki].v2;
        var span = t2 - t1;
        if (span < 0.05) continue;

        // Sample the curve and insert keyframes
        // Skip a=0 (key1 already exists) and a=1 (key2 already exists)
        for (var s = 1; s < TOTAL_SAMPLES; s++) {
          // Distribute: ring samples in [0.02, 1-F-0.02], ramp samples in [1-F+0.02, 0.98]
          var ringPhase = 1 - F;
          var a;
          if (s < RING_SAMPLES) {
            // Evenly spread across ring phase
            a = 0.02 + (s / RING_SAMPLES) * (ringPhase - 0.04);
          } else {
            // Evenly spread across ramp phase
            var ri = s - RING_SAMPLES + 1;
            a = (ringPhase + 0.02) + (ri / (RAMP_SAMPLES + 1)) * (F - 0.04);
          }

          var t = t1 + a * span;
          var v = anticipateVal(v1, v2, a);
          try {
            prop.setValueAtTime(t, v);
          } catch(e) {}
        }
        totalPairs++;
      }
    }
    return "Anticipation applied to " + totalPairs + " pair" + (totalPairs !== 1 ? "s" : "");
  });
}
