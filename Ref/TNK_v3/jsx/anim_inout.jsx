// ── ANIMATION IN / OUT ───────────────────────────────────────────────────────

// ── ANIMATION IN / OUT ───────────────────────────────────────────────────────

function animInDir(inTime, pixels, ease1, ease2, dir) {
    var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Animation In", function() {
    var layers = comp.selectedLayers;
    var easeIn  = new KeyframeEase(0, ease1);
    var easeOut = new KeyframeEase(0, ease2);
  
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
  
      var effectIn = layer.effect('Animation - In');
      if (effectIn != null) layer.Effects.property('Animation - In').remove();
  
      effectIn = layer.Effects.addProperty('ADBE Geometry2');
      effectIn.name = 'Animation - In';
  
      var cp = effectIn.property('Position').value;
      var startPos;
      if      (dir === 'up')    startPos = [cp[0], cp[1] + pixels];
      else if (dir === 'down')  startPos = [cp[0], cp[1] - pixels];
      else if (dir === 'left')  startPos = [cp[0] + pixels, cp[1]];
      else if (dir === 'right') startPos = [cp[0] - pixels, cp[1]];
      else                      startPos = [cp[0], cp[1] + pixels];
  
      var positionProperty = effectIn.property('Position');
      positionProperty.setValueAtTime(layer.inPoint, startPos);
      positionProperty.setValueAtTime(layer.inPoint + inTime, cp);
      positionProperty.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
      positionProperty.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
  
      var opacityProperty = effectIn.property('Opacity');
      if (opacityProperty != null) {
        opacityProperty.setValueAtTime(layer.inPoint, 0);
        opacityProperty.setValueAtTime(layer.inPoint + inTime, 100);
        opacityProperty.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
        opacityProperty.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
      }
    }
      return "Animation in applied";
  });
  comp.openInViewer();
  return "Anim In (" + dir + ") applied";
}

function animOutDir(outTime, pixels, ease1, ease2, dir) {
    var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Animation Out", function() {
    var layers = comp.selectedLayers;
    var easeIn  = new KeyframeEase(0, ease1);
    var easeOut = new KeyframeEase(0, ease2);
  
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
  
      var effectOut = layer.effect('Animation - Out');
      if (effectOut != null) layer.Effects.property('Animation - Out').remove();
  
      effectOut = layer.Effects.addProperty('ADBE Geometry2');
      effectOut.name = 'Animation - Out';
  
      var cp = effectOut.property('Position').value;
      var endPos;
      if      (dir === 'up')    endPos = [cp[0], cp[1] - pixels];
      else if (dir === 'down')  endPos = [cp[0], cp[1] + pixels];
      else if (dir === 'left')  endPos = [cp[0] - pixels, cp[1]];
      else if (dir === 'right') endPos = [cp[0] + pixels, cp[1]];
      else                      endPos = [cp[0], cp[1] - pixels];
  
      var positionProperty = effectOut.property('Position');
      positionProperty.setValueAtTime(layer.outPoint - outTime, cp);
      positionProperty.setValueAtTime(layer.outPoint, endPos);
  
      var ki3 = positionProperty.nearestKeyIndex(layer.outPoint - outTime);
      var ki4 = positionProperty.nearestKeyIndex(layer.outPoint);
  
      if (!positionProperty.isSpatial && positionProperty.value.length == 3) {
        positionProperty.setTemporalEaseAtKey(ki3, [easeIn,easeIn,easeIn], [easeOut,easeOut,easeOut]);
        positionProperty.setTemporalEaseAtKey(ki4, [easeIn,easeIn,easeIn], [easeOut,easeOut,easeOut]);
      } else if (!positionProperty.isSpatial && positionProperty.value.length == 2) {
        positionProperty.setTemporalEaseAtKey(ki3, [easeIn,easeIn], [easeOut,easeOut]);
        positionProperty.setTemporalEaseAtKey(ki4, [easeIn,easeIn], [easeOut,easeOut]);
      } else {
        positionProperty.setTemporalEaseAtKey(ki3, [easeIn], [easeOut]);
        positionProperty.setTemporalEaseAtKey(ki4, [easeIn], [easeOut]);
      }
  
      var opacityProperty = effectOut.property('Opacity');
      if (opacityProperty != null) {
        var currentOpacity = opacityProperty.value;
        opacityProperty.setValueAtTime(layer.outPoint - outTime, currentOpacity);
        opacityProperty.setValueAtTime(layer.outPoint, 0);
        var ok3 = opacityProperty.nearestKeyIndex(layer.outPoint - outTime);
        var ok4 = opacityProperty.nearestKeyIndex(layer.outPoint);
        opacityProperty.setTemporalEaseAtKey(ok3, [easeIn], [easeOut]);
        opacityProperty.setTemporalEaseAtKey(ok4, [easeIn], [easeOut]);
      }
    }
      return "Animation out applied";
  });
  comp.openInViewer();
  return "Anim Out (" + dir + ") applied";
}

