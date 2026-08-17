function fullPurge(doFx, doKeys, doExpr, doLabels) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var parts = [];
  if (doFx)     parts.push("effects");
  if (doKeys)   parts.push("keyframes");
  if (doExpr)   parts.push("expressions");
  if (doLabels) parts.push("labels");
  return _undo("TNK: Full Purge", function() {
    function clearKeys(prop) {
      if (!prop) return;
      if (prop.numKeys) { try { while (prop.numKeys > 0) prop.removeKey(1); } catch(e) {} }
      if (prop.numProperties) { for (var i = 1; i <= prop.numProperties; i++) { try { clearKeys(prop.property(i)); } catch(e) {} } }
    }
    function clearExpr(prop) {
      if (prop.canSetExpression) try { prop.expression = ""; } catch(e) {}
      if (prop.numProperties) { for (var i = 1; i <= prop.numProperties; i++) { try { clearExpr(prop.property(i)); } catch(e) {} } }
    }
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (doFx)     { var fx = layer.property("Effects"); while (fx && fx.numProperties > 0) { try { fx.property(1).remove(); } catch(e) { break; } } }
      if (doKeys)   clearKeys(layer);
      if (doExpr)   clearExpr(layer);
      if (doLabels) layer.label = 0;
    }
    return "Purged: " + (parts.join(", ") || "nothing");
  });
}
