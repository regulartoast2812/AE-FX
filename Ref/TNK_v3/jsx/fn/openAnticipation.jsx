function openAnticipation() {
  var win = new Window("palette", "TNK Anticipation", undefined, {resizeable: true});
  var grp = win.add("group");
  grp.orientation = "column";
  grp.alignChildren = ["fill", "top"];

  var presetPanel = grp.add("panel", undefined, "Preset");
  presetPanel.orientation = "row";
  var presetDropdown = presetPanel.add("dropdownlist", undefined, ["Subtle", "Normal", "Strong", "Heavy"]);
  presetDropdown.selection = 1;

  var manualPanel = grp.add("panel", undefined, "Settings");
  manualPanel.orientation = "column";
  manualPanel.alignChildren = ["fill", "top"];

  var rowStrength = manualPanel.add("group"); rowStrength.orientation = "row";
  rowStrength.add("statictext", undefined, "Strength:");
  var strengthInput = rowStrength.add("edittext", undefined, "15");
  strengthInput.characters = 4;
  strengthInput.helpTip = "How far the anticipation dips back and the overshoot goes past the target.\nHigher = more exaggerated motion.";
  var strengthInfo = rowStrength.add("statictext", undefined, "How far it dips / overshoots");
  strengthInfo.graphics.foregroundColor = strengthInfo.graphics.newPen(strengthInfo.graphics.PenType.SOLID_COLOR, [0.6,0.6,0.6], 1);

  var rowDecay = manualPanel.add("group"); rowDecay.orientation = "row";
  rowDecay.add("statictext", undefined, "Decay:");
  var decayInput = rowDecay.add("edittext", undefined, "0.45");
  decayInput.characters = 5;
  decayInput.helpTip = "How much the motion settles after each bounce. 0 = no decay, 1 = fully settled.\nLower = more energy retained, higher = snappier return.";
  var decayInfo = rowDecay.add("statictext", undefined, "How fast it settles (0\u20131)");
  decayInfo.graphics.foregroundColor = decayInfo.graphics.newPen(decayInfo.graphics.PenType.SOLID_COLOR, [0.6,0.6,0.6], 1);

  var rowSteps = manualPanel.add("group"); rowSteps.orientation = "row";
  rowSteps.add("statictext", undefined, "Steps A:");
  var stepsAnticInput = rowSteps.add("edittext", undefined, "1");
  stepsAnticInput.characters = 2;
  stepsAnticInput.helpTip = "Anticipation steps: 1 = 1 key, 2 = 2 keys (max 2)";
  rowSteps.add("statictext", undefined, "O:");
  var stepsOverInput = rowSteps.add("edittext", undefined, "2");
  stepsOverInput.characters = 2;
  stepsOverInput.helpTip = "Overshoot steps: 1 = 1 key, 2 = 2 keys (max 2)";
  var stepsInfo = rowSteps.add("statictext", undefined, "A = antic,  O = overshoot");
  stepsInfo.graphics.foregroundColor = stepsInfo.graphics.newPen(stepsInfo.graphics.PenType.SOLID_COLOR, [0.6,0.6,0.6], 1);

  var PRESETS = { "Subtle":[8,0.35], "Normal":[15,0.45], "Strong":[22,0.50], "Heavy":[30,0.55] };
  presetDropdown.onChange = function() {
    var pv = PRESETS[presetDropdown.selection.text];
    strengthInput.text = pv[0];
    decayInput.text    = pv[1];
  };
  strengthInput.onChanging = function() { presetDropdown.selection = -1; };
  decayInput.onChanging    = function() { presetDropdown.selection = -1; };

  var applyPanel = grp.add("panel", undefined, "Apply");
  applyPanel.orientation = "row";
  var btnAnticipation = applyPanel.add("button", undefined, "Anticipation");
  var btnBoth         = applyPanel.add("button", undefined, "Both");
  var btnOvershoot    = applyPanel.add("button", undefined, "Overshoot");
  btnAnticipation.helpTip = "Add anticipation keys only (dip before the move)";
  btnBoth.helpTip         = "Add both anticipation + overshoot keys";
  btnOvershoot.helpTip    = "Add overshoot keys only (bounce past the target)";

  function lerp(v1, v2, t) {
    if (typeof v1 === "number") return v1 + (v2 - v1) * t;
    var r = [];
    for (var i = 0; i < v1.length; i++) r.push(v1[i] + (v2[i] - v1[i]) * t);
    return r;
  }

  function insertKey(prop, t, v, label) {
    prop.setValueAtTime(t, v);
    var idx = prop.nearestKeyIndex(t);
    try {
      prop.setInterpolationTypeAtKey(idx, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      var ee = new KeyframeEase(0, 66.7);
      prop.setTemporalEaseAtKey(idx, [ee], [ee]);
    } catch(e) {}
    try { prop.setLabelAtKey(idx, label); } catch(e) {}
  }

  function valuesEqual(a, b) {
    var tol = 0.001;
    if (typeof a === "number") return Math.abs(a - b) < tol;
    for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > tol) return false;
    return true;
  }

  function detectPairs(comp) {
    var results = [];
    var props = comp.selectedProperties;
    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      try {
        if (!p || !p.canSetExpression) continue;
        if (p.numKeys < 2) continue;
        var mn = p.matchName || "";
        if (mn === "ADBE Marker" || mn === "ADBE Time Remap") continue;
        var parentMN = "";
        try { parentMN = p.parentProperty ? (p.parentProperty.matchName || "") : ""; } catch(e) {}
        if (parentMN === "ADBE Position" || parentMN === "ADBE Scale" ||
            parentMN === "ADBE Anchor Point") continue;

        var selKeys = [];
        for (var k = 1; k <= p.numKeys; k++) {
          try { if (p.keySelected(k)) selKeys.push(k); } catch(e) {}
        }
        if (selKeys.length < 2) continue;

        for (var si = 0; si < selKeys.length - 1; si++) {
          var k1 = selKeys[si], k2 = selKeys[si + 1];
          var ta = p.keyTime(k1), tb = p.keyTime(k2);
          if ((tb - ta) < 6 / comp.frameRate) continue;

          var va = p.keyValue(k1), vb = p.keyValue(k2);
          if (valuesEqual(va, vb)) continue;

          results.push({ prop: p, t1: ta, v1: va, t2: tb, v2: vb, addAntic: true, addOver: true });
        }
      } catch(e) {}
    }
    return results;
  }

  function run(mode) {
    var comp = getComp();
    if (!comp) { alert("Please select a composition."); return; }

    var STRENGTH    = parseFloat(strengthInput.text)   || 15;
    var DECAY       = parseFloat(decayInput.text)      || 0.45;
    var STEPS_ANTIC = Math.max(1, parseInt(stepsAnticInput.text) || 1);
    var STEPS_OVER  = Math.max(1, parseInt(stepsOverInput.text)  || 2);

    var pairs = detectPairs(comp);
    if (pairs.length === 0) { alert("No valid keyframe pairs found. Select keyframes with movement between them."); return; }

    _undo("TNK: Anticipation + Overshoot", function() {
      for (var pi = 0; pi < pairs.length; pi++) {
        var work = pairs[pi];
        var doAntic = (mode === 0 || mode === 1) && work.addAntic;
        var doOver  = (mode === 1 || mode === 2) && work.addOver;
        if (!doAntic && !doOver) continue;

        var insertedTimes = [];
        var span  = work.t2 - work.t1;
        var aZone = span * 0.33;
        var oZone = span * 0.33;

        if (doAntic) {
          for (var s = 0; s < STEPS_ANTIC; s++) {
            var frac = (s + 1) / (STEPS_ANTIC + 1);
            var tA   = work.t1 + aZone * frac;
            var amp  = -(STRENGTH / 100) * Math.pow(DECAY, s);
            var vA   = lerp(work.v1, work.v2, amp);
            insertKey(work.prop, tA, vA, 9);
            insertedTimes.push(tA);
          }
        }

        if (doOver) {
          for (var so = 0; so < STEPS_OVER; so++) {
            var fracO = (so + 1) / (STEPS_OVER + 1);
            var tO    = (work.t2 - oZone) + oZone * fracO;
            var sign  = (so % 2 === 0) ? 1 : -1;
            var ampO  = 1 + sign * (STRENGTH / 100) * Math.pow(DECAY, so);
            var vO    = lerp(work.v1, work.v2, ampO);
            insertKey(work.prop, tO, vO, 11);
            insertedTimes.push(tO);
          }
        }

        try {
          for (var ti = 0; ti < insertedTimes.length; ti++) {
            var idx = work.prop.nearestKeyIndex(insertedTimes[ti]);
            work.prop.setSelectedAtKey(idx, true);
          }
        } catch(e) {}
      }
    });
  }

  btnAnticipation.onClick = function() { run(0); };
  btnBoth.onClick         = function() { run(1); };
  btnOvershoot.onClick    = function() { run(2); };

  win.layout.layout(true);
  win.center();
  win.show();
  return "Anticipation open";
}
