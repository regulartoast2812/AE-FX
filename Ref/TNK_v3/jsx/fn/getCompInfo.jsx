function getCompInfo() {
  var c = getComp();
  if (!c) return JSON.stringify({name:"None",w:0,h:0,fps:0,dur:0});
  return JSON.stringify({
    name: c.name,
    w: c.width,
    h: c.height,
    fps: Math.round(c.frameRate * 100) / 100,
    dur: Math.round(c.duration * 100) / 100
  });
}
