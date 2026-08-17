function ffxToBinary() {
  var f = File.openDialog("Pick an .ffx file", "FFX:*.ffx");
  if (!f) return "Cancelled";

  f.encoding = "BINARY";
  f.open("e");
  var binary = f.read().toSource();
  f.close();

  var dlg = new Window("dialog", "FFX → Binary String");
  dlg.orientation = "column";
  dlg.alignChildren = ["fill", "fill"];
  dlg.margins = 10;

  dlg.add("statictext", undefined,
          decodeURI(f.name) + "   (" + binary.length + " chars)");

  var out = dlg.add("edittext", undefined, binary,
                    { multiline: true, scrolling: true, readonly: true });
  out.preferredSize = [680, 420];
  try { out.graphics.font = ScriptUI.newFont("Consolas", "Regular", 11); } catch(e) {}

  var btns = dlg.add("group"); btns.alignment = "right";
  var copyBtn  = btns.add("button", undefined, "Copy");
  var closeBtn = btns.add("button", undefined, "Close", { name: "cancel" });
  var status   = dlg.add("statictext", undefined, "");
  status.characters = 40;

  copyBtn.onClick = function () {
    try {
      var tmp = new File(Folder.temp.fsName + "/tnk_ffx_bin.txt");
      tmp.encoding = "UTF-8";
      tmp.open("w"); tmp.write(binary); tmp.close();
      if ($.os.indexOf("Windows") !== -1) {
        system.callSystem('cmd.exe /c clip < "' + tmp.fsName + '"');
      } else {
        system.callSystem('bash -c "pbcopy < \'' + tmp.fsName + '\'"');
      }
      tmp.remove();
      status.text = "Copied " + binary.length + " chars to clipboard";
    } catch (e) {
      status.text = "Copy failed: " + e.toString();
    }
  };
  closeBtn.onClick = function () { dlg.close(); };

  dlg.show();
  return "FFX binary shown";
}
