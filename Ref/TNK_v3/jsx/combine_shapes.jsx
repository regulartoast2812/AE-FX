function combineShapes() {
  var comp = getComp(); if (!comp) return "No comp";
  var selectedLayers = comp.selectedLayers;
  if (!selectedLayers || selectedLayers.length < 2) return "Select 2+ shape layers to combine";
  for (var i = 0; i < selectedLayers.length; i++) {
    if (selectedLayers[i].matchName !== "ADBE Vector Layer") return "All selected layers must be shape layers";
  }

  return _undo("TNK: Combine Shapes", function() {
    var sorted = [];
    for (var i = 0; i < selectedLayers.length; i++) sorted.push(selectedLayers[i]);
    sorted.sort(function(a, b) { return a.index - b.index; });

    function sv(p, v) { try { if (p && !p.isReadOnly) p.setValue(v); } catch(e) {} }
    function gv(p, mn, def) { try { return p.property(mn).value; } catch(e) { return def; } }

    // ── read helpers (snapshot to plain JS objects) ──
    var TAPER_KEYS=["ADBE Vector Taper Length Units","ADBE Vector Taper Start Length","ADBE Vector Taper End Length","ADBE Vector Taper StartWidthPx","ADBE Vector Taper EndWidthPx","ADBE Vector Taper Start Width","ADBE Vector Taper End Width","ADBE Vector Taper Start Ease","ADBE Vector Taper End Ease"];
    var WAVE_KEYS=["ADBE Vector Taper Wave Amount","ADBE Vector Taper Wave Units","ADBE Vector Taper Wavelength","ADBE Vector Taper Wave Cycles","ADBE Vector Taper Wave Phase"];
    var DASH_KEYS=["ADBE Vector Stroke Dash 1","ADBE Vector Stroke Gap 1","ADBE Vector Stroke Dash 2","ADBE Vector Stroke Gap 2","ADBE Vector Stroke Dash 3","ADBE Vector Stroke Gap 3","ADBE Vector Stroke Offset"];
    function readDashes(p){var o={};var sd=p.property("ADBE Vector Stroke Dashes");for(var i=0;i<DASH_KEYS.length;i++){try{o[DASH_KEYS[i]]=sd.property(DASH_KEYS[i]).value;}catch(e){}}return o;}
    function writeDashes(d,o){var dd=d.property("ADBE Vector Stroke Dashes");for(var i=0;i<DASH_KEYS.length;i++){if(o[DASH_KEYS[i]]!==undefined)try{dd.property(DASH_KEYS[i]).setValue(o[DASH_KEYS[i]]);}catch(e){}}}
    function readTaper(p){var o={};for(var i=0;i<TAPER_KEYS.length;i++){try{o[TAPER_KEYS[i]]=p.property(TAPER_KEYS[i]).value;}catch(e){}}return o;}
    function writeTaper(d,o){for(var i=0;i<TAPER_KEYS.length;i++){if(o[TAPER_KEYS[i]]!==undefined)try{d.property(TAPER_KEYS[i]).setValue(o[TAPER_KEYS[i]]);}catch(e){}}}
    function readWave(p){var o={};for(var i=0;i<WAVE_KEYS.length;i++){try{o[WAVE_KEYS[i]]=p.property(WAVE_KEYS[i]).value;}catch(e){}}return o;}
    function writeWave(d,o){for(var i=0;i<WAVE_KEYS.length;i++){if(o[WAVE_KEYS[i]]!==undefined)try{d.property(WAVE_KEYS[i]).setValue(o[WAVE_KEYS[i]]);}catch(e){}}}
    function readFill(p){return{mn:"ADBE Vector Graphic - Fill",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),composite:gv(p,"ADBE Vector Composite Order",1),fillRule:gv(p,"ADBE Vector Fill Rule",1),color:gv(p,"ADBE Vector Fill Color",[1,0,0,1]),opacity:gv(p,"ADBE Vector Fill Opacity",100)};}
    function writeFill(d,o){sv(d.property("ADBE Vector Blend Mode"),o.blendMode);sv(d.property("ADBE Vector Composite Order"),o.composite);sv(d.property("ADBE Vector Fill Rule"),o.fillRule);sv(d.property("ADBE Vector Fill Color"),o.color);sv(d.property("ADBE Vector Fill Opacity"),o.opacity);}
    function readStroke(p){return{mn:"ADBE Vector Graphic - Stroke",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),composite:gv(p,"ADBE Vector Composite Order",1),color:gv(p,"ADBE Vector Stroke Color",[1,0,0,1]),opacity:gv(p,"ADBE Vector Stroke Opacity",100),width:gv(p,"ADBE Vector Stroke Width",2),lineCap:gv(p,"ADBE Vector Stroke Line Cap",1),lineJoin:gv(p,"ADBE Vector Stroke Line Join",1),miter:gv(p,"ADBE Vector Stroke Miter Limit",4),dashes:readDashes(p),taper:readTaper(p.property("ADBE Vector Stroke Taper")),wave:readWave(p.property("ADBE Vector Stroke Wave"))};}
    function writeStroke(d,o){sv(d.property("ADBE Vector Blend Mode"),o.blendMode);sv(d.property("ADBE Vector Composite Order"),o.composite);sv(d.property("ADBE Vector Stroke Color"),o.color);sv(d.property("ADBE Vector Stroke Opacity"),o.opacity);sv(d.property("ADBE Vector Stroke Width"),o.width);sv(d.property("ADBE Vector Stroke Line Cap"),o.lineCap);sv(d.property("ADBE Vector Stroke Line Join"),o.lineJoin);sv(d.property("ADBE Vector Stroke Miter Limit"),o.miter);writeDashes(d,o.dashes);writeTaper(d.property("ADBE Vector Stroke Taper"),o.taper);writeWave(d.property("ADBE Vector Stroke Wave"),o.wave);}
    function readGradientFill(p){return{mn:"ADBE Vector Graphic - G-Fill",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),composite:gv(p,"ADBE Vector Composite Order",1),fillRule:gv(p,"ADBE Vector Fill Rule",1),gradType:gv(p,"ADBE Vector Grad Type",1),startPt:gv(p,"ADBE Vector Grad Start Pt",[0,0]),endPt:gv(p,"ADBE Vector Grad End Pt",[0,100]),hiLitLen:gv(p,"ADBE Vector Grad HiLite Length",0),hiLiteAng:gv(p,"ADBE Vector Grad HiLite Angle",0),gradScale:gv(p,"ADBE Vector Grad Scale",100),gradRot:gv(p,"ADBE Vector Grad Rotation",0),opacity:gv(p,"ADBE Vector Fill Opacity",100),colors:(function(){try{return p.property("ADBE Vector Grad Colors").value;}catch(e){return null;}})()};}
    function writeGradientFill(d,o){sv(d.property("ADBE Vector Blend Mode"),o.blendMode);sv(d.property("ADBE Vector Composite Order"),o.composite);sv(d.property("ADBE Vector Fill Rule"),o.fillRule);sv(d.property("ADBE Vector Grad Type"),o.gradType);sv(d.property("ADBE Vector Grad Start Pt"),o.startPt);sv(d.property("ADBE Vector Grad End Pt"),o.endPt);sv(d.property("ADBE Vector Grad HiLite Length"),o.hiLitLen);sv(d.property("ADBE Vector Grad HiLite Angle"),o.hiLiteAng);sv(d.property("ADBE Vector Grad Scale"),o.gradScale);sv(d.property("ADBE Vector Grad Rotation"),o.gradRot);sv(d.property("ADBE Vector Fill Opacity"),o.opacity);if(o.colors)sv(d.property("ADBE Vector Grad Colors"),o.colors);}
    function readGradientStroke(p){return{mn:"ADBE Vector Graphic - G-Stroke",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),composite:gv(p,"ADBE Vector Composite Order",1),opacity:gv(p,"ADBE Vector Stroke Opacity",100),width:gv(p,"ADBE Vector Stroke Width",2),lineCap:gv(p,"ADBE Vector Stroke Line Cap",1),lineJoin:gv(p,"ADBE Vector Stroke Line Join",1),miter:gv(p,"ADBE Vector Stroke Miter Limit",4),gradType:gv(p,"ADBE Vector Grad Type",1),startPt:gv(p,"ADBE Vector Grad Start Pt",[0,0]),endPt:gv(p,"ADBE Vector Grad End Pt",[0,100]),hiLitLen:gv(p,"ADBE Vector Grad HiLite Length",0),hiLiteAng:gv(p,"ADBE Vector Grad HiLite Angle",0),gradScale:gv(p,"ADBE Vector Grad Scale",100),gradRot:gv(p,"ADBE Vector Grad Rotation",0),colors:(function(){try{return p.property("ADBE Vector Grad Colors").value;}catch(e){return null;}})(),dashes:readDashes(p),taper:readTaper(p.property("ADBE Vector Stroke Taper")),wave:readWave(p.property("ADBE Vector Stroke Wave"))};}
    function writeGradientStroke(d,o){sv(d.property("ADBE Vector Blend Mode"),o.blendMode);sv(d.property("ADBE Vector Composite Order"),o.composite);sv(d.property("ADBE Vector Stroke Opacity"),o.opacity);sv(d.property("ADBE Vector Stroke Width"),o.width);sv(d.property("ADBE Vector Stroke Line Cap"),o.lineCap);sv(d.property("ADBE Vector Stroke Line Join"),o.lineJoin);sv(d.property("ADBE Vector Stroke Miter Limit"),o.miter);sv(d.property("ADBE Vector Grad Type"),o.gradType);sv(d.property("ADBE Vector Grad Start Pt"),o.startPt);sv(d.property("ADBE Vector Grad End Pt"),o.endPt);sv(d.property("ADBE Vector Grad HiLite Length"),o.hiLitLen);sv(d.property("ADBE Vector Grad HiLite Angle"),o.hiLiteAng);sv(d.property("ADBE Vector Grad Scale"),o.gradScale);sv(d.property("ADBE Vector Grad Rotation"),o.gradRot);if(o.colors)sv(d.property("ADBE Vector Grad Colors"),o.colors);writeDashes(d,o.dashes);writeTaper(d.property("ADBE Vector Stroke Taper"),o.taper);writeWave(d.property("ADBE Vector Stroke Wave"),o.wave);}
    function readShape(p){var mn=p.matchName,o={mn:mn,name:p.name};if(mn==="ADBE Vector Shape - Rect"){o.dir=gv(p,"ADBE Vector Shape Direction",1);o.size=gv(p,"ADBE Vector Rect Size",[100,100]);o.pos=gv(p,"ADBE Vector Rect Position",[0,0]);o.rnd=gv(p,"ADBE Vector Rect Roundness",0);}else if(mn==="ADBE Vector Shape - Ellipse"){o.dir=gv(p,"ADBE Vector Shape Direction",1);o.size=gv(p,"ADBE Vector Ellipse Size",[100,100]);o.pos=gv(p,"ADBE Vector Ellipse Position",[0,0]);}else if(mn==="ADBE Vector Shape - Star"){o.dir=gv(p,"ADBE Vector Shape Direction",1);o.type=gv(p,"ADBE Vector Star Type",1);o.pts=gv(p,"ADBE Vector Star Points",5);o.pos=gv(p,"ADBE Vector Star Position",[0,0]);o.rot=gv(p,"ADBE Vector Star Rotation",0);o.ir=gv(p,"ADBE Vector Star Inner Radius",50);o.or=gv(p,"ADBE Vector Star Outer Radius",100);o.irnd=gv(p,"ADBE Vector Star Inner Roundness",0);o.ornd=gv(p,"ADBE Vector Star Outer Roundness",0);}else if(mn==="ADBE Vector Shape"){try{o.shape=p.property("ADBE Vector Shape").value;}catch(e){o.shape=null;}}return o;}
    function writeShape(d,o){var mn=o.mn;if(mn==="ADBE Vector Shape - Rect"){sv(d.property("ADBE Vector Shape Direction"),o.dir);sv(d.property("ADBE Vector Rect Size"),o.size);sv(d.property("ADBE Vector Rect Position"),o.pos);sv(d.property("ADBE Vector Rect Roundness"),o.rnd);}else if(mn==="ADBE Vector Shape - Ellipse"){sv(d.property("ADBE Vector Shape Direction"),o.dir);sv(d.property("ADBE Vector Ellipse Size"),o.size);sv(d.property("ADBE Vector Ellipse Position"),o.pos);}else if(mn==="ADBE Vector Shape - Star"){sv(d.property("ADBE Vector Shape Direction"),o.dir);sv(d.property("ADBE Vector Star Type"),o.type);sv(d.property("ADBE Vector Star Points"),o.pts);sv(d.property("ADBE Vector Star Position"),o.pos);sv(d.property("ADBE Vector Star Rotation"),o.rot);sv(d.property("ADBE Vector Star Inner Radius"),o.ir);sv(d.property("ADBE Vector Star Outer Radius"),o.or);sv(d.property("ADBE Vector Star Inner Roundness"),o.irnd);sv(d.property("ADBE Vector Star Outer Roundness"),o.ornd);}else if(mn==="ADBE Vector Shape"){if(o.shape)sv(d.property("ADBE Vector Shape"),o.shape);}}
    var OPERATOR_MNS={"ADBE Vector Filter - Trim":true,"ADBE Vector Filter - Merge":true,"ADBE Vector Filter - Offset":true,"ADBE Vector Filter - PuckerBloat":true,"ADBE Vector Filter - Repeater":true,"ADBE Vector Filter - Roughen":true,"ADBE Vector Filter - Twist":true,"ADBE Vector Filter - Wiggle":true,"ADBE Vector Filter - Zigzag":true};
    function readOperator(p){var mn=p.matchName,o={mn:mn,name:p.name};if(mn==="ADBE Vector Filter - Trim"){o.start=gv(p,"ADBE Vector Trim Start",0);o.end=gv(p,"ADBE Vector Trim End",100);o.offset=gv(p,"ADBE Vector Trim Offset",0);o.type=gv(p,"ADBE Vector Trim Type",1);}else if(mn==="ADBE Vector Filter - Merge"){o.mode=gv(p,"ADBE Vector Merge Type",1);}else if(mn==="ADBE Vector Filter - Offset"){o.amount=gv(p,"ADBE Vector Offset Amount",0);o.join=gv(p,"ADBE Vector Offset Line Join",1);o.miter=gv(p,"ADBE Vector Offset Miter Limit",4);}else if(mn==="ADBE Vector Filter - PuckerBloat"){o.amount=gv(p,"ADBE Vector PuckerBloat Amount",0);}else if(mn==="ADBE Vector Filter - Repeater"){o.copies=gv(p,"ADBE Vector Repeater Copies",3);o.offset=gv(p,"ADBE Vector Repeater Offset",0);o.order=gv(p,"ADBE Vector Repeater Order",1);var t=p.property("ADBE Vector Repeater Transform");o.tr={anchor:gv(t,"ADBE Vector Repeater Anchor",[0,0]),position:gv(t,"ADBE Vector Repeater Position",[100,0]),scale:gv(t,"ADBE Vector Repeater Scale",[100,100]),rotation:gv(t,"ADBE Vector Repeater Rotation",0),startOpac:gv(t,"ADBE Vector Repeater Start Opacity",100),endOpac:gv(t,"ADBE Vector Repeater End Opacity",100)};}else if(mn==="ADBE Vector Filter - Roughen"){o.radius=gv(p,"ADBE Vector Roughen Radius",5);o.detail=gv(p,"ADBE Vector Roughen Detail",0.7);o.corners=gv(p,"ADBE Vector Roughen Corners",1);o.smooth=gv(p,"ADBE Vector Roughen Smooth",0);o.noise=gv(p,"ADBE Vector Roughen Noise Type",1);o.speed=gv(p,"ADBE Vector Roughen Speed",1);o.seed=gv(p,"ADBE Vector Roughen Random Seed",0);}else if(mn==="ADBE Vector Filter - Twist"){o.angle=gv(p,"ADBE Vector Twist Angle",0);o.center=gv(p,"ADBE Vector Twist Center",[0,0]);}else if(mn==="ADBE Vector Filter - Wiggle"){o.freq=gv(p,"ADBE Vector Wiggler Frequency",2);o.amp=gv(p,"ADBE Vector Wiggler Amount",5);o.noise=gv(p,"ADBE Vector Wiggler Noise Type",1);o.smooth=gv(p,"ADBE Vector Wiggler Smooth",0);o.seed=gv(p,"ADBE Vector Wiggler Random Seed",0);}else if(mn==="ADBE Vector Filter - Zigzag"){o.size=gv(p,"ADBE Vector Zigzag Size",10);o.detail=gv(p,"ADBE Vector Zigzag Detail",10);o.points=gv(p,"ADBE Vector Zigzag Points",1);}return o;}
    function writeOperator(d,o){var mn=o.mn;if(mn==="ADBE Vector Filter - Trim"){sv(d.property("ADBE Vector Trim Start"),o.start);sv(d.property("ADBE Vector Trim End"),o.end);sv(d.property("ADBE Vector Trim Offset"),o.offset);sv(d.property("ADBE Vector Trim Type"),o.type);}else if(mn==="ADBE Vector Filter - Merge"){sv(d.property("ADBE Vector Merge Type"),o.mode);}else if(mn==="ADBE Vector Filter - Offset"){sv(d.property("ADBE Vector Offset Amount"),o.amount);sv(d.property("ADBE Vector Offset Line Join"),o.join);sv(d.property("ADBE Vector Offset Miter Limit"),o.miter);}else if(mn==="ADBE Vector Filter - PuckerBloat"){sv(d.property("ADBE Vector PuckerBloat Amount"),o.amount);}else if(mn==="ADBE Vector Filter - Repeater"){sv(d.property("ADBE Vector Repeater Copies"),o.copies);sv(d.property("ADBE Vector Repeater Offset"),o.offset);sv(d.property("ADBE Vector Repeater Order"),o.order);var t=d.property("ADBE Vector Repeater Transform");sv(t.property("ADBE Vector Repeater Anchor"),o.tr.anchor);sv(t.property("ADBE Vector Repeater Position"),o.tr.position);sv(t.property("ADBE Vector Repeater Scale"),o.tr.scale);sv(t.property("ADBE Vector Repeater Rotation"),o.tr.rotation);sv(t.property("ADBE Vector Repeater Start Opacity"),o.tr.startOpac);sv(t.property("ADBE Vector Repeater End Opacity"),o.tr.endOpac);}else if(mn==="ADBE Vector Filter - Roughen"){sv(d.property("ADBE Vector Roughen Radius"),o.radius);sv(d.property("ADBE Vector Roughen Detail"),o.detail);sv(d.property("ADBE Vector Roughen Corners"),o.corners);sv(d.property("ADBE Vector Roughen Smooth"),o.smooth);sv(d.property("ADBE Vector Roughen Noise Type"),o.noise);sv(d.property("ADBE Vector Roughen Speed"),o.speed);sv(d.property("ADBE Vector Roughen Random Seed"),o.seed);}else if(mn==="ADBE Vector Filter - Twist"){sv(d.property("ADBE Vector Twist Angle"),o.angle);sv(d.property("ADBE Vector Twist Center"),o.center);}else if(mn==="ADBE Vector Filter - Wiggle"){sv(d.property("ADBE Vector Wiggler Frequency"),o.freq);sv(d.property("ADBE Vector Wiggler Amount"),o.amp);sv(d.property("ADBE Vector Wiggler Noise Type"),o.noise);sv(d.property("ADBE Vector Wiggler Smooth"),o.smooth);sv(d.property("ADBE Vector Wiggler Random Seed"),o.seed);}else if(mn==="ADBE Vector Filter - Zigzag"){sv(d.property("ADBE Vector Zigzag Size"),o.size);sv(d.property("ADBE Vector Zigzag Detail"),o.detail);sv(d.property("ADBE Vector Zigzag Points"),o.points);}}

    function readGroup(p){var o={mn:"ADBE Vector Group",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),items:[],transform:{anchor:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Anchor",[0,0]),position:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Position",[0,0]),scale:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Scale",[100,100]),skew:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Skew",0),skewAxis:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Skew Axis",0),rotation:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Rotation",0),opacity:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Group Opacity",100)}};var inner=p.property("ADBE Vectors Group");for(var i=1;i<=inner.numProperties;i++){try{var child=inner.property(i),mn=child.matchName;if(mn==="ADBE Vector Group")o.items.push(readGroup(child));else if(mn==="ADBE Vector Graphic - Fill")o.items.push(readFill(child));else if(mn==="ADBE Vector Graphic - Stroke")o.items.push(readStroke(child));else if(mn==="ADBE Vector Graphic - G-Fill")o.items.push(readGradientFill(child));else if(mn==="ADBE Vector Graphic - G-Stroke")o.items.push(readGradientStroke(child));else if(OPERATOR_MNS[mn])o.items.push(readOperator(child));else o.items.push(readShape(child));}catch(e){}}return o;}

    // ── write group (no cleanup — done in separate pass) ──
    function writeGroup(o, destContainer, overridePos) {
      var grp=destContainer.addProperty("ADBE Vector Group");
      if(!grp) return;
      try{grp.name=o.name;}catch(e){}
      sv(grp.property("ADBE Vector Blend Mode"),o.blendMode);
      for(var i=0;i<o.items.length;i++){
        var inner=grp.property("ADBE Vectors Group");
        var item=o.items[i], mn=item.mn;
        if(mn==="ADBE Vector Group"){writeGroup(item,inner,null);}
        else if(mn==="ADBE Vector Graphic - Fill"){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeFill(n,item);}}
        else if(mn==="ADBE Vector Graphic - Stroke"){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeStroke(n,item);}}
        else if(mn==="ADBE Vector Graphic - G-Fill"){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeGradientFill(n,item);}}
        else if(mn==="ADBE Vector Graphic - G-Stroke"){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeGradientStroke(n,item);}}
        else if(OPERATOR_MNS[mn]){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeOperator(n,item);}}
        else{var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeShape(n,item);}}
      }
      // Hide auto-injected fills/strokes the source didn't have
      grp=destContainer.property(destContainer.numProperties);
      var _hasFill=false,_hasStroke=false,_hasGFill=false,_hasGStroke=false;
      for(var hi=0;hi<o.items.length;hi++){
        var hm=o.items[hi].mn;
        if(hm==="ADBE Vector Graphic - Fill")_hasFill=true;
        if(hm==="ADBE Vector Graphic - Stroke")_hasStroke=true;
        if(hm==="ADBE Vector Graphic - G-Fill")_hasGFill=true;
        if(hm==="ADBE Vector Graphic - G-Stroke")_hasGStroke=true;
      }
      var _inner=grp.property("ADBE Vectors Group");
      for(var hi=1;hi<=_inner.numProperties;hi++){
        try{
          var hp=_inner.property(hi),hmn=hp.matchName;
          if(!_hasFill&&!_hasGFill&&(hmn==="ADBE Vector Graphic - Fill"||hmn==="ADBE Vector Graphic - G-Fill")){
            try{sv(hp.property("ADBE Vector Fill Opacity"),0);}catch(e){}
          }
          if(!_hasStroke&&!_hasGStroke&&(hmn==="ADBE Vector Graphic - Stroke"||hmn==="ADBE Vector Graphic - G-Stroke")){
            try{sv(hp.property("ADBE Vector Stroke Opacity"),0);sv(hp.property("ADBE Vector Stroke Width"),0);}catch(e){}
          }
        }catch(e){}
      }
      var t=grp.property("ADBE Vector Transform Group");
      sv(t.property("ADBE Vector Anchor"),o.transform.anchor);
      sv(t.property("ADBE Vector Position"),overridePos||o.transform.position);
      sv(t.property("ADBE Vector Scale"),o.transform.scale);
      sv(t.property("ADBE Vector Skew"),o.transform.skew);
      sv(t.property("ADBE Vector Skew Axis"),o.transform.skewAxis);
      sv(t.property("ADBE Vector Rotation"),o.transform.rotation);
      sv(t.property("ADBE Vector Group Opacity"),o.transform.opacity);
    }

    // (cleanup is now done inside writeGroup)

    // STEP 1: Explode into single-group layers
    var exploded=[];
    for(var li=0;li<sorted.length;li++){
      var src=sorted[li],cnt=src.property("ADBE Root Vectors Group"),gc=cnt.numProperties;
      if(gc===1){exploded.push(src);}
      else{for(var gi=gc;gi>=1;gi--){var d=src.duplicate();d.selected=false;var dc=d.property("ADBE Root Vectors Group");for(var ri=dc.numProperties;ri>=1;ri--){if(ri!==gi)try{dc.property(ri).remove();}catch(e){}}exploded.push(d);}try{src.remove();}catch(e){}}
    }

    // STEP 2: Snapshot all layer+group data
    var snaps=[];
    for(var ei=0;ei<exploded.length;ei++){
      var lyr=exploded[ei],cnt=lyr.property("ADBE Root Vectors Group");
      if(cnt.numProperties<1)continue;
      var grpData=readGroup(cnt.property(1));
      var lPos=lyr.transform.position.value,lAnc=lyr.transform.anchorPoint.value,lSc=lyr.transform.scale.value,lRot=lyr.transform.rotation.value;
      var gPos=grpData.transform.position,lRad=lRot*Math.PI/180;
      var sx=gPos[0]*(lSc[0]/100),sy=gPos[1]*(lSc[1]/100);
      var rx=sx*Math.cos(lRad)-sy*Math.sin(lRad),ry=sx*Math.sin(lRad)+sy*Math.cos(lRad);
      var ax=lAnc[0]*(lSc[0]/100),ay=lAnc[1]*(lSc[1]/100);
      var arx=ax*Math.cos(lRad)-ay*Math.sin(lRad),ary=ax*Math.sin(lRad)+ay*Math.cos(lRad);
      grpData.transform.scale=[grpData.transform.scale[0]*lSc[0]/100,grpData.transform.scale[1]*lSc[1]/100];
      grpData.transform.rotation=grpData.transform.rotation+lRot;
      snaps.push({grpData:grpData,compX:lPos[0]+rx-arx,compY:lPos[1]+ry-ary});
    }

    // STEP 3: Delete exploded layers
    for(var ei=exploded.length-1;ei>=0;ei--){try{exploded[ei].remove();}catch(e){}}

    // STEP 4: New combined layer at comp center
    var nl=comp.layers.addShape();
    nl.name="Combined Shape";
    nl.transform.position.setValue([comp.width/2,comp.height/2]);
    nl.transform.anchorPoint.setValue([0,0]);
    nl.transform.scale.setValue([100,100]);
    nl.transform.rotation.setValue(0);
    var nc=nl.property("ADBE Root Vectors Group");
    var targetLayerIdx=nl.index;

    // STEP 5: Write all groups
    for(var si=0;si<snaps.length;si++){
      var s=snaps[si],pos=[s.compX-comp.width/2,s.compY-comp.height/2];
      writeGroup(s.grpData,nc,pos);
    }



    return "Shapes combined into 'Combined Shape'";
  });
}

