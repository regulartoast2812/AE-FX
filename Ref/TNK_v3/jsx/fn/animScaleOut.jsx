// Scale OUT — Slider Control + expression on Scale. 100→0 at outPoint.
function animScaleOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Scale Out", function() {
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
      slider.setValueAtTime(layer.outPoint - outTime, 100);
      slider.setValueAtTime(layer.outPoint,             0);
      var k3 = slider.nearestKeyIndex(layer.outPoint - outTime);
      var k4 = slider.nearestKeyIndex(layer.outPoint);
      slider.setTemporalEaseAtKey(k3, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k4, [eIn], [eOut]);
      layer.property("Scale").expression =
        'value * effect("' + SLIDER_NAME + '")("Slider") / 100';
    }
    return "Scale out on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}
