function decomposeComp()     { return "[WIP] Decompose comp — needs implementation"; }

// ═══════════════════════════════════════════════════════════════════════════
// LAYER STYLE FUNCTIONS — applyLayerStyleCmds, getActiveStylesJSON,
//   seSetProp, seEnableStyle, sePickColor, seRestoreSnapshot
// ═══════════════════════════════════════════════════════════════════════════

// STYLE_DEFS — matches LayerStyleEditor.jsx definition exactly
var _STYLE_DEFS = [
  { label:"Gradient Overlay", groupMn:"gradientFill/enabled", props:[
    { label:"Opacity",     mn:"gradientFill/opacity",  type:"slider", min:0,   max:100 },
    { label:"Angle",       mn:"gradientFill/angle",    type:"angle"                    },
    { label:"Scale",       mn:"gradientFill/scale",    type:"slider", min:10,  max:150 },
    { label:"Reverse",     mn:"gradientFill/reverse",  type:"bool"                     },
    { label:"Align Layer", mn:"gradientFill/align",    type:"bool"                     },
    { label:"Edit Colors", mn:"gradientFill/gradient", type:"gradient_btn"             }
  ]},
  { label:"Color Overlay", groupMn:"solidFill/enabled", props:[
    { label:"Color",   mn:"solidFill/color",   type:"color"                  },
    { label:"Opacity", mn:"solidFill/opacity", type:"slider", min:0, max:100 }
  ]},
  { label:"Stroke", groupMn:"frameFX/enabled", props:[
    { label:"Color",    mn:"frameFX/color",   type:"color"                   },
    { label:"Size",     mn:"frameFX/size",    type:"slider", min:1,  max:250 },
    { label:"Opacity",  mn:"frameFX/opacity", type:"slider", min:0,  max:100 },
    { label:"Position", mn:"frameFX/style",   type:"dropdown",
      options:["Outside","Inside","Center"], values:[1,2,3] }
  ]},
  { label:"Outer Glow", groupMn:"outerGlow/enabled", props:[
    { label:"Color",   mn:"outerGlow/color",        type:"color"                   },
    { label:"Opacity", mn:"outerGlow/opacity",      type:"slider", min:0,  max:100 },
    { label:"Noise",   mn:"outerGlow/noise",        type:"slider", min:0,  max:100 },
    { label:"Spread",  mn:"outerGlow/chokeMatte",   type:"slider", min:0,  max:100 },
    { label:"Size",    mn:"outerGlow/blur",         type:"slider", min:0,  max:250 }
  ]},
  { label:"Inner Glow", groupMn:"innerGlow/enabled", props:[
    { label:"Color",   mn:"innerGlow/color",        type:"color"                   },
    { label:"Opacity", mn:"innerGlow/opacity",      type:"slider", min:0,  max:100 },
    { label:"Noise",   mn:"innerGlow/noise",        type:"slider", min:0,  max:100 },
    { label:"Choke",   mn:"innerGlow/chokeMatte",   type:"slider", min:0,  max:100 },
    { label:"Size",    mn:"innerGlow/blur",         type:"slider", min:0,  max:250 }
  ]},
  { label:"Drop Shadow", groupMn:"dropShadow/enabled", props:[
    { label:"Color",        mn:"dropShadow/color",              type:"color"                    },
    { label:"Opacity",      mn:"dropShadow/opacity",            type:"slider", min:0,  max:100 },
    { label:"Angle",        mn:"dropShadow/localLightingAngle", type:"angle"                   },
    { label:"Distance",     mn:"dropShadow/distance",           type:"slider", min:0,  max:300 },
    { label:"Spread",       mn:"dropShadow/chokeMatte",         type:"slider", min:0,  max:100 },
    { label:"Size",         mn:"dropShadow/blur",               type:"slider", min:0,  max:250 },
    { label:"Noise",        mn:"dropShadow/noise",              type:"slider", min:0,  max:100 },
    { label:"Global Light", mn:"dropShadow/useGlobalAngle",     type:"bool"                    },
    { label:"Knocks Out",   mn:"dropShadow/layerConceals",      type:"bool"                    }
  ]},
  { label:"Inner Shadow", groupMn:"innerShadow/enabled", props:[
    { label:"Color",        mn:"innerShadow/color",              type:"color"                   },
    { label:"Opacity",      mn:"innerShadow/opacity",            type:"slider", min:0,  max:100 },
    { label:"Angle",        mn:"innerShadow/localLightingAngle", type:"angle"                   },
    { label:"Distance",     mn:"innerShadow/distance",           type:"slider", min:0,  max:300 },
    { label:"Choke",        mn:"innerShadow/chokeMatte",         type:"slider", min:0,  max:100 },
    { label:"Size",         mn:"innerShadow/blur",               type:"slider", min:0,  max:250 },
    { label:"Noise",        mn:"innerShadow/noise",              type:"slider", min:0,  max:100 },
    { label:"Global Light", mn:"innerShadow/useGlobalAngle",     type:"bool"                    }
  ]},
  { label:"Bevel & Emboss", groupMn:"bevelEmboss/enabled", props:[
    { label:"Depth",        mn:"bevelEmboss/strengthRatio",         type:"slider", min:1,  max:1000 },
    { label:"Size",         mn:"bevelEmboss/blur",                  type:"slider", min:0,  max:250  },
    { label:"Soften",       mn:"bevelEmboss/softness",              type:"slider", min:0,  max:16   },
    { label:"Angle",        mn:"bevelEmboss/localLightingAngle",    type:"angle"                    },
    { label:"Altitude",     mn:"bevelEmboss/localLightingAltitude", type:"slider", min:0,  max:90   },
    { label:"Hi Color",     mn:"bevelEmboss/highlightColor",        type:"color"                    },
    { label:"Hi Opacity",   mn:"bevelEmboss/highlightOpacity",      type:"slider", min:0,  max:100  },
    { label:"Sh Color",     mn:"bevelEmboss/shadowColor",           type:"color"                    },
    { label:"Sh Opacity",   mn:"bevelEmboss/shadowOpacity",         type:"slider", min:0,  max:100  },
    { label:"Global Light", mn:"bevelEmboss/useGlobalAngle",        type:"bool"                     }
  ]},
  { label:"Satin", groupMn:"chromeFX/enabled", props:[
    { label:"Color",    mn:"chromeFX/color",              type:"color"                   },
    { label:"Opacity",  mn:"chromeFX/opacity",            type:"slider", min:0,  max:100 },
    { label:"Angle",    mn:"chromeFX/localLightingAngle", type:"angle"                   },
    { label:"Distance", mn:"chromeFX/distance",           type:"slider", min:0,  max:250 },
    { label:"Size",     mn:"chromeFX/blur",               type:"slider", min:0,  max:250 },
    { label:"Invert",   mn:"chromeFX/invert",             type:"bool"                    }
  ]}
];

