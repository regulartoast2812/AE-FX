function applySizeRig() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";

  var SIZE_MATCHNAMES = {
    "ADBE Vector Rect Size":    true,
    "ADBE Vector Ellipse Size": true
  };

  // ── selection helpers ─────────────────────────────────────────────────────
  function findSelectedTwoD(layer) {
    var sel = layer.selectedProperties;
    for (var s = 0; s < sel.length; s++) {
      var p = sel[s];
      if (p.propertyType !== PropertyType.PROPERTY) continue;
      var t = p.propertyValueType;
      if (t === PropertyValueType.TwoD || t === PropertyValueType.TwoD_SPATIAL) return p;
    }
    return null;
  }

  // Walk up from a selected property looking for an enclosing ADBE Vector Group
  // (i.e. a single shape like "Rectangle 1"). Returns the group or null.
  function findSelectedShapeGroup(layer) {
    var sel = layer.selectedProperties;
    for (var s = 0; s < sel.length; s++) {
      var p = sel[s];
      while (p && p.parentProperty) {
        if (p.matchName === "ADBE Vector Group") return p;
        p = p.parentProperty;
      }
    }
    return null;
  }

  // Find the first Size property within a specific group.
  function findSizeInGroup(group, depth) {
    if (depth > 20) return null;
    var n; try { n = group.numProperties; } catch(e) { return null; }
    for (var i = 1; i <= n; i++) {
      try {
        var p = group.property(i);
        if (SIZE_MATCHNAMES[p.matchName]) return p;
        if (p.propertyType === PropertyType.PROPERTY &&
            p.propertyValueType === PropertyValueType.TwoD &&
            p.name === "Size") {
          return p;
        }
        if (p.numProperties && p.numProperties > 0) {
          var found = findSizeInGroup(p, depth + 1);
          if (found) return found;
        }
      } catch(e) {}
    }
    return null;
  }

  // Collect every Size property on the layer along with its enclosing group name.
  function findAllSizes(layer) {
    var out = [];
    var contents;
    try { contents = layer.property("ADBE Root Vectors Group"); } catch(e) {}
    if (!contents) { try { contents = layer.property("Contents"); } catch(e2) {} }
    if (!contents) return out;

    function walk(group, enclosingGroupName) {
      var n; try { n = group.numProperties; } catch(e) { return; }
      for (var i = 1; i <= n; i++) {
        try {
          var p = group.property(i);
          var nextEnclosing = (p.matchName === "ADBE Vector Group") ? p.name : enclosingGroupName;
          if (SIZE_MATCHNAMES[p.matchName] ||
              (p.propertyType === PropertyType.PROPERTY &&
               p.propertyValueType === PropertyValueType.TwoD &&
               p.name === "Size")) {
            out.push({ size: p, label: enclosingGroupName || p.name });
            continue;
          }
          if (p.numProperties && p.numProperties > 0) {
            walk(p, nextEnclosing);
          }
        } catch(e) {}
      }
    }
    walk(contents, "");
    return out;
  }

  // ── dialog to pick a shape ─────────────────────────────────────────────────
  function pickShapeDialog(layerName, entries) {
    var dlg = new Window("dialog", "TNK Size Rig — Pick Shape");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.margins = 14;
    dlg.add("statictext", undefined,
            'Layer "' + layerName + '" has multiple shapes — pick one to rig:');
    var list = dlg.add("listbox", undefined, [], { multiselect: false });
    list.preferredSize = [320, 160];
    for (var i = 0; i < entries.length; i++) {
      var sz = entries[i].size.value;
      list.add("item",
        entries[i].label + "   [" + sz[0].toFixed(1) + " × " + sz[1].toFixed(1) + "]");
    }
    list.selection = 0;
    var btns = dlg.add("group"); btns.alignment = "right";
    var ok = btns.add("button", undefined, "Rig", { name: "ok" });
    btns.add("button", undefined, "Cancel", { name: "cancel" });
    var picked = null;
    ok.onClick = function () {
      picked = list.selection ? list.selection.index : null;
      dlg.close();
    };
    dlg.show();
    return picked != null ? entries[picked].size : null;
  }

  // ── chain helpers (avoid stale refs after adding effects) ──────────────────
  function propChain(prop) {
    var chain = [], p = prop;
    while (p && p.parentProperty) {
      chain.unshift(p.matchName);
      p = p.parentProperty;
    }
    return chain;
  }

  function resolveChain(layer, chain) {
    var p = layer;
    for (var i = 0; i < chain.length; i++) p = p.property(chain[i]);
    return p;
  }

  // ── rigger ────────────────────────────────────────────────────────────────
  function rigOne(layer, sizeProp, sliderPrefix) {
    if (!sizeProp.canSetExpression) {
      throw new Error('"' + sizeProp.name + '" does not accept expressions');
    }

    var curSize = sizeProp.value;
    var chain   = propChain(sizeProp);
    var propName = sizeProp.name;

    var fx = layer.property("ADBE Effect Parade");

    var wFx = fx.addProperty("ADBE Slider Control");
    wFx.name = sliderPrefix ? sliderPrefix + " Width" : "Width";
    var wIdx = wFx.propertyIndex;

    var hFx = fx.addProperty("ADBE Slider Control");
    hFx.name = sliderPrefix ? sliderPrefix + " Height" : "Height";
    var hIdx = hFx.propertyIndex;

    fx.property(wIdx).property("ADBE Slider Control-0001").setValue(curSize[0]);
    fx.property(hIdx).property("ADBE Slider Control-0001").setValue(curSize[1]);

    var wName = fx.property(wIdx).name;
    var hName = fx.property(hIdx).name;
    var expr = '[effect("' + wName + '")("Slider"), effect("' + hName + '")("Slider")]';

    var liveProp = resolveChain(layer, chain);
    liveProp.expression = expr;
    try { liveProp.expressionEnabled = true; } catch(e) {}

    if (liveProp.expressionError && liveProp.expressionError.length) {
      throw new Error("expression rejected: " + liveProp.expressionError);
    }
    return propName;
  }

  // ── pick target(s) for one layer ──────────────────────────────────────────
  function pickTargetForLayer(layer) {
    // 1. Direct Size (or any TwoD) selected → use it
    var direct = findSelectedTwoD(layer);
    if (direct) return { size: direct, prefix: "" };

    // 2. A shape group is selected (user clicked "Rectangle 2" or any prop
    //    inside it) → rig the Size inside that group
    var selGroup = findSelectedShapeGroup(layer);
    if (selGroup) {
      var sz = findSizeInGroup(selGroup, 0);
      if (sz) return { size: sz, prefix: selGroup.name };
    }

    // 3. Auto: find all Size props on the layer
    var all = findAllSizes(layer);
    if (all.length === 0) return null;
    if (all.length === 1) {
      return { size: all[0].size, prefix: all[0].label || "" };
    }

    // 4. Multiple → ask
    var picked = pickShapeDialog(layer.name, all);
    if (!picked) return null;
    // find label for prefix
    for (var i = 0; i < all.length; i++) {
      if (all[i].size === picked) return { size: picked, prefix: all[i].label };
    }
    return { size: picked, prefix: "" };
  }

  // ── main loop ─────────────────────────────────────────────────────────────
  return _undo("TNK: Size Rig", function() {
    var rigged = 0, lastName = "", lastErr = "", skipped = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var target = pickTargetForLayer(layer);
      if (!target) { skipped++; continue; }
      try {
        lastName = rigOne(layer, target.size, target.prefix);
        rigged++;
      } catch(e) {
        lastErr = e.toString();
      }
    }
    if (!rigged) {
      if (lastErr) return "Rig failed: " + lastErr;
      return "No Size property found on " + skipped + " layer" + (skipped !== 1 ? "s" : "");
    }
    return rigged === 1
      ? 'Size rig → "' + lastName + '"'
      : "Size rig applied to " + rigged + " layers";
  });
}
