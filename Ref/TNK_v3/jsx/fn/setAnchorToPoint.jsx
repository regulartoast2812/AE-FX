function _getMaskBBox(layer, curTime) {
  var masks = layer.property("Masks");
  if (!masks || masks.numProperties === 0) return null;
  var minX = null, maxX = null, minY = null, maxY = null, found = false;
  for (var mi = 1; mi <= masks.numProperties; mi++) {
    var mask = masks.property(mi);
    try {
      var enabledProp = mask.property("ADBE Mask Atom");
      if (enabledProp && enabledProp.value === false) continue;
      var modeProp = mask.property("ADBE Mask Mode");
      if (modeProp) {
        var mode = modeProp.value;
        if (mode === 1 || mode === 3 || mode === 7) continue; // None, Subtract, Difference
      }
      var pathProp = mask.property("ADBE Mask Shape");
      if (!pathProp) continue;
      var shape = pathProp.valueAtTime(curTime, false);
      var verts = shape.vertices;
      if (!verts || verts.length === 0) continue;
      for (var vi = 0; vi < verts.length; vi++) {
        var vx = verts[vi][0], vy = verts[vi][1];
        if (minX === null || vx < minX) minX = vx;
        if (maxX === null || vx > maxX) maxX = vx;
        if (minY === null || vy < minY) minY = vy;
        if (maxY === null || vy > maxY) maxY = vy;
      }
      found = true;
    } catch(e) {}
  }
  if (!found) return null;
  return { left: minX, top: minY, right: maxX, bottom: maxY };
}
function _setAnchorOnLayer(layer, point, useMasks) {
  var comp    = layer.containingComp;
  var curTime = comp.time;

  // Get bounding box — mask-aware or full layer
  var bbox = null;
  if (useMasks) bbox = _getMaskBBox(layer, curTime);
  if (!bbox) {
    var rect = layer.sourceRectAtTime(curTime, false);
    bbox = {
      left:   rect.left,
      top:    rect.top,
      right:  rect.left + rect.width,
      bottom: rect.top  + rect.height
    };
  }

  var L = bbox.left,  R = bbox.right;
  var T = bbox.top,   B = bbox.bottom;
  var CX = (L + R) / 2, CY = (T + B) / 2;

  var pointMap = {
    "TL": [L,  T],  "TC": [CX, T],  "TR": [R,  T],
    "ML": [L,  CY], "C":  [CX, CY], "MR": [R,  CY],
    "BL": [L,  B],  "BC": [CX, B],  "BR": [R,  B]
  };

  var newAnchor = pointMap[point];
  if (!newAnchor) return;

  var oldAnchor = layer.anchorPoint.value;

  // Delta in layer-local space
  var dLx = newAnchor[0] - oldAnchor[0];
  var dLy = newAnchor[1] - oldAnchor[1];

  // Convert layer-local delta to comp space.
  // Position is stored in PARENT space (comp space if no parent).
  // We must rotate+scale the delta through the transform chain up to the parent.
  //
  // For 2D layers: apply scale then rotation.
  // For 3D layers: orientation+rotationX/Y/Z stack applies, but we use the
  // same rotate-by-Z approach plus scale as a good approximation for the common
  // case. Full 3D orientation math would require a full matrix — for 3D layers
  // we fall back to toWorld/fromWorld via a null-helper trick instead.
  //
  // For parented layers: the parent transform is already baked into Position's
  // coordinate space, so we only need THIS layer's local rotation+scale.

  var is3D = layer.threeDLayer;
  var compDx, compDy, compDz;

  if (!is3D) {
    // Sample scale and rotation at curTime (handles keyframed transforms)
    var sx = layer.scale.valueAtTime(curTime, false)[0] / 100;
    var sy = layer.scale.valueAtTime(curTime, false)[1] / 100;
    var rotDeg = layer.rotation.valueAtTime(curTime, false);
    var rad    = rotDeg * Math.PI / 180;
    var cosR   = Math.cos(rad);
    var sinR   = Math.sin(rad);

    // Scale the layer-local delta, then rotate into parent/comp space
    compDx = (dLx * sx) * cosR - (dLy * sy) * sinR;
    compDy = (dLx * sx) * sinR + (dLy * sy) * cosR;
    compDz = 0;
  } else {
    // 3D: use the toWorld approach — convert a point offset by the delta
    // relative to the current world-space anchor position.
    // toWorld maps layer-local to world (comp) space.
    // oldAnchor in world space = layer.toWorld(oldAnchor)
    // newAnchor in world space = layer.toWorld(newAnchor)
    // delta = newWorld - oldWorld
    try {
      var oldWorld = layer.toWorld([oldAnchor[0], oldAnchor[1], oldAnchor[2] || 0]);
      var newWorld = layer.toWorld([newAnchor[0], newAnchor[1], 0]);
      compDx = newWorld[0] - oldWorld[0];
      compDy = newWorld[1] - oldWorld[1];
      compDz = newWorld[2] - oldWorld[2];
    } catch(e) {
      // fallback: scale-only
      var sx3 = layer.scale.valueAtTime(curTime, false)[0] / 100;
      var sy3 = layer.scale.valueAtTime(curTime, false)[1] / 100;
      compDx = dLx * sx3;
      compDy = dLy * sy3;
      compDz = 0;
    }
  }

  // Set the new anchor point first
  layer.anchorPoint.setValue([newAnchor[0], newAnchor[1]]);

  // Now compensate position to keep the layer visually in place.
  // Handle separated dimensions (Position X / Position Y).
  var posProp = layer.property("Position");

  // Check if dimensions are separated
  var separated = false;
  try { separated = posProp.dimensionsSeparated; } catch(e) {}

  if (separated) {
    // Each axis is its own property with its own keyframes
    var xProp = posProp.getSeparationFollower(0);
    var yProp = posProp.getSeparationFollower(1);
    if (xProp.numKeys > 0) {
      for (var k = 1; k <= xProp.numKeys; k++) {
        xProp.setValueAtKey(k, xProp.keyValue(k) + compDx);
      }
    } else {
      xProp.setValue(xProp.value + compDx);
    }
    if (yProp.numKeys > 0) {
      for (var k = 1; k <= yProp.numKeys; k++) {
        yProp.setValueAtKey(k, yProp.keyValue(k) + compDy);
      }
    } else {
      yProp.setValue(yProp.value + compDy);
    }
  } else if (posProp.numKeys > 0) {
    for (var k = 1; k <= posProp.numKeys; k++) {
      var kv = posProp.keyValue(k);
      if (is3D && kv.length > 2) {
        posProp.setValueAtKey(k, [kv[0] + compDx, kv[1] + compDy, kv[2] + compDz]);
      } else {
        posProp.setValueAtKey(k, [kv[0] + compDx, kv[1] + compDy]);
      }
    }
  } else {
    var pv = posProp.value;
    if (is3D && pv.length > 2) {
      posProp.setValue([pv[0] + compDx, pv[1] + compDy, pv[2] + compDz]);
    } else {
      posProp.setValue([pv[0] + compDx, pv[1] + compDy]);
    }
  }
}
function setAnchorToPoint(point, useMasks) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Set Anchor Point", function() {
    for (var i = 0; i < sel.length; i++) {
      _setAnchorOnLayer(sel[i], point, useMasks);
    }
    return "Anchor → " + point;
  });
}
