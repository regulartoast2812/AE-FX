function removeAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var STYLE_MNS = [
    "dropShadow/enabled","innerShadow/enabled","outerGlow/enabled","innerGlow/enabled",
    "bevelEmboss/enabled","chromeFX/enabled","solidFill/enabled","gradientFill/enabled",
    "frameFX/enabled","patternFill/enabled"
  ];
  return _undo("TNK: Remove All Layer Styles", function() {
    var count = 0;
    for (var i = 0; i < sel.length; i++) {
      try {
        var ls = sel[i].property("ADBE Layer Styles"); if (!ls) continue;
        for (var si = STYLE_MNS.length - 1; si >= 0; si--) {
          try { var grp = ls.property(STYLE_MNS[si]); if (grp) grp.remove(); }
          catch(e) { try { var grp2 = ls.property(STYLE_MNS[si]); if (grp2) grp2.enabled = false; } catch(e2) {} }
        }
        count++;
      } catch(e) {}
    }
    return "Styles removed on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}
