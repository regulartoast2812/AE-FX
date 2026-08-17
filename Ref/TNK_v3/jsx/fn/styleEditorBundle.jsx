// TNK — Style Editor bundle (requires _STYLE_DEFS)

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


function getStyleStatusJSON() {
  var comp = getComp(); if (!comp) return '{}';
  var sel = comp.selectedLayers; if (!sel.length) return '{}';
  var GMN_LIST = [
    'dropShadow/enabled','innerShadow/enabled','outerGlow/enabled','innerGlow/enabled',
    'bevelEmboss/enabled','chromeFX/enabled','solidFill/enabled','gradientFill/enabled','frameFX/enabled'
  ];
  var total = sel.length;
  var parts = [];
  for (var si = 0; si < GMN_LIST.length; si++) {
    var gMn = GMN_LIST[si];
    var haveCount = 0;
    for (var li = 0; li < sel.length; li++) {
      try {
        var grp = sel[li].property("ADBE Layer Styles").property(gMn);
        if (grp && grp.enabled) haveCount++;
      } catch(e) {}
    }
    parts.push('"' + gMn + '":{"have":' + haveCount + ',"missing":' + (total - haveCount) + ',"total":' + total + '}');
  }
  return '{' + parts.join(',') + '}';
}

function getLayerStylesEnabledState() {
  var comp = getComp(); if (!comp) return "false";
  var sel = comp.selectedLayers; if (!sel.length) return "false";
  for (var i = 0; i < sel.length; i++) {
    try { if (sel[i].property("ADBE Layer Styles").enabled) return "true"; } catch(e) {}
  }
  return "false";
}

function getActiveStylesJSON() {
  var comp = getComp(); if (!comp) return "\"No comp\"";
  var sel = comp.selectedLayers; if (!sel.length) return "\"No layers selected\"";

  function _rv(layer, gMn, pMn) {
    try { return layer.property("ADBE Layer Styles").property(gMn).property(pMn).value; }
    catch(e) { return null; }
  }
  function _vj(v) {
    if (v === null || v === undefined) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number")  return String(v);
    if (typeof v === "string")  return "\"" + v + "\"";
    if (v && v.length !== undefined) {
      var a = [];
      for (var ai = 0; ai < v.length; ai++) a.push(String(v[ai]));
      return "[" + a.join(",") + "]";
    }
    return "null";
  }

  // Snapshot
  var snapParts = [];
  for (var li = 0; li < sel.length; li++) {
    var layer = sel[li];
    var enParts = [], prParts = [];
    for (var si = 0; si < _STYLE_DEFS.length; si++) {
      var def = _STYLE_DEFS[si];
      var gmn = def.groupMn;
      var isEn = false;
      try {
        var grp = layer.property("ADBE Layer Styles").property(gmn);
        isEn = !!(grp && grp.enabled);
      } catch(e) {}
      enParts.push("\"" + gmn + "\":" + isEn);
      var pp = [];
      for (var pi = 0; pi < def.props.length; pi++) {
        var pmn = def.props[pi].mn;
        if (def.props[pi].type === "dropdown") continue;
        pp.push("\"" + pmn + "\":" + _vj(_rv(layer, gmn, pmn)));
      }
      prParts.push("\"" + gmn + "\":{" + pp.join(",") + "}");
    }
    snapParts.push("{\"enabled\":{" + enParts.join(",") + "},\"props\":{" + prParts.join(",") + "}}");
  }

  // Active styles
  var activeParts = [];
  for (var si2 = 0; si2 < _STYLE_DEFS.length; si2++) {
    var def2 = _STYLE_DEFS[si2];
    var gmn2 = def2.groupMn;
    var anyEn = false;
    for (var li2 = 0; li2 < sel.length; li2++) {
      try {
        var grp2 = sel[li2].property("ADBE Layer Styles").property(gmn2);
        if (grp2 && grp2.enabled) { anyEn = true; break; }
      } catch(e) {}
    }
    if (!anyEn) continue;

    var prList = [];
    for (var pi2 = 0; pi2 < def2.props.length; pi2++) {
      var pd = def2.props[pi2];
      var pmn2 = pd.mn;
      if (pd.type === "gradient_btn") {
        prList.push("{\"label\":\"" + pd.label + "\",\"mn\":\"" + pmn2 + "\",\"type\":\"gradient_btn\",\"value\":null}");
        continue;
      }
      var val = null;
      for (var li3 = 0; li3 < sel.length; li3++) {
        try {
          var grp3 = sel[li3].property("ADBE Layer Styles").property(gmn2);
          if (grp3 && grp3.enabled) { val = _rv(sel[li3], gmn2, pmn2); if (val !== null) break; }
        } catch(e) {}
      }
      var pj = "{\"label\":\"" + pd.label + "\",\"mn\":\"" + pmn2 + "\",\"type\":\"" + pd.type + "\",\"value\":" + _vj(val);
      if (pd.min !== undefined) pj += ",\"min\":" + pd.min + ",\"max\":" + pd.max;
      if (pd.options) {
        var opts = [], ovals = [];
        for (var oi = 0; oi < pd.options.length; oi++) {
          opts.push("\"" + pd.options[oi] + "\"");
          ovals.push(pd.values[oi]);
        }
        pj += ",\"options\":[" + opts.join(",") + "],\"values\":[" + ovals.join(",") + "]";
      }
      pj += "}";
      prList.push(pj);
    }
    activeParts.push("{\"label\":\"" + def2.label + "\",\"gMn\":\"" + gmn2 + "\",\"props\":[" + prList.join(",") + "]}");
  }

  return "{\"snapshot\":[" + snapParts.join(",") + "],\"styles\":[" + activeParts.join(",") + "]}";
}

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

