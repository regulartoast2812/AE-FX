// ── EFFECTS & EXPRESSIONS ─────────────────────────────────────────────────────

function toggleEffects() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Effects", function() {
    var layers = comp.selectedLayers;
    for (var j = 0; j < layers.length; j++) {
      var layer = layers[j];
      for (var i = 1; i <= layer.effect.numProperties; i++) {
        layer.effect(i).enabled = !layer.effect(i).enabled;
      }
    }
    return "Effects toggled";
  });
}

function copyEffects() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Copy Effects", function() {
    var layer = layers[0];
    for (var i = 1; i <= layer.Effects.numProperties; i++) layer.Effects.property(i).selected = true;
    app.executeCommand(app.findMenuCommandId("Copy"));
    return "Effects copied";
  });
}

function deleteAllEffects() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Effects", function() {
    var layers = comp.selectedLayers;
    for (var i = 0; i < layers.length; i++) {
      while (layers[i].effect.numProperties > 0) layers[i].effect(1).remove();
    }
    return "Effects deleted";
  });
}

function deleteAllExpressions() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Expressions", function() {
    function clearExpr(prop) {
      if (!prop) return;
      if (prop.propertyType === PropertyType.INDEXED_GROUP ||
          prop.propertyType === PropertyType.NAMED_GROUP) {
        for (var p = 1; p <= prop.numProperties; p++) {
          try { clearExpr(prop.property(p)); } catch(e) {}
        }
        return;
      }
      if (prop.canSetExpression && prop.expressionEnabled) {
        try { prop.expression = ""; } catch(e) {}
      }
    }
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      for (var j = 1; j <= layer.numProperties; j++) {
        try { clearExpr(layer.property(j)); } catch(e) {}
      }
    }
    return "Expressions deleted";
  });
}

// ── TEXT TOOLS ────────────────────────────────────────────────────────────────


// ── TEXT ANIMATION UP (key Y) ─────────────────────────────────────────────────
// Adds proper AE text animators (position + opacity) with range selectors.
