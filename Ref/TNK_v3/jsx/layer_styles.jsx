// ── GET STYLE STATUS JSON (selected layers only) ──────────────────────────
// Returns { gMn: { have: N, missing: N, total: N } } for each style group
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

// ── REMOVE ALL LAYER STYLES ───────────────────────────────────────────────
function removeAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var STYLE_MNS = [
    'dropShadow/enabled','innerShadow/enabled','outerGlow/enabled','innerGlow/enabled',
    'bevelEmboss/enabled','chromeFX/enabled','solidFill/enabled','gradientFill/enabled',
    'frameFX/enabled','patternFill/enabled'
  ];
  var count = 0;
  return _undo("TNK: Remove All Layer Styles", function() {
    for (var i = 0; i < sel.length; i++) {
      try {
        var ls = sel[i].property("ADBE Layer Styles");
        if (!ls) continue;
        for (var si = STYLE_MNS.length - 1; si >= 0; si--) {
          try {
            var grp = ls.property(STYLE_MNS[si]);
            if (grp) grp.remove();
          } catch(e) {
            try { var grp2 = ls.property(STYLE_MNS[si]); if (grp2) grp2.enabled = false; } catch(e2) {}
          }
        }
        count++;
      } catch(e) {}
    }
    return "Styles removed on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}

function hideAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var count = 0;
  return _undo("TNK: Hide Layer Styles", function() {
    for (var i = 0; i < sel.length; i++) {
      try {
        var ls = sel[i].property("ADBE Layer Styles");
        if (ls) { ls.enabled = false; count++; }
      } catch(e) {}
    }
    return "Styles hidden on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}

function enableAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var count = 0;
  return _undo("TNK: Enable Layer Styles", function() {
    for (var i = 0; i < sel.length; i++) {
      try {
        var ls = sel[i].property("ADBE Layer Styles");
        if (ls) { ls.enabled = true; count++; }
      } catch(e) {}
    }
    return "Styles enabled on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}


// ── TOGGLE ALL LAYER STYLES ───────────────────────────────────────────────
function toggleAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Toggle Layer Styles", function() {
    var anyEnabled = false;
    for (var i = 0; i < sel.length; i++) {
      try { if (sel[i].property("ADBE Layer Styles").enabled) { anyEnabled = true; break; } } catch(e) {}
    }
    for (var i = 0; i < sel.length; i++) {
      try { sel[i].property("ADBE Layer Styles").enabled = !anyEnabled; } catch(e) {}
    }
    return anyEnabled ? "Styles disabled" : "Styles enabled";
  });
}

// Returns "true" or "false" — whether ANY selected layer has styles enabled
function getLayerStylesEnabledState() {
  var comp = getComp(); if (!comp) return "false";
  var sel = comp.selectedLayers; if (!sel.length) return "false";
  for (var i = 0; i < sel.length; i++) {
    try { if (sel[i].property("ADBE Layer Styles").enabled) return "true"; } catch(e) {}
  }
  return "false";
}

// ── APPLY STROKE STYLE ───────────────────────────────────────────────────
// Sets all shape strokes on selected shape layers:
//   - Fill rendered over stroke (paint order: stroke first, fill over)
//   - Line join: Round
function applyStrokeStyle() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var count = 0;
  return _undo("TNK: Stroke Style", function() {
    for (var li = 0; li < sel.length; li++) {
      var layer = sel[li];
      if (!(layer instanceof ShapeLayer)) continue;
      count += _applyStrokeStyleToContents(layer.property("Contents"));
    }
      return count ? "Stroke style applied to " + count + " stroke" + (count !== 1 ? "s" : "") : "No strokes found";
});
  if (!count) return "No shape strokes found on selected layers";
  return "Stroke style applied to " + count + " stroke" + (count !== 1 ? "s" : "");
}

function _applyStrokeStyleToContents(contents) {
  var count = 0;
  if (!contents) return 0;
  for (var i = 1; i <= contents.numProperties; i++) {
    try {
      var item = contents.property(i);
      var mn = item.matchName;
      if (mn === "ADBE Vector Shape - Group") {
        // Recurse into groups
        count += _applyStrokeStyleToContents(item.property("Contents"));
      } else if (mn === "ADBE Vector Graphic - Stroke") {
        // Line Join: 2 = Round
        try { item.property("ADBE Vector Stroke Line Join").setValue(2); } catch(e) {}
        count++;
      } else if (mn === "ADBE Vector Group") {
        // Recurse and also set group paint order if applicable
        count += _applyStrokeStyleToContents(item.property("Contents"));
        // Paint order: try to find and set
        try {
          var po = item.property("ADBE Vector Blend Order");
          if (po) po.setValue(2); // Fill over stroke
        } catch(e) {}
      }
    } catch(e) {}
  }
  // Set group-level paint order at this content level too
  try {
    for (var j = 1; j <= contents.numProperties; j++) {
      var prop = contents.property(j);
      if (prop && prop.matchName === "ADBE Vector Blend Order") {
        prop.setValue(2); // Fill over stroke
      }
    }
  } catch(e) {}
  return count;
}

function setTextContent(newText) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var count = 0;
  return _undo("TNK: Set Text", function() {
    for (var i = 0; i < layers.length; i++) {
      if (!(layers[i] instanceof TextLayer)) continue;
      var prop = layers[i].property("Source Text");
      var doc = prop.value;
      doc.text = newText;
      prop.setValue(doc);
      count++;
    }
    return count + " text layer" + (count !== 1 ? "s" : "") + " updated";
  });
}

// ── FIND / REPLACE TEXT ───────────────────────────────────────────────────
function findReplaceText(findStr, replaceStr, caseSensitive) {
  var comp = getComp(); if (!comp) return "No comp";
  var count = 0;
  return _undo("TNK: Find/Replace Text", function() {
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      if (!(layer instanceof TextLayer)) continue;
      var prop = layer.property("Source Text");
      var doc = prop.value;
      var src = doc.text;
      var replaced;
      if (caseSensitive) {
        if (src.indexOf(findStr) === -1) continue;
        replaced = src.split(findStr).join(replaceStr);
      } else {
        var re = new RegExp(findStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        if (!re.test(src)) continue;
        re.lastIndex = 0;
        replaced = src.replace(re, replaceStr);
      }
      doc.text = replaced;
      prop.setValue(doc);
      count++;
    }
    return "Replaced in " + count + " layer" + (count !== 1 ? "s" : "");
  });
}

// ── SHAPE TO MASK — converts first shape path in selected shape layers to a mask ─
function shapeToMask() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var count = 0;
  return _undo("TNK: Shape to Mask", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      // Find first shape path in Contents
      var contents = layer.property("Contents");
      var pathShape = null;
      outer: for (var g = 1; g <= contents.numProperties; g++) {
        try {
          var grp = contents.property(g);
          var gc;
          try { gc = grp.property("Contents"); } catch(e) { gc = grp; }
          for (var s = 1; s <= gc.numProperties; s++) {
            try {
              var sh = gc.property(s);
              if (sh.matchName === "ADBE Vector Shape - Group" || sh.matchName === "ADBE Vector Shape") {
                pathShape = sh.property("ADBE Vector Shape");
                break outer;
              }
              if (sh.matchName === "ADBE Vector Shape - Rect") {
                // Can't directly convert parametric to mask — skip, needs to be converted first
                return "Convert Rectangle to Bezier first (Layer > Create Shapes from Vector Layer or right-click path > Convert to Bezier)";
              }
            } catch(e2) {}
          }
        } catch(e) {}
      }
      if (!pathShape) continue;
      // Add mask using the shape's path value
      var masks = layer.property("Masks");
      var newMask = masks.addProperty("Mask");
      newMask.property("Mask Path").setValue(pathShape.value);
      count++;
    }
  });
  if (count === 0) return "No convertible shape paths found (Bezier paths only)";
  return "Mask created on " + count + " layer" + (count !== 1 ? "s" : "");
}

// ── WIP STUBS ─────────────────────────────────────────────────────────────
function shapeToPath()       { return "[WIP] Convert shape to path — needs implementation"; }
function splitText()         { return "[WIP] Split text — needs implementation"; }
function applyTypewriterRig(){ return "[WIP] Typewriter rig — needs implementation"; }
function applyCounterRig()   { return "[WIP] Counter rig — needs implementation"; }