// ── APPLY LAYER STYLE COMMANDS ────────────────────────────────────────────
// cmds: array of menu command IDs, matchNames: array of style matchNames,
// skipExisting: bool — skip if style already enabled on layer
function applyLayerStyleCmds(cmds, matchNames, skipExisting) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  // Snapshot original selection so we can restore it
  var origSelected = [];
  for (var i = 0; i < layers.length; i++) origSelected.push(layers[i]);
  var applied = 0, skipped = 0;
  return _undo("TNK: Add Layer Styles", function() {
    for (var li = 0; li < origSelected.length; li++) {
      var layer = origSelected[li];
      for (var si = 0; si < cmds.length; si++) {
        // Check skip
        if (skipExisting) {
          try {
            var ls = layer.property("ADBE Layer Styles");
            var existing = ls ? ls.property(matchNames[si]) : null;
            if (existing && existing.enabled) { skipped++; continue; }
          } catch(e) {}
        }
        // Deselect all, select only this layer, fire command
        for (var j = 0; j < comp.numLayers; j++) {
          try { comp.layer(j+1).selected = false; } catch(e) {}
        }
        layer.selected = true;
        try { app.executeCommand(cmds[si]); applied++; } catch(e) {}
      }
    }
    // Restore original selection
    for (var k = 0; k < origSelected.length; k++) {
      try { origSelected[k].selected = true; } catch(e) {}
    }
    return "Styles applied: " + applied + (skipped ? " (skipped " + skipped + ")" : "");
  });
}

