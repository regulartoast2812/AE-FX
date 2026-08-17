(function () {
    app.beginUndoGroup("Center Anchor Point");

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) { alert("Select at least one layer."); return; }

    for (var i = 0; i < selectedLayers.length; i++) {
        centerAnchorPoint(selectedLayers[i]);
    }

    app.endUndoGroup();

    // -------------------------------------------------------
    function centerAnchorPoint(layer) {
        var comp    = layer.containingComp;
        var curTime = comp.time;

        var oldAnchor = layer.anchorPoint.value;
        var newAnchor;

        // ---- Check for masks first -------------------------
        var maskCenter = getMaskCenter(layer, curTime);

        if (maskCenter) {
            newAnchor = [maskCenter[0], maskCenter[1]];
        } else {
            // No masks  use layer bounding box center
            var rect  = layer.sourceRectAtTime(curTime, false);
            newAnchor = [rect.left + rect.width / 2, rect.top + rect.height / 2];
        }

        // ---- Delta in world space --------------------------
        var dx = (newAnchor[0] - oldAnchor[0]) * (layer.scale.value[0] / 100);
        var dy = (newAnchor[1] - oldAnchor[1]) * (layer.scale.value[1] / 100);

        // ---- Set new anchor --------------------------------
        layer.anchorPoint.setValue([newAnchor[0], newAnchor[1]]);

        // ---- Adjust position (keyframes or static) ---------
        var posProp = layer.property("Position");
        if (posProp.numKeys > 0) {
            for (var k = 1; k <= posProp.numKeys; k++) {
                var kv = posProp.keyValue(k);
                posProp.setValueAtKey(k, [kv[0] + dx, kv[1] + dy, kv[2] || 0]);
            }
        } else {
            var pv = posProp.value;
            posProp.setValue([pv[0] + dx, pv[1] + dy, pv[2] || 0]);
        }
    }

    // -------------------------------------------------------
    //  Get area-weighted center of all visible/additive masks
    //  Larger masks pull the center more than small ones
    // -------------------------------------------------------
    function getMaskCenter(layer, curTime) {
        var masks = layer.property("Masks");
        if (!masks || masks.numProperties === 0) return null;

        var totalWeightedX = 0;
        var totalWeightedY = 0;
        var totalWeight    = 0;

        for (var mi = 1; mi <= masks.numProperties; mi++) {
            var mask = masks.property(mi);

            // Skip disabled masks
            var enabledProp = mask.property("ADBE Mask Atom");
            if (enabledProp && enabledProp.value === false) continue;

            // Skip modes that remove area: None=1, Subtract=3, Difference=7
            var modeProp = mask.property("ADBE Mask Mode");
            if (modeProp) {
                var mode = modeProp.value;
                if (mode === 1 || mode === 3 || mode === 7) continue;
            }

            var pathProp = mask.property("ADBE Mask Shape");
            if (!pathProp) continue;

            var shape = pathProp.valueAtTime(curTime, false);
            var verts = shape.vertices;
            if (!verts || verts.length === 0) continue;

            // Bounding box of this mask
            var minX = verts[0][0], maxX = verts[0][0];
            var minY = verts[0][1], maxY = verts[0][1];

            for (var vi = 1; vi < verts.length; vi++) {
                if (verts[vi][0] < minX) minX = verts[vi][0];
                if (verts[vi][0] > maxX) maxX = verts[vi][0];
                if (verts[vi][1] < minY) minY = verts[vi][1];
                if (verts[vi][1] > maxY) maxY = verts[vi][1];
            }

            var cx     = (minX + maxX) / 2;
            var cy     = (minY + maxY) / 2;
            var area   = (maxX - minX) * (maxY - minY);
            var weight = (area > 0) ? area : 1;

            totalWeightedX += cx * weight;
            totalWeightedY += cy * weight;
            totalWeight    += weight;
        }

        if (totalWeight === 0) return null;

        return [totalWeightedX / totalWeight, totalWeightedY / totalWeight];
    }

})();
