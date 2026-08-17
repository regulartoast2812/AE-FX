// cropComp — crops selected precomp layers in the active timeline.
// Uses dual-null reference system to preserve world-space position in parent comps.
// Based on CropComp v17 by user.
function cropComp(useActive, pad) {
  var proj   = app.project;
  var active = app.project.activeItem;

  // ── Collect { comp, compLayer, parentComp } targets ─────────────────────
  var targets = [];
  var seenIds = {};

  function addTarget(comp, compLayer, parentComp) {
    if (!comp || seenIds[comp.id]) return;
    seenIds[comp.id] = true;
    targets.push({ comp: comp, compLayer: compLayer, parentComp: parentComp });
  }

  // Selected layers in active timeline
  if (active instanceof CompItem) {
    for (var li = 1; li <= active.numLayers; li++) {
      var lyr = active.layer(li);
      if (!lyr.selected) continue;
      try { if (lyr.source instanceof CompItem) addTarget(lyr.source, lyr, active); } catch(e) {}
    }
  }

  // Project panel selection (no parent info available)
  for (var i = 0; i < proj.selection.length; i++) {
    if (proj.selection[i] instanceof CompItem) addTarget(proj.selection[i], null, null);
  }

  if (targets.length === 0) return "No comp layers selected";

  // ── Bbox helpers ─────────────────────────────────────────────────────────
  function getStrokeExpansion(layer, t) {
    var maxStroke = 0;
    try {
      var contents = layer.property("ADBE Root Vectors Group");
      if (!contents) return 0;
      function walkGroup(grp) {
        for (var i = 1; i <= grp.numProperties; i++) {
          var p = grp.property(i);
          if (!p) continue;
          if (p.matchName === "ADBE Vector Graphic - Stroke") {
            try { var w = p.property("ADBE Vector Stroke Width").valueAtTime(t, false); if (w > maxStroke) maxStroke = w; } catch(e) {}
          }
          if (p.matchName === "ADBE Vector Group") {
            try { walkGroup(p.property("ADBE Vectors Group")); } catch(e) {}
          }
        }
      }
      walkGroup(contents);
    } catch(e) {}
    return maxStroke / 2;
  }

  function getEffectExpansion(layer, t) {
    var expand = 0;
    try {
      var effects = layer.property("ADBE Effect Parade");
      if (!effects) return 0;
      for (var i = 1; i <= effects.numProperties; i++) {
        var fx = effects.property(i);
        if (!fx) continue;
        try {
          if (fx.matchName === "ADBE Drop Shadow") {
            var dist = fx.property("ADBE Drop Shadow-0003").valueAtTime(t, false);
            var soft = fx.property("ADBE Drop Shadow-0005").valueAtTime(t, false);
            expand = Math.max(expand, dist + soft);
          }
          if (fx.matchName === "ADBE Glow")
            expand = Math.max(expand, fx.property("ADBE Glow-0002").valueAtTime(t, false));
          if (fx.matchName === "ADBE Gaussian Blur 2")
            expand = Math.max(expand, fx.property("ADBE Gaussian Blur 2-0001").valueAtTime(t, false) * 2);
          if (fx.matchName === "ADBE Box Blur2")
            expand = Math.max(expand, fx.property("ADBE Box Blur2-0001").valueAtTime(t, false) * 2);
        } catch(e) {}
      }
    } catch(e) {}
    return expand;
  }

  function layerBbox(layer, t) {
    var xf  = layer.property("ADBE Transform Group");
    var pos = xf.property("ADBE Position").valueAtTime(t, false);
    var anc = xf.property("ADBE Anchor Point").valueAtTime(t, false);
    var scl = xf.property("ADBE Scale").valueAtTime(t, false);
    var rot = xf.property("ADBE Rotate Z").valueAtTime(t, false);
    var sx  = scl[0] / 100, sy = scl[1] / 100;
    var rad = rot * Math.PI / 180;
    var rect = null;
    try { rect = layer.sourceRectAtTime(t, false); } catch(e) {}
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    var expand = 0;
    if (layer.matchName === "ADBE Vector Layer") expand = Math.max(expand, getStrokeExpansion(layer, t));
    expand = Math.max(expand, getEffectExpansion(layer, t));

    var corners = [
      [rect.left  - expand,              rect.top    - expand],
      [rect.left  + rect.width + expand, rect.top    - expand],
      [rect.left  - expand,              rect.top    + rect.height + expand],
      [rect.left  + rect.width + expand, rect.top    + rect.height + expand]
    ];
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (var c = 0; c < corners.length; c++) {
      var lx = corners[c][0] - anc[0], ly = corners[c][1] - anc[1];
      var wx = (lx * sx) * Math.cos(rad) - (ly * sy) * Math.sin(rad) + pos[0];
      var wy = (lx * sx) * Math.sin(rad) + (ly * sy) * Math.cos(rad) + pos[1];
      if (wx < minX) minX = wx; if (wy < minY) minY = wy;
      if (wx > maxX) maxX = wx; if (wy > maxY) maxY = wy;
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  // ── Compute bounds for each target ───────────────────────────────────────
  for (var ti = 0; ti < targets.length; ti++) {
    var comp = targets[ti].comp;
    var t    = comp.time;
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    var found = false;
    for (var l = 1; l <= comp.numLayers; l++) {
      var layer = comp.layer(l);
      if (!layer.active || layer.guideLayer) continue;
      if (t < layer.inPoint || t > layer.outPoint) continue;
      try {
        var bb = layerBbox(layer, t);
        if (!bb) continue;
        if (bb.minX < minX) minX = bb.minX; if (bb.minY < minY) minY = bb.minY;
        if (bb.maxX > maxX) maxX = bb.maxX; if (bb.maxY > maxY) maxY = bb.maxY;
        found = true;
      } catch(e) {}
    }
    if (!found) { targets[ti].skip = true; continue; }
    var padding = (pad && pad > 0) ? pad : 0;
    targets[ti].newLeft = Math.round(minX) - padding;
    targets[ti].newTop  = Math.round(minY) - padding;
    targets[ti].newW    = Math.round(maxX) - targets[ti].newLeft + padding;
    targets[ti].newH    = Math.round(maxY) - targets[ti].newTop  + padding;
    targets[ti].compW   = comp.width; targets[ti].compH = comp.height;
  }

  // ── Apply ─────────────────────────────────────────────────────────────────
  return _undo("TNK: Crop Comps", function() {
    var report = [];
    for (var ti2 = 0; ti2 < targets.length; ti2++) {
      var tgt = targets[ti2];
      if (tgt.skip) { report.push(tgt.comp.name + ": no bounds — skipped"); continue; }

      var comp2       = tgt.comp;
      var compLayer2  = tgt.compLayer;
      var parentComp2 = tgt.parentComp;
      var newLeft2    = tgt.newLeft, newTop2 = tgt.newTop;
      var newW2       = tgt.newW,    newH2   = tgt.newH;
      var compW2      = tgt.compW,   compH2  = tgt.compH;

      // Step 1: Outside null in parent (preserves world position)
      var outsideNull = null;
      if (compLayer2 && parentComp2) {
        outsideNull = parentComp2.layers.addNull();
        outsideNull.name = "_OUTSIDE_REF";
        var clXf = compLayer2.property("ADBE Transform Group");
        var oXf  = outsideNull.property("ADBE Transform Group");
        oXf.property("ADBE Position").setValue(clXf.property("ADBE Position").value);
        oXf.property("ADBE Scale").setValue(clXf.property("ADBE Scale").value);
        oXf.property("ADBE Rotate Z").setValue(clXf.property("ADBE Rotate Z").value);
        oXf.property("ADBE Anchor Point").setValue([0, 0]);
      }

      // Step 2: Inside null at anchor coords
      var insideNull = comp2.layers.addNull();
      insideNull.name = "_INSIDE_REF";
      var anchorInComp = [compW2 / 2, compH2 / 2];
      if (compLayer2) {
        try {
          var a = compLayer2.property("ADBE Transform Group").property("ADBE Anchor Point").value;
          anchorInComp = [a[0], a[1]];
        } catch(e) {}
      }
      insideNull.property("ADBE Transform Group").property("ADBE Position").setValue(anchorInComp);
      insideNull.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);

      // Step 3: Parent all layers to inside null
      for (var l2 = 1; l2 <= comp2.numLayers; l2++) {
        var lyr2 = comp2.layer(l2);
        if (lyr2 === insideNull) continue;
        try { lyr2.parent = insideNull; } catch(e) {}
      }

      // Step 4: Shift inside null by crop offset
      insideNull.property("ADBE Transform Group").property("ADBE Position")
        .setValue([anchorInComp[0] - newLeft2, anchorInComp[1] - newTop2]);

      // Step 5: Unparent all layers
      for (var l3 = 1; l3 <= comp2.numLayers; l3++) {
        var lyr3 = comp2.layer(l3);
        if (lyr3 === insideNull) continue;
        try { lyr3.parent = null; } catch(e) {}
      }

      // Step 6: Delete inside null + resize comp
      insideNull.remove();
      comp2.width  = newW2;
      comp2.height = newH2;

      // Step 7: Update anchor in parent to compensate for canvas shift
      if (compLayer2 && outsideNull) {
        compLayer2.property("ADBE Transform Group").property("ADBE Anchor Point")
          .setValue([anchorInComp[0] - newLeft2, anchorInComp[1] - newTop2]);
        outsideNull.remove();
      }

      report.push(comp2.name + ": " + compW2 + "x" + compH2 + " → " + newW2 + "x" + newH2);
    }
    return report.join(" | ");
  });
}
