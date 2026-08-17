function deleteAllExpressions() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Expressions", function() {
    function clearExpr(prop) {
      if (prop.canSetExpression) try { prop.expression = ""; } catch(e) {}
      for (var i = 1; i <= prop.numProperties; i++) { try { clearExpr(prop.property(i)); } catch(e) {} }
    }
    for (var i = 0; i < layers.length; i++) {
      for (var j = 1; j <= layers[i].numProperties; j++) { try { clearExpr(layers[i].property(j)); } catch(e) {} }
    }
    return "Expressions deleted";
  });
}