// ── GET ACTIVE STYLES JSON ────────────────────────────────────────────────
// Returns JSON string: { snapshot: [...], styles: [{label, gMn, props:[...]}] }
// snapshot[i] = { enabled:{gMn:bool}, props:{gMn:{pMn:val}} }
// Only includes style groups that are enabled on AT LEAST ONE selected layer.
function getActiveStylesJSON() {
  var comp = getComp(); if (!comp) return '"No comp"';
  var sel = comp.selectedLayers; if (!sel.length) return '"No layers selected"';

  function _readVal(layer, gMn, pMn) {
    try { return layer.property("ADBE Layer Styles").property(gMn).property(pMn).value; }
    catch(e) { return null; }
  }
  function _valToJSON(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return '"' + v.replace(/"/g,'\\\"') + '"';
    if (v && v.length !== undefined) {
      var parts = [];
      for (var i = 0; i < v.length; i++) parts.push(String(v[i]));
      return '[' + parts.join(',') + ']';
    }
    return 'null';
  }

  // Build snapshot for each layer
  var snapshotParts = [];
  for (var li = 0; li < sel.length; li++) {
    var layer = sel[li];
    var enabledParts = [], propsParts = [];
    for (var si = 0; si < _STYLE_DEFS.length; si++) {
      var def = _STYLE_DEFS[si];
      var gMn = def.groupMn;
      var isEnabled = false;
      try {
        var grp = layer.property("ADBE Layer Styles").property(gMn);
        isEnabled = !!(grp && grp.enabled);
      } catch(e) {}
      enabledParts.push('"' + gMn + '":' + isEnabled);
      var pp = [];
      for (var pi = 0; pi < def.props.length; pi++) {
        var pMn = def.props[pi].mn;
        if (def.props[pi].type === 'dropdown') continue; // skip, not easily serialised
        var pv = _readVal(layer, gMn, pMn);
        pp.push('"' + pMn + '":' + _valToJSON(pv));
      }
      propsParts.push('"' + gMn + '":{' + pp.join(',') + '}');
    }
    snapshotParts.push('{"enabled":{' + enabledParts.join(',') + '},"props":{' + propsParts.join(',') + '}}');
  }

  // Build active styles list (only groups enabled on >=1 layer)
  var activeStyleParts = [];
  for (var si = 0; si < _STYLE_DEFS.length; si++) {
    var def = _STYLE_DEFS[si];
    var gMn = def.groupMn;
    // Check if any layer has this enabled
    var anyEnabled = false;
    for (var li = 0; li < sel.length; li++) {
      try {
        var grp = sel[li].property("ADBE Layer Styles").property(gMn);
        if (grp && grp.enabled) { anyEnabled = true; break; }
      } catch(e) {}
    }
    if (!anyEnabled) continue;

    // Build props list with current values (from first layer that has it)
    var propsParts2 = [];
    for (var pi = 0; pi < def.props.length; pi++) {
      var pd = def.props[pi];
      var pMn = pd.mn;
      // gradient_btn has no readable scalar value — just emit the type marker
      if (pd.type === 'gradient_btn') {
        propsParts2.push('{"label":"' + pd.label + '","mn":"' + pMn + '","type":"gradient_btn","value":null}');
        continue;
      }
      // Find first value from a layer that has this style enabled
      var val = null;
      for (var li = 0; li < sel.length; li++) {
        try {
          var grp2 = sel[li].property("ADBE Layer Styles").property(gMn);
          if (grp2 && grp2.enabled) { val = _readVal(sel[li], gMn, pMn); if (val !== null) break; }
        } catch(e) {}
      }
      var propJSON = '{"label":"' + pd.label + '","mn":"' + pMn + '","type":"' + pd.type + '","value":' + _valToJSON(val);
      if (pd.min !== undefined) propJSON += ',"min":' + pd.min + ',"max":' + pd.max;
      if (pd.options) {
        var opts = [], vals = [];
        for (var oi = 0; oi < pd.options.length; oi++) { opts.push('"'+pd.options[oi]+'"'); vals.push(pd.values[oi]); }
        propJSON += ',"options":[' + opts.join(',') + '],"values":[' + vals.join(',') + ']';
      }
      propJSON += '}';
      propsParts2.push(propJSON);
    }
    activeStyleParts.push('{"label":"' + def.label + '","gMn":"' + gMn + '","props":[' + propsParts2.join(',') + ']}');
  }

  return '{"snapshot":[' + snapshotParts.join(',') + '],"styles":[' + activeStyleParts.join(',') + ']}';
}

// ── seSetProp — set a style property on all selected layers ───────────────
function seSetProp(gMn, pMn, val) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Style Edit", function() {
    for (var i = 0; i < sel.length; i++) {
      try {
        var grp = sel[i].property("ADBE Layer Styles").property(gMn);
        if (!grp || !grp.enabled) continue;
        var prop = grp.property(pMn);
        if (prop) prop.setValue(val);
      } catch(e) {}
    }
    return "ok";
  });
}

// ── seEnableStyle — enable/disable a style group on all selected layers ───
function seEnableStyle(gMn, state) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: " + (state ? "Enable" : "Disable") + " Style", function() {
    for (var i = 0; i < sel.length; i++) {
      try {
        var grp = sel[i].property("ADBE Layer Styles").property(gMn);
        if (grp) grp.enabled = !!state;
      } catch(e) {}
    }
    return state ? "Style enabled" : "Style disabled";
  });
}