// Combined In+Out in ONE undo group — prevents undo group mismatch from two evalScript calls
function animInOutDir(inTime, outTime, pixels, ease1, ease2, dir) {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Animation In+Out", function() {
    var easeIn  = new KeyframeEase(0, ease1);
    var easeOut = new KeyframeEase(0, ease2);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      // ── In ──
      var effectIn = layer.effect('Animation - In');
      if (effectIn != null) layer.Effects.property('Animation - In').remove();
      effectIn = layer.Effects.addProperty('ADBE Geometry2');
      effectIn.name = 'Animation - In';
      var cp = effectIn.property('Position').value;
      var startPos;
      if      (dir === 'up')    startPos = [cp[0], cp[1] + pixels];
      else if (dir === 'down')  startPos = [cp[0], cp[1] - pixels];
      else if (dir === 'left')  startPos = [cp[0] + pixels, cp[1]];
      else if (dir === 'right') startPos = [cp[0] - pixels, cp[1]];
      else                      startPos = [cp[0], cp[1] + pixels];
      var posIn = effectIn.property('Position');
      posIn.setValueAtTime(layer.inPoint, startPos);
      posIn.setValueAtTime(layer.inPoint + inTime, cp);
      posIn.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
      posIn.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
      var opIn = effectIn.property('Opacity');
      if (opIn) {
        opIn.setValueAtTime(layer.inPoint, 0);
        opIn.setValueAtTime(layer.inPoint + inTime, 100);
        opIn.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
        opIn.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
      }
      // ── Out ──
      var effectOut = layer.effect('Animation - Out');
      if (effectOut != null) layer.Effects.property('Animation - Out').remove();
      effectOut = layer.Effects.addProperty('ADBE Geometry2');
      effectOut.name = 'Animation - Out';
      var endPos;
      if      (dir === 'up')    endPos = [cp[0], cp[1] - pixels];
      else if (dir === 'down')  endPos = [cp[0], cp[1] + pixels];
      else if (dir === 'left')  endPos = [cp[0] - pixels, cp[1]];
      else if (dir === 'right') endPos = [cp[0] + pixels, cp[1]];
      else                      endPos = [cp[0], cp[1] - pixels];
      var posOut = effectOut.property('Position');
      posOut.setValueAtTime(layer.outPoint - outTime, cp);
      posOut.setValueAtTime(layer.outPoint, endPos);
      posOut.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
      posOut.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
      var opOut = effectOut.property('Opacity');
      if (opOut) {
        opOut.setValueAtTime(layer.outPoint - outTime, 100);
        opOut.setValueAtTime(layer.outPoint, 0);
        opOut.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
        opOut.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
      }
    }
      return "Animation in+out applied";
  });
  comp.openInViewer();
  return "Anim In+Out (" + dir + ") applied";
}

function animInOut(inTime, outTime, pixels, ease1, ease2) {
  animInDir(inTime, pixels, ease1, ease2, 'up');
  animOutDir(outTime, pixels, ease1, ease2, 'up');
  return "Animation In+Out applied";
}


// ── COMP ─────────────────────────────────────────────────────────────────────
