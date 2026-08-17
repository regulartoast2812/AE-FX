// Scale IN+OUT — Slider 0→100 at inPoint, 100→0 at outPoint. Clears existing keys first.
function animScaleInOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime  = params ? (params.inTime  || 1)  : 1;
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Scale In+Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var SLIDER_NAME = "Scale Animation";
      var sliderFx = layer.effect(SLIDER_NAME);
      if (sliderFx == null) {
        sliderFx = layer.Effects.addProperty("ADBE Slider Control");
        sliderFx.name = SLIDER_NAME;
      }
      var slider = sliderFx.property("Slider");
      // Clear existing keys
      while (slider.numKeys > 0) slider.removeKey(1);
      slider.setValueAtTime(layer.inPoint,              0);
      slider.setValueAtTime(layer.inPoint  + inTime,  100);
      slider.setValueAtTime(layer.outPoint - outTime, 100);
      slider.setValueAtTime(layer.outPoint,             0);
      var k1 = slider.nearestKeyIndex(layer.inPoint);
      var k2 = slider.nearestKeyIndex(layer.inPoint  + inTime);
      var k3 = slider.nearestKeyIndex(layer.outPoint - outTime);
      var k4 = slider.nearestKeyIndex(layer.outPoint);
      slider.setTemporalEaseAtKey(k1, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k2, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k3, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k4, [eIn], [eOut]);
      layer.property("Scale").expression =
        'value * effect("' + SLIDER_NAME + '")("Slider") / 100';
    }
    return "Scale in+out on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}