// ── sePickColor — open AE color picker for a style property ───────────────
// Opens picker on first selected layer that has the style, returns [r,g,b] JSON or "cancelled"
function sePickColor(gMn, pMn) {
  var comp = getComp(); if (!comp) return '"No comp"';
  var sel = comp.selectedLayers; if (!sel.length) return '"No layers selected"';

  // Find first layer with this style enabled
  var targetLayer = null, targetProp = null;
  for (var i = 0; i < sel.length; i++) {
    try {
      var grp = sel[i].property("ADBE Layer Styles").property(gMn);
      if (grp && grp.enabled) {
        var p = grp.property(pMn);
        if (p) { targetLayer = sel[i]; targetProp = p; break; }
      }
    } catch(e) {}
  }
  if (!targetProp) return '"No active style found"';

  // Use a temp null layer + color control to open AE's color picker
  var origSelected = [];
  for (var j = 0; j < comp.numLayers; j++) {
    try { if (comp.layer(j+1).selected) { origSelected.push(j+1); comp.layer(j+1).selected = false; } } catch(e) {}
  }
  var nullLayer = null;
  var result = "cancelled";
  try {
    nullLayer = comp.layers.addNull();
    var cp = nullLayer.property("ADBE Effect Parade").addProperty("ADBE Color Control");
    var cpProp = cp.property("ADBE Color Control-0001");
    // Seed with current color
    try { cpProp.setValue(targetProp.value); } catch(e) {}
    nullLayer.selected = true;
    cpProp.selected = true;
    app.executeCommand(app.findMenuCommandId("Edit Value..."));
    // Read back the new value
    var newColor = cpProp.value;
    if (newColor && newColor.length >= 3) {
      result = '[' + newColor[0] + ',' + newColor[1] + ',' + newColor[2] + ']';
      // Apply to all layers that have this style
      return _undo("TNK: Style Color", function() {
        for (var li = 0; li < sel.length; li++) {
          try {
            var grp2 = sel[li].property("ADBE Layer Styles").property(gMn);
            if (grp2 && grp2.enabled) {
              var p2 = grp2.property(pMn);
              if (p2) p2.setValue(newColor);
            }
          } catch(e) {}
        }
              return "Color applied";
});
    }
  } catch(e) {}
  // Clean up null layer
  try { if (nullLayer) nullLayer.remove(); } catch(e) {}
  // Restore selection
  for (var k = 0; k < origSelected.length; k++) {
    try { comp.layer(origSelected[k]).selected = true; } catch(e) {}
  }
  return result;
}

// ── seRestoreSnapshot — restore style state from a previously saved snapshot
// snapshotJSON: JSON string of snapshot array (from getActiveStylesJSON)
// ── seEditGradient — open AE's native gradient editor on selected layers ─
// Selects all layers that have Gradient Overlay active, selects the gradient
// property, fires "Edit Value..." to open native picker.
function seEditGradient() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  // Save original selection indices
  var origSelected = [];
  for (var j = 1; j <= comp.numLayers; j++) {
    try { if (comp.layer(j).selected) origSelected.push(j); } catch(e) {}
  }
  // Deselect all
  for (var j2 = 1; j2 <= comp.numLayers; j2++) {
    try { comp.layer(j2).selected = false; } catch(e) {}
  }
  var found = 0;
  for (var i = 0; i < sel.length; i++) {
    try {
      var grp = sel[i].property("ADBE Layer Styles").property("gradientFill/enabled");
      if (!grp || !grp.enabled) continue;
      sel[i].selected = true;
      // Select the gradient Colors sub-property (index 3 in the group)
      try {
        var gradProp = grp.property(3);
        if (gradProp) gradProp.selected = true;
      } catch(e) {}
      found++;
    } catch(e) {}
  }
  if (found > 0) {
    try { app.executeCommand(app.findMenuCommandId("Edit Value...")); } catch(e) {}
  }
  // Restore selection
  for (var k = 0; k < origSelected.length; k++) {
    try { comp.layer(origSelected[k]).selected = true; } catch(e) {}
  }
  return found > 0 ? "ok" : "No active Gradient Overlay found";
}

function seRestoreSnapshot(snapshotJSON) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var snapshot;
  try { snapshot = eval('(' + snapshotJSON + ')'); } catch(e) { return "Bad snapshot"; }
  return _undo("TNK: Undo Style Edits", function() {
    for (var li = 0; li < sel.length && li < snapshot.length; li++) {
      var layer = sel[li];
      var snap = snapshot[li];
      if (!snap) continue;
      // Restore enabled states
      for (var gMn in snap.enabled) {
        try {
          var grp = layer.property("ADBE Layer Styles").property(gMn);
          if (grp) grp.enabled = snap.enabled[gMn];
        } catch(e) {}
      }
      // Restore property values
      for (var gMn in snap.props) {
        for (var pMn in snap.props[gMn]) {
          try {
            var grp2 = layer.property("ADBE Layer Styles").property(gMn);
            if (grp2) { var p = grp2.property(pMn); if (p) p.setValue(snap.props[gMn][pMn]); }
          } catch(e) {}
        }
      }
    }
    return "Styles restored";
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ANCHOR POINT — setAnchorToPoint, getMaskBBox
// Ported from Anchor_Point_Master.jsx
// ═══════════════════════════════════════════════════════════════════════════