function sePickColor(gMn, pMn) {
  var comp = getComp(); if (!comp) return "\"No comp\"";
  var sel = comp.selectedLayers; if (!sel.length) return "\"No layers selected\"";

  // Find first enabled layer with this style
  var targetProp = null;
  for (var i = 0; i < sel.length; i++) {
    try {
      var grp = sel[i].property("ADBE Layer Styles").property(gMn);
      if (grp && grp.enabled) {
        var p = grp.property(pMn);
        if (p) { targetProp = p; break; }
      }
    } catch(e) {}
  }
  if (!targetProp) return "\"No active style found\"";

  // Save + clear selection
  var origSelected = [];
  for (var j = 1; j <= comp.numLayers; j++) {
    try {
      if (comp.layer(j).selected) {
        origSelected.push(j);
        comp.layer(j).selected = false;
      }
    } catch(e) {}
  }

  var nullLayer = null;
  var result = "\"cancelled\"";

  try {
    nullLayer = comp.layers.addNull();
    var cp = nullLayer.property("ADBE Effect Parade").addProperty("ADBE Color Control");
    var cpProp = cp.property("ADBE Color Control-0001");
    try { cpProp.setValue(targetProp.value); } catch(e) {}
    nullLayer.selected = true;
    cpProp.selected = true;
    app.executeCommand(app.findMenuCommandId("Edit Value..."));
    var newColor = cpProp.value;
    if (newColor && newColor.length >= 3) {
      result = "[" + newColor[0] + "," + newColor[1] + "," + newColor[2] + "]";
      _undo("TNK: Style Color", function() {
        for (var li = 0; li < sel.length; li++) {
          try {
            var grp2 = sel[li].property("ADBE Layer Styles").property(gMn);
            if (grp2 && grp2.enabled) {
              var p2 = grp2.property(pMn);
              if (p2) p2.setValue(newColor);
            }
          } catch(e) {}
        }
      });
    }
  } catch(e) {}

  // Always clean up
  try { if (nullLayer) nullLayer.remove(); } catch(e) {}
  for (var k = 0; k < origSelected.length; k++) {
    try { comp.layer(origSelected[k]).selected = true; } catch(e) {}
  }
  return result;
}

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
      for (var rGmn in snap.enabled) {
        try {
          var grp = layer.property("ADBE Layer Styles").property(rGmn);
          if (grp) grp.enabled = snap.enabled[rGmn];
        } catch(e) {}
      }
      // Restore property values
      for (var rGmn2 in snap.props) {
        for (var rPmn in snap.props[rGmn2]) {
          try {
            var grp2 = layer.property("ADBE Layer Styles").property(rGmn2);
            if (grp2) { var p = grp2.property(rPmn); if (p) p.setValue(snap.props[rGmn2][rPmn]); }
          } catch(e) {}
        }
      }
    }
    return "Styles restored";
  });
}
