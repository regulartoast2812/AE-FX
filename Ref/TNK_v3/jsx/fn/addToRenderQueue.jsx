function addToRenderQueue() {
    var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Add to Render Queue", function() {
    app.project.renderQueue.items.add(c);
    return "Added to render queue";
  });
}
