
function applyAnticipation() {
  return _runAnticipation(1);
}

function applyAnticipationN(n) {
  var half = Math.max(1, Math.floor(parseInt(n, 10) / 2) || 1);
  return _runAnticipation(half);
}

function _runAnticipation(half) {
  var comp = getComp(); if (!comp) return "No comp";
  var selProps = comp.selectedProperties;
  if (!selProps || !selProps.length) return "Select keyframes first (click properties in timeline)";

  // Snapshot ALL work up front BEFORE opening undo group
  // so setValueAtTime calls don't fragment the undo stack
  var workList = [];
  for (var pi = 0; pi < selProps.length; pi++) {
    var prop = selProps[pi];
    try {
      if (!prop || prop.numKeys < 2) continue;
      var mn = prop.matchName || '';
      if (mn === 'ADBE Marker' || mn === 'ADBE Time Remap') continue;
      if (prop.expressionEnabled) continue;
      if (prop.numProperties && prop.numProperties > 0) continue;

      var selKeyIndices = [];
      for (var k = 1; k <= prop.numKeys; k++) {
        try { if (prop.keySelected(k)) selKeyIndices.push(k); } catch(e) {}
      }
      if (selKeyIndices.length < 2) continue;

      var pairs = [];
      for (var si = 0; si < selKeyIndices.length - 1; si++) {
        pairs.push({
          t1: prop.keyTime(selKeyIndices[si]),
          v1: prop.keyValue(selKeyIndices[si]),
          t2: prop.keyTime(selKeyIndices[si + 1]),
          v2: prop.keyValue(selKeyIndices[si + 1])
        });
      }
      if (pairs.length) workList.push({ prop: prop, pairs: pairs });
    } catch(e) {}
  }
  if (!workList.length) return "No keyframe pairs found in selected properties";

  var totalPairs = 0;
  return _undo("TNK: Anticipation", function() {
    for (var wi = 0; wi < workList.length; wi++) {
      var prop = workList[wi].prop;
      var pairs = workList[wi].pairs;
      // Process backwards so new keys don't shift existing indices
      for (var ki = pairs.length - 1; ki >= 0; ki--) {
        var t1 = pairs[ki].t1, v1 = pairs[ki].v1;
        var t2 = pairs[ki].t2, v2 = pairs[ki].v2;
        var span = t2 - t1;
        if (span < 0.05) continue;

        var isNum = (typeof v1 === 'number' && typeof v2 === 'number');
        var isArr = (!isNum && v1 && v1.length !== undefined);
        if (!isNum && !isArr) continue;

        // Symmetric dip: 10% of delta on each side (matching pullback = overshoot)
        // With N pairs: distribute evenly, largest dip is 10%, smallest is 10%/half
        try {
          // Insert overshoots first (near t2), then pullbacks (near t1)
          // Spread: overshoots fill t2-20%span to t2-3%span (backwards from end)
          // Pullbacks fill t1+3%span to t1+20%span
          var spreadFrac = 0.18 / Math.max(half, 1);

          for (var oi = 0; oi < half; oi++) {
            var tOv = t2 - span * 0.03 - oi * span * spreadFrac;
            var amt = 0.10 * ((oi + 1) / half); // deepest overshoot is 10%, closest to t2 is smallest
            var vOv = _anticipateVal(v1, v2, isNum, 1 + amt); // past v2 by amt
            prop.setValueAtTime(tOv, vOv);
            _labelKeyNear(prop, tOv, 2);
          }
          for (var pbi = 0; pbi < half; pbi++) {
            var tPb = t1 + span * 0.03 + pbi * span * spreadFrac;
            var amt2 = 0.10 * ((pbi + 1) / half); // deepest pullback at furthest from t1
            var vPb = _anticipateVal(v1, v2, isNum, -amt2); // before v1 by amt
            prop.setValueAtTime(tPb, vPb);
            _labelKeyNear(prop, tPb, 2);
          }
          totalPairs++;
        } catch(e) {}
      }
    }
    return "Anticipation x" + half + " on " + totalPairs + " pair" + (totalPairs !== 1 ? "s" : "");
  });
}

// Returns interpolated value: t=0→v1, t=1→v2, t<0→before v1, t>1→past v2
function _anticipateVal(v1, v2, isNum, t) {
  if (isNum) return v1 + (v2 - v1) * t;
  var result = [];
  for (var c = 0; c < v1.length; c++) result.push(v1[c] + (v2[c] - v1[c]) * t);
  return result;
}

function _labelKeyNear(prop, t, label) {
  try {
    for (var k = 1; k <= prop.numKeys; k++) {
      if (Math.abs(prop.keyTime(k) - t) < 0.005) { prop.setLabelAtKey(k, label); return; }
    }
  } catch(e) {}
}

// ── GET STYLE STATUS JSON (selected layers only) ──────────────────────────
// Returns { gMn: { have: N, missing: N, total: N } } for each style group

