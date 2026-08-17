/*
  TNT Layer Styles Panel
  Standalone After Effects ScriptUI panel.

  Install:
    Copy this file to After Effects/Scripts/ScriptUI Panels/
    Restart After Effects, then open it from Window > TNT Layer Styles Panel.
*/

(function TNTLayerStylesPanel(thisObj) {
  var STYLE_DEFS = [
    { label: "Color Overlay", cmd: 9006, groupMn: "solidFill/enabled", props: [
      { label: "Color", mn: "solidFill/color", type: "color" },
      { label: "Opacity", mn: "solidFill/opacity", type: "slider", min: 0, max: 100 }
    ]},
    { label: "Gradient Overlay", cmd: 9007, groupMn: "gradientFill/enabled", props: [
      { label: "Opacity", mn: "gradientFill/opacity", type: "slider", min: 0, max: 100 },
      { label: "Angle", mn: "gradientFill/angle", type: "angle", min: 0, max: 360 },
      { label: "Scale", mn: "gradientFill/scale", type: "slider", min: 10, max: 150 },
      { label: "Reverse", mn: "gradientFill/reverse", type: "bool" },
      { label: "Align Layer", mn: "gradientFill/align", type: "bool" },
      { label: "Edit Colors", mn: "gradientFill/gradient", type: "gradient" }
    ]},
    { label: "Satin", cmd: 9005, groupMn: "chromeFX/enabled", props: [
      { label: "Color", mn: "chromeFX/color", type: "color" },
      { label: "Opacity", mn: "chromeFX/opacity", type: "slider", min: 0, max: 100 },
      { label: "Angle", mn: "chromeFX/localLightingAngle", type: "angle", min: 0, max: 360 },
      { label: "Distance", mn: "chromeFX/distance", type: "slider", min: 0, max: 250 },
      { label: "Size", mn: "chromeFX/blur", type: "slider", min: 0, max: 250 },
      { label: "Invert", mn: "chromeFX/invert", type: "bool" }
    ]},
    { label: "Bevel & Emboss", cmd: 9004, groupMn: "bevelEmboss/enabled", props: [
      { label: "Depth", mn: "bevelEmboss/strengthRatio", type: "slider", min: 1, max: 1000 },
      { label: "Size", mn: "bevelEmboss/blur", type: "slider", min: 0, max: 250 },
      { label: "Soften", mn: "bevelEmboss/softness", type: "slider", min: 0, max: 16 },
      { label: "Angle", mn: "bevelEmboss/localLightingAngle", type: "angle", min: 0, max: 360 },
      { label: "Altitude", mn: "bevelEmboss/localLightingAltitude", type: "slider", min: 0, max: 90 },
      { label: "Hi Color", mn: "bevelEmboss/highlightColor", type: "color" },
      { label: "Hi Opacity", mn: "bevelEmboss/highlightOpacity", type: "slider", min: 0, max: 100 },
      { label: "Sh Color", mn: "bevelEmboss/shadowColor", type: "color" },
      { label: "Sh Opacity", mn: "bevelEmboss/shadowOpacity", type: "slider", min: 0, max: 100 },
      { label: "Global Light", mn: "bevelEmboss/useGlobalAngle", type: "bool" }
    ]},
    { label: "Stroke", cmd: 9008, groupMn: "frameFX/enabled", props: [
      { label: "Color", mn: "frameFX/color", type: "color" },
      { label: "Size", mn: "frameFX/size", type: "slider", min: 1, max: 250 },
      { label: "Opacity", mn: "frameFX/opacity", type: "slider", min: 0, max: 100 },
      { label: "Position", mn: "frameFX/style", type: "dropdown", options: ["Outside", "Inside", "Center"], values: [1, 2, 3] }
    ]},
    { label: "Inner Glow", cmd: 9003, groupMn: "innerGlow/enabled", props: [
      { label: "Color", mn: "innerGlow/color", type: "color" },
      { label: "Opacity", mn: "innerGlow/opacity", type: "slider", min: 0, max: 100 },
      { label: "Noise", mn: "innerGlow/noise", type: "slider", min: 0, max: 100 },
      { label: "Choke", mn: "innerGlow/chokeMatte", type: "slider", min: 0, max: 100 },
      { label: "Size", mn: "innerGlow/blur", type: "slider", min: 0, max: 250 }
    ]},
    { label: "Outer Glow", cmd: 9002, groupMn: "outerGlow/enabled", props: [
      { label: "Color", mn: "outerGlow/color", type: "color" },
      { label: "Opacity", mn: "outerGlow/opacity", type: "slider", min: 0, max: 100 },
      { label: "Noise", mn: "outerGlow/noise", type: "slider", min: 0, max: 100 },
      { label: "Spread", mn: "outerGlow/chokeMatte", type: "slider", min: 0, max: 100 },
      { label: "Size", mn: "outerGlow/blur", type: "slider", min: 0, max: 250 }
    ]},
    { label: "Inner Shadow", cmd: 9001, groupMn: "innerShadow/enabled", props: [
      { label: "Color", mn: "innerShadow/color", type: "color" },
      { label: "Opacity", mn: "innerShadow/opacity", type: "slider", min: 0, max: 100 },
      { label: "Angle", mn: "innerShadow/localLightingAngle", type: "angle", min: 0, max: 360 },
      { label: "Distance", mn: "innerShadow/distance", type: "slider", min: 0, max: 300 },
      { label: "Choke", mn: "innerShadow/chokeMatte", type: "slider", min: 0, max: 100 },
      { label: "Size", mn: "innerShadow/blur", type: "slider", min: 0, max: 250 },
      { label: "Noise", mn: "innerShadow/noise", type: "slider", min: 0, max: 100 },
      { label: "Global Light", mn: "innerShadow/useGlobalAngle", type: "bool" }
    ]},
    { label: "Drop Shadow", cmd: 9000, groupMn: "dropShadow/enabled", props: [
      { label: "Color", mn: "dropShadow/color", type: "color" },
      { label: "Opacity", mn: "dropShadow/opacity", type: "slider", min: 0, max: 100 },
      { label: "Angle", mn: "dropShadow/localLightingAngle", type: "angle", min: 0, max: 360 },
      { label: "Distance", mn: "dropShadow/distance", type: "slider", min: 0, max: 300 },
      { label: "Spread", mn: "dropShadow/chokeMatte", type: "slider", min: 0, max: 100 },
      { label: "Size", mn: "dropShadow/blur", type: "slider", min: 0, max: 250 },
      { label: "Noise", mn: "dropShadow/noise", type: "slider", min: 0, max: 100 },
      { label: "Global Light", mn: "dropShadow/useGlobalAngle", type: "bool" },
      { label: "Knocks Out", mn: "dropShadow/layerConceals", type: "bool" }
    ]}
  ];

  var STYLE_MNS = [
    "solidFill/enabled", "gradientFill/enabled", "chromeFX/enabled",
    "bevelEmboss/enabled", "frameFX/enabled", "innerGlow/enabled",
    "outerGlow/enabled", "innerShadow/enabled", "dropShadow/enabled",
    "patternFill/enabled"
  ];

  var snapshot = null;
  var ui = {};

  function comp() {
    var item = app.project && app.project.activeItem;
    return item && item instanceof CompItem ? item : null;
  }

  function selectedLayers() {
    var c = comp();
    return c ? c.selectedLayers : [];
  }

  function undo(label, fn) {
    app.beginUndoGroup(label);
    var result = "";
    try {
      result = fn();
    } catch (err) {
      result = "Error: " + String(err);
    }
    try { app.endUndoGroup(); } catch (_) {}
    return result;
  }

  function styleDefByGroup(gMn) {
    for (var i = 0; i < STYLE_DEFS.length; i++) {
      if (STYLE_DEFS[i].groupMn === gMn) return STYLE_DEFS[i];
    }
    return null;
  }

  function styleLabelForGroup(gMn) {
    var def = styleDefByGroup(gMn);
    return def ? def.label : "";
  }

  function propertyMatches(prop, gMn, label) {
    if (!prop) return false;
    try { if (prop.matchName === gMn) return true; } catch (_) {}
    try { if (label && prop.name === label) return true; } catch (_) {}
    return false;
  }

  function findStyleGroup(layer, gMn) {
    try {
      var ls = layer.property("ADBE Layer Styles");
      var label = styleLabelForGroup(gMn);
      if (!ls) return null;
      for (var p = ls.numProperties; p >= 1; p--) {
        var prop = null;
        try { prop = ls.property(p); } catch (_) {}
        if (propertyMatches(prop, gMn, label)) return prop;
      }
    } catch (_) {}
    return null;
  }

  function activeStyleGroups() {
    var layers = selectedLayers();
    var out = [];
    for (var s = 0; s < STYLE_DEFS.length; s++) {
      var def = STYLE_DEFS[s];
      var have = 0;
      var enabled = 0;
      for (var i = 0; i < layers.length; i++) {
        var grp = findStyleGroup(layers[i], def.groupMn);
        if (grp) {
          have++;
          try { if (grp.enabled) enabled++; } catch (_) {}
        }
      }
      if (have) out.push({ def: def, have: have, enabled: enabled });
    }
    return out;
  }

  function firstPropValue(gMn, pMn) {
    var layers = selectedLayers();
    for (var i = 0; i < layers.length; i++) {
      try {
        var grp = findStyleGroup(layers[i], gMn);
        var prop = grp ? grp.property(pMn) : null;
        if (prop) return prop.value;
      } catch (_) {}
    }
    return null;
  }

  function setStatus(text) {
    if (ui.status) ui.status.text = text || "";
  }

  function restoreLayerSelection(c, layers) {
    if (!c || !layers) return;
    for (var i = 1; i <= c.numLayers; i++) {
      try { c.layer(i).selected = false; } catch (_) {}
    }
    for (var j = 0; j < layers.length; j++) {
      try { layers[j].selected = true; } catch (_) {}
    }
  }

  function addStyle(def) {
    var c = comp();
    var layers = selectedLayers();
    if (!c) return "No active comp";
    if (!layers.length) return "Select at least one layer";
    var original = [];
    for (var i = 0; i < layers.length; i++) original.push(layers[i]);
    return undo("TNT: Add " + def.label, function () {
      var applied = 0;
      var skipped = 0;
      try { c.openInViewer(); } catch (_) {}
      for (var li = 0; li < original.length; li++) {
        var layer = original[li];
        var existing = findStyleGroup(layer, def.groupMn);
        if (existing && existing.enabled) {
          skipped++;
          continue;
        }
        restoreLayerSelection(c, [layer]);
        try {
          app.executeCommand(def.cmd);
          applied++;
        } catch (_) {}
      }
      restoreLayerSelection(c, original);
      return def.label + ": " + applied + " added" + (skipped ? ", " + skipped + " skipped" : "");
    });
  }

  function setStyleEnabled(gMn, state) {
    var layers = selectedLayers();
    if (!layers.length) return "Select at least one layer";
    return undo("TNT: " + (state ? "Enable" : "Disable") + " Style", function () {
      var changed = 0;
      for (var i = 0; i < layers.length; i++) {
        try {
          var grp = findStyleGroup(layers[i], gMn);
          if (grp) {
            grp.enabled = !!state;
            changed++;
          }
        } catch (_) {}
      }
      return (state ? "Enabled " : "Disabled ") + changed + " style group" + (changed === 1 ? "" : "s");
    });
  }

  function setStyleProp(gMn, pMn, value) {
    var layers = selectedLayers();
    if (!layers.length) return "Select at least one layer";
    return undo("TNT: Style Edit", function () {
      var changed = 0;
      for (var i = 0; i < layers.length; i++) {
        try {
          var grp = findStyleGroup(layers[i], gMn);
          var prop = grp ? grp.property(pMn) : null;
          if (grp && grp.enabled && prop) {
            prop.setValue(value);
            changed++;
          }
        } catch (_) {}
      }
      return "Updated " + changed + " layer" + (changed === 1 ? "" : "s");
    });
  }

  function deselectStyleProperties(layer) {
    try {
      var ls = layer.property("ADBE Layer Styles");
      if (!ls) return;
      for (var p = 1; p <= ls.numProperties; p++) {
        try { ls.property(p).selected = false; } catch (_) {}
      }
    } catch (_) {}
  }

  function styleExists(layer, gMn) {
    return !!findStyleGroup(layer, gMn);
  }

  function removeGroupDirect(layer, gMn) {
    var out = { found: false, removed: false };
    try {
      var grp = findStyleGroup(layer, gMn);
      if (!grp) return out;
      out.found = true;
      try { grp.remove(); } catch (_) {}
      out.removed = !styleExists(layer, gMn);
    } catch (_) {}
    return out;
  }

  function removeGroupWithDelete(c, layer, gMn) {
    try {
      var grp = findStyleGroup(layer, gMn);
      if (!grp) return false;
      for (var i = 1; i <= c.numLayers; i++) {
        try {
          c.layer(i).selected = false;
          deselectStyleProperties(c.layer(i));
        } catch (_) {}
      }
      layer.selected = true;
      try { grp.selected = true; } catch (_) {}
      var deleteId = 0;
      try { deleteId = app.findMenuCommandId("Delete"); } catch (_) {}
      if (!deleteId) deleteId = 20;
      app.executeCommand(deleteId);
      return !styleExists(layer, gMn);
    } catch (_) {}
    return false;
  }

  function removeStyle(gMn) {
    var c = comp();
    var layers = selectedLayers();
    if (!c) return "No active comp";
    if (!layers.length) return "Select at least one layer";
    var original = [];
    for (var i = 0; i < layers.length; i++) original.push(layers[i]);
    return undo("TNT: Delete Layer Style", function () {
      var removed = 0;
      var found = 0;
      for (var li = 0; li < original.length; li++) {
        var result = removeGroupDirect(original[li], gMn);
        if (result.found) found++;
        if (result.removed || (result.found && removeGroupWithDelete(c, original[li], gMn))) removed++;
      }
      for (var ri = 1; ri <= c.numLayers; ri++) {
        try {
          c.layer(ri).selected = false;
          deselectStyleProperties(c.layer(ri));
        } catch (_) {}
      }
      restoreLayerSelection(c, original);
      return removed ? "Deleted " + removed + " style group" + (removed === 1 ? "" : "s") : (found ? "Style found but AE would not delete it" : "Style not found");
    });
  }

  function commandIdForGroup(gMn) {
    var def = styleDefByGroup(gMn);
    return def ? def.cmd : 0;
  }

  function clearStyleWithMenu(c, layer, gMn) {
    try {
      var commandId = commandIdForGroup(gMn);
      if (!commandId) return false;
      var grp = findStyleGroup(layer, gMn);
      if (!grp || !grp.enabled) return false;
      restoreLayerSelection(c, [layer]);
      app.executeCommand(commandId);
      grp = findStyleGroup(layer, gMn);
      return !(grp && grp.enabled);
    } catch (_) {}
    return false;
  }

  function hideAllStyles() {
    var c = comp();
    var layers = selectedLayers();
    if (!c) return "No active comp";
    if (!layers.length) return "Select at least one layer";
    var original = [];
    for (var i = 0; i < layers.length; i++) original.push(layers[i]);
    return undo("TNT: Hide Layer Styles", function () {
      var hidden = 0;
      for (var li = 0; li < original.length; li++) {
        for (var s = 0; s < STYLE_MNS.length; s++) {
          try {
            var grp = findStyleGroup(original[li], STYLE_MNS[s]);
            if (!grp || !grp.enabled) continue;
            try { grp.enabled = false; } catch (_) {}
            grp = findStyleGroup(original[li], STYLE_MNS[s]);
            if (grp && grp.enabled) clearStyleWithMenu(c, original[li], STYLE_MNS[s]);
            grp = findStyleGroup(original[li], STYLE_MNS[s]);
            if (!grp || !grp.enabled) hidden++;
          } catch (_) {}
        }
      }
      restoreLayerSelection(c, original);
      return "Hidden " + hidden + " style group" + (hidden === 1 ? "" : "s");
    });
  }

  function removeAllStyles() {
    var c = comp();
    var layers = selectedLayers();
    if (!c) return "No active comp";
    if (!layers.length) return "Select at least one layer";
    var original = [];
    for (var i = 0; i < layers.length; i++) original.push(layers[i]);
    return undo("TNT: Remove All Layer Styles", function () {
      var removed = 0;
      for (var li = 0; li < original.length; li++) {
        for (var s = 0; s < STYLE_MNS.length; s++) {
          var result = removeGroupDirect(original[li], STYLE_MNS[s]);
          if (result.removed || (result.found && removeGroupWithDelete(c, original[li], STYLE_MNS[s]))) removed++;
        }
      }
      for (var ri = 1; ri <= c.numLayers; ri++) {
        try {
          c.layer(ri).selected = false;
          deselectStyleProperties(c.layer(ri));
        } catch (_) {}
      }
      restoreLayerSelection(c, original);
      return "Removed " + removed + " style group" + (removed === 1 ? "" : "s");
    });
  }

  function takeSnapshot() {
    var layers = selectedLayers();
    var out = [];
    for (var li = 0; li < layers.length; li++) {
      var row = { layer: layers[li], enabled: {}, props: {} };
      for (var si = 0; si < STYLE_DEFS.length; si++) {
        var def = STYLE_DEFS[si];
        var grp = findStyleGroup(layers[li], def.groupMn);
        row.enabled[def.groupMn] = !!(grp && grp.enabled);
        row.props[def.groupMn] = {};
        for (var pi = 0; pi < def.props.length; pi++) {
          var pd = def.props[pi];
          if (pd.type === "dropdown" || pd.type === "gradient") continue;
          try {
            var prop = grp ? grp.property(pd.mn) : null;
            row.props[def.groupMn][pd.mn] = prop ? prop.value : null;
          } catch (_) {
            row.props[def.groupMn][pd.mn] = null;
          }
        }
      }
      out.push(row);
    }
    snapshot = out;
    return "Snapshot captured";
  }

  function restoreSnapshot() {
    if (!snapshot || !snapshot.length) return "No snapshot yet";
    return undo("TNT: Restore Layer Styles", function () {
      var restored = 0;
      for (var li = 0; li < snapshot.length; li++) {
        var snap = snapshot[li];
        var layer = snap.layer;
        if (!layer) continue;
        for (var gMn in snap.enabled) {
          try {
            var grp = findStyleGroup(layer, gMn);
            if (grp) grp.enabled = snap.enabled[gMn];
          } catch (_) {}
        }
        for (var gMn2 in snap.props) {
          for (var pMn in snap.props[gMn2]) {
            try {
              var grp2 = findStyleGroup(layer, gMn2);
              var prop = grp2 ? grp2.property(pMn) : null;
              if (prop && snap.props[gMn2][pMn] !== null) prop.setValue(snap.props[gMn2][pMn]);
            } catch (_) {}
          }
        }
        restored++;
      }
      return "Restored " + restored + " layer" + (restored === 1 ? "" : "s");
    });
  }

  function pickColor(gMn, pMn) {
    var c = comp();
    var layers = selectedLayers();
    if (!c) return "No active comp";
    if (!layers.length) return "Select at least one layer";
    var targetProp = null;
    for (var i = 0; i < layers.length; i++) {
      try {
        var grp = findStyleGroup(layers[i], gMn);
        var p = grp && grp.enabled ? grp.property(pMn) : null;
        if (p) {
          targetProp = p;
          break;
        }
      } catch (_) {}
    }
    if (!targetProp) return "No active color property";

    var original = [];
    for (var j = 0; j < layers.length; j++) original.push(layers[j]);
    var nullLayer = null;
    var newColor = null;
    try {
      restoreLayerSelection(c, []);
      nullLayer = c.layers.addNull();
      var fx = nullLayer.property("ADBE Effect Parade").addProperty("ADBE Color Control");
      var cp = fx.property("ADBE Color Control-0001");
      try { cp.setValue(targetProp.value); } catch (_) {}
      nullLayer.selected = true;
      cp.selected = true;
      app.executeCommand(app.findMenuCommandId("Edit Value..."));
      newColor = cp.value;
    } catch (_) {}
    try { if (nullLayer) nullLayer.remove(); } catch (_) {}
    restoreLayerSelection(c, original);

    if (newColor && newColor.length >= 3) {
      return setStyleProp(gMn, pMn, newColor);
    }
    return "Color unchanged";
  }

  function editGradient() {
    var c = comp();
    var layers = selectedLayers();
    if (!c) return "No active comp";
    if (!layers.length) return "Select at least one layer";
    var original = [];
    for (var i = 0; i < layers.length; i++) original.push(layers[i]);
    var found = 0;
    restoreLayerSelection(c, []);
    for (var li = 0; li < original.length; li++) {
      try {
        var grp = findStyleGroup(original[li], "gradientFill/enabled");
        if (!grp || !grp.enabled) continue;
        original[li].selected = true;
        try { grp.property(3).selected = true; } catch (_) {}
        found++;
      } catch (_) {}
    }
    if (found) {
      try { app.executeCommand(app.findMenuCommandId("Edit Value...")); } catch (_) {}
    }
    restoreLayerSelection(c, original);
    return found ? "Gradient editor opened" : "No active Gradient Overlay found";
  }

  function selectedStyleDef() {
    if (!ui.styleList || ui.styleList.selection === null) return null;
    var item = ui.styleList.selection;
    return item && item.def ? item.def : null;
  }

  function clearGroup(group) {
    while (group.children.length) group.remove(group.children[0]);
  }

  function addAddButtons(parent, startIndex, endIndex) {
    clearGroup(parent);
    for (var i = startIndex; i < endIndex && i < STYLE_DEFS.length; i++) {
      (function (def) {
        var b = parent.add("button", undefined, def.label);
        b.preferredSize.width = 132;
        b.onClick = function () {
          setStatus(addStyle(def));
          refresh();
        };
      }(STYLE_DEFS[i]));
    }
  }

  function buildPropControls(def) {
    clearGroup(ui.propsGroup);
    if (!def) {
      ui.propsGroup.add("statictext", undefined, "Select an existing style to edit.");
      ui.win.layout.layout(true);
      return;
    }
    for (var i = 0; i < def.props.length; i++) {
      (function (pd) {
        var row = ui.propsGroup.add("group");
        row.orientation = "row";
        row.alignChildren = ["left", "center"];
        row.add("statictext", undefined, pd.label).preferredSize.width = 92;
        var value = firstPropValue(def.groupMn, pd.mn);

        if (pd.type === "slider" || pd.type === "angle") {
          var min = Number(pd.min);
          var max = Number(pd.max);
          var initial = value === null || value === undefined ? min : Number(value);
          var slider = row.add("slider", undefined, initial, min, max);
          slider.preferredSize.width = 150;
          var edit = row.add("edittext", undefined, String(Math.round(initial * 100) / 100));
          edit.characters = 6;
          slider.onChanging = function () {
            edit.text = String(Math.round(slider.value * 100) / 100);
          };
          slider.onChange = function () {
            edit.text = String(Math.round(slider.value * 100) / 100);
            setStatus(setStyleProp(def.groupMn, pd.mn, Number(slider.value)));
          };
          edit.onChange = function () {
            var v = Number(edit.text);
            if (isNaN(v)) v = min;
            if (v < min) v = min;
            if (v > max) v = max;
            slider.value = v;
            edit.text = String(Math.round(v * 100) / 100);
            setStatus(setStyleProp(def.groupMn, pd.mn, v));
          };
        } else if (pd.type === "bool") {
          var cb = row.add("checkbox", undefined, "");
          cb.value = !!value;
          cb.onClick = function () {
            setStatus(setStyleProp(def.groupMn, pd.mn, !!cb.value));
          };
        } else if (pd.type === "dropdown") {
          var dd = row.add("dropdownlist", undefined, pd.options);
          var selected = 0;
          for (var oi = 0; oi < pd.values.length; oi++) {
            if (Number(pd.values[oi]) === Number(value)) selected = oi;
          }
          dd.selection = selected;
          dd.preferredSize.width = 145;
          dd.onChange = function () {
            if (dd.selection) setStatus(setStyleProp(def.groupMn, pd.mn, Number(pd.values[dd.selection.index])));
          };
        } else if (pd.type === "color") {
          var pick = row.add("button", undefined, "Pick...");
          pick.preferredSize.width = 90;
          pick.onClick = function () {
            setStatus(pickColor(def.groupMn, pd.mn));
            refresh();
          };
        } else if (pd.type === "gradient") {
          var grad = row.add("button", undefined, "Edit...");
          grad.preferredSize.width = 90;
          grad.onClick = function () {
            setStatus(editGradient());
            refresh();
          };
        }
      }(def.props[i]));
    }
    ui.win.layout.layout(true);
  }

  function refresh() {
    var layers = selectedLayers();
    ui.layerText.text = layers.length ? layers.length + " selected layer" + (layers.length === 1 ? "" : "s") : "No selected layers";

    var previousGroup = null;
    if (ui.styleList && ui.styleList.selection && ui.styleList.selection.def) {
      previousGroup = ui.styleList.selection.def.groupMn;
    }
    ui.styleList.removeAll();
    var groups = activeStyleGroups();
    for (var i = 0; i < groups.length; i++) {
      var label = groups[i].def.label + "  " + groups[i].enabled + "/" + groups[i].have + " on";
      var item = ui.styleList.add("item", label);
      item.def = groups[i].def;
      if (previousGroup && groups[i].def.groupMn === previousGroup) ui.styleList.selection = item;
    }
    if (!ui.styleList.selection && ui.styleList.items.length) ui.styleList.selection = 0;
    buildPropControls(selectedStyleDef());
  }

  function buildUI(thisObj) {
    var win = thisObj instanceof Panel ? thisObj : new Window("palette", "TNT Layer Styles Panel", undefined, { resizeable: true });
    ui.win = win;
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 8;
    win.margins = 10;

    var header = win.add("group");
    header.orientation = "row";
    header.alignChildren = ["fill", "center"];
    ui.layerText = header.add("statictext", undefined, "No selected layers");
    ui.layerText.characters = 24;
    var refreshBtn = header.add("button", undefined, "Refresh");
    refreshBtn.onClick = refresh;

    var addPanel = win.add("panel", undefined, "Add Style");
    addPanel.orientation = "column";
    addPanel.alignChildren = ["fill", "top"];
    var addGridA = addPanel.add("group");
    addGridA.orientation = "row";
    var addGridB = addPanel.add("group");
    addGridB.orientation = "row";
    addAddButtons(addGridA, 0, 5);
    addAddButtons(addGridB, 5, STYLE_DEFS.length);

    var editPanel = win.add("panel", undefined, "Edit Existing Style");
    editPanel.orientation = "column";
    editPanel.alignChildren = ["fill", "top"];
    ui.styleList = editPanel.add("dropdownlist", undefined, []);
    ui.styleList.preferredSize.width = 300;
    ui.styleList.onChange = function () { buildPropControls(selectedStyleDef()); };

    var styleBtns = editPanel.add("group");
    styleBtns.orientation = "row";
    var enableBtn = styleBtns.add("button", undefined, "On");
    var disableBtn = styleBtns.add("button", undefined, "Off");
    var deleteBtn = styleBtns.add("button", undefined, "Delete");
    enableBtn.onClick = function () {
      var def = selectedStyleDef();
      if (!def) return;
      setStatus(setStyleEnabled(def.groupMn, true));
      refresh();
    };
    disableBtn.onClick = function () {
      var def = selectedStyleDef();
      if (!def) return;
      setStatus(setStyleEnabled(def.groupMn, false));
      refresh();
    };
    deleteBtn.onClick = function () {
      var def = selectedStyleDef();
      if (!def) return;
      if (confirm("Delete " + def.label + " from selected layers?")) {
        setStatus(removeStyle(def.groupMn));
        refresh();
      }
    };

    ui.propsGroup = editPanel.add("group");
    ui.propsGroup.orientation = "column";
    ui.propsGroup.alignChildren = ["fill", "top"];

    var bulk = win.add("group");
    bulk.orientation = "row";
    var snapshotBtn = bulk.add("button", undefined, "Snapshot");
    var restoreBtn = bulk.add("button", undefined, "Restore");
    var hideBtn = bulk.add("button", undefined, "Hide All");
    var removeBtn = bulk.add("button", undefined, "Remove All");
    snapshotBtn.onClick = function () { setStatus(takeSnapshot()); };
    restoreBtn.onClick = function () {
      setStatus(restoreSnapshot());
      refresh();
    };
    hideBtn.onClick = function () {
      setStatus(hideAllStyles());
      refresh();
    };
    removeBtn.onClick = function () {
      if (confirm("Remove all layer styles from selected layers?")) {
        setStatus(removeAllStyles());
        refresh();
      }
    };

    ui.status = win.add("statictext", undefined, "");
    ui.status.characters = 48;

    win.onResizing = win.onResize = function () { this.layout.resize(); };
    refresh();
    return win;
  }

  var panel = buildUI(thisObj);
  if (panel instanceof Window) {
    panel.center();
    panel.show();
  }
}(this));
