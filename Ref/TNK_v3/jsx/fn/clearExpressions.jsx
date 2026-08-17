function clearExpressions() {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Clear Expressions", function() {
    function clear(prop) {
      if (prop.canSetExpression) try { prop.expression = ""; } catch(e) {}
      for (var i = 1; i <= prop.numProperties; i++) { try { clear(prop.property(i)); } catch(e) {} }
    }
    for (var i = 0; i < layers.length; i++) {
      for (var j = 1; j <= layers[i].numProperties; j++) { try { clear(layers[i].property(j)); } catch(e) {} }
    }
    return "Expressions cleared";
  });
}
