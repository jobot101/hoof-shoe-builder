// Native bridge for Capacitor. Falls back to browser behaviour when not on a device.
(function () {
  var Cap = window.Capacitor;
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  var plat = Cap && Cap.getPlatform ? Cap.getPlatform() : "web";
  function plugin(n) { return Cap && Cap.Plugins ? Cap.Plugins[n] : null; }
  function b64(data) {
    if (typeof data === "string") data = new TextEncoder().encode(data);
    var s = "", CH = 0x8000;
    for (var i = 0; i < data.length; i += CH) s += String.fromCharCode.apply(null, data.subarray(i, i + CH));
    return btoa(s);
  }
  async function write(dir, name, data) {
    var FS = plugin("Filesystem");
    var r = await FS.writeFile({ path: "HoofShoe/" + name, data: b64(data), directory: dir, recursive: true });
    return r.uri;
  }
  async function saveFiles(files) {
    if (!isNative) {
      var only = files.filter(function (f) { return /\.stl$/i.test(f.name); });
      var list = only.length ? only : files;
      for (var i = 0; i < list.length; i++) {
        var f = list[i];
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([f.data], { type: "application/octet-stream" }));
        a.download = f.name; a.rel = "noopener";
        document.body.appendChild(a); a.click(); a.remove();
        if (i < list.length - 1) await new Promise(function (r) { setTimeout(r, 600); });
      }
      return /iPhone|iPad/.test(navigator.userAgent) ? "Files › Downloads" : "Downloads";
    }
    try {
      for (var i = 0; i < files.length; i++) await write("DOCUMENTS", files[i].name, files[i].data);
      return plat === "ios" ? "Files › On My iPhone › Hoof Shoe › HoofShoe" : "Documents › HoofShoe";
    } catch (e) {
      // Older Android without public Documents access: keep a copy in app storage and hand it to the share sheet.
      var uri = await write("DATA", files[0].name, files[0].data);
      await plugin("Share").share({ title: files[0].name, files: [uri], dialogTitle: "Save " + files[0].name });
      return "the place you picked";
    }
  }
  async function shareFile(f) {
    if (!isNative) {
      if (navigator.share && navigator.canShare) {
        var file = new File([f.data], f.name, { type: "model/stl" });
        if (navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: f.name });
      }
      return saveFiles([f]);
    }
    var uri = await write("CACHE", f.name, f.data);
    await plugin("Share").share({ title: f.name, files: [uri], dialogTitle: "Send " + f.name });
  }
  async function pickPhoto() {
    var Camera = plugin("Camera");
    var p = await Camera.getPhoto({ resultType: "dataUrl", source: "PROMPT", quality: 92, correctOrientation: true, width: 3000, promptLabelHeader: "Sole photo", promptLabelPhoto: "Choose from photos", promptLabelPicture: "Take photo" });
    return p && p.dataUrl;
  }
  window.HoofNative = { isNative: isNative, platform: plat, saveFiles: saveFiles, shareFile: shareFile, pickPhoto: pickPhoto };
})();
