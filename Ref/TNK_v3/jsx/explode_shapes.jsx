function explodeShapes() {
  var comp = getComp(); if (!comp) return "No comp";
  var selectedLayers = comp.selectedLayers;
  if (!selectedLayers || selectedLayers.length === 0) return "Select at least one shape layer";

  return _undo("TNK: Explode Shapes", function() {
    var totalCreated = 0;
    var layersToDelete = [];

    for(var li=0; li<selectedLayers.length; li++){
      var srcLayer=selectedLayers[li];
      if(srcLayer.matchName !== "ADBE Vector Layer") continue;
      var contents=srcLayer.property("ADBE Root Vectors Group");
      if(!contents || contents.numProperties < 1) continue;

      // Snapshot group count and names before duplicating
      var groupCount=contents.numProperties, groupNames=[];
      for(var gi=1;gi<=groupCount;gi++) groupNames.push(contents.property(gi).name);

      // Duplicate once per group, strip all others
      for(var gi=groupCount-1;gi>=0;gi--){
        var newLayer=srcLayer.duplicate();
        newLayer.moveAfter(srcLayer);
        newLayer.name=groupNames[gi];
        var newContents=newLayer.property("ADBE Root Vectors Group");
        for(var ri=newContents.numProperties;ri>=1;ri--){
          if(ri !== gi+1) try{newContents.property(ri).remove();}catch(e){}
        }
        newLayer.selected=false;
        totalCreated++;
      }
      layersToDelete.push(srcLayer);
    }

    // Delete originals after all duplicating is done
    for(var di=0;di<layersToDelete.length;di++){try{layersToDelete[di].remove();}catch(e){}}

    if(totalCreated === 0) return "No shape groups found to explode";
    return "Exploded into " + totalCreated + " layer(s)";
  });
}
