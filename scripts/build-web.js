// Builds www/ for Capacitor from src/tool.html (the same tool as the web page),
// swapping CDN libraries and Google Fonts for bundled copies and wiring native save/share/camera.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), www = path.join(root, "www");
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(www, "lib"), { recursive: true });
fs.mkdirSync(path.join(www, "fonts"), { recursive: true });
const nm = (p) => path.join(root, "node_modules", p);
fs.copyFileSync(nm("clipper-lib/clipper.js"), path.join(www, "lib/clipper.js"));
fs.copyFileSync(nm("earcut/dist/earcut.min.js"), path.join(www, "lib/earcut.min.js"));
fs.copyFileSync(nm("three/build/three.min.js"), path.join(www, "lib/three.min.js"));
fs.copyFileSync(path.join(root, "src/shoe-geom.js"), path.join(www, "lib/shoe-geom.js"));
fs.copyFileSync(path.join(root, "src/native.js"), path.join(www, "native.js"));
for (const f of fs.readdirSync(path.join(root, "src/pwa"))) fs.copyFileSync(path.join(root, "src/pwa", f), path.join(www, f));

const faces = [
  ["Barlow Condensed", "barlow-condensed", [600, 700]],
  ["IBM Plex Mono", "ibm-plex-mono", [400, 500]],
  ["Source Sans 3", "source-sans-3", [400, 600]],
];
let fontCss = "";
for (const [fam, pkg, weights] of faces) for (const w of weights) {
  const f = `${pkg}-latin-${w}-normal.woff2`;
  fs.copyFileSync(nm(`@fontsource/${pkg}/files/${f}`), path.join(www, "fonts", f));
  fontCss += `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${f}) format("woff2")}\n`;
}
fs.writeFileSync(path.join(www, "fonts.css"), fontCss);

let t = fs.readFileSync(path.join(root, "src/tool.html"), "utf8");
const swap = (a, b) => { if (!t.includes(a)) throw new Error("build: missing marker " + a.slice(0, 60)); t = t.split(a).join(b); };

// fonts + libraries
t = t.replace(/<link rel="preconnect"[^>]*>\n/g, "");
swap(t.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>/)[0], '<link rel="stylesheet" href="fonts.css">');
swap('<script src="https://cdn.jsdelivr.net/npm/clipper-lib@6.4.2/clipper.js"></script>', '<script src="lib/clipper.js"></script>');
swap('<script src="https://cdn.jsdelivr.net/npm/earcut@2.2.4/dist/earcut.min.js"></script>', '<script src="lib/earcut.min.js"></script>');
swap('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', '<script src="lib/three.min.js"></script>\n<script src="native.js"></script>');
swap("<script>\n/*GEOM*/\n</script>", '<script src="lib/shoe-geom.js"></script>');
t = t.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "");

// safe areas (the artifact viewer used to add these)
swap("body { background: var(--bg);", `:root { padding-top: max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px)); padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px)); }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; -webkit-tap-highlight-color: transparent; }
body { background: var(--bg);`);

// save section: native save + share instead of the artifact download
swap('<button class="btn primary big" id="save" type="button">Save shoe for printing (.zip)</button>\n    <button class="btn" id="saveCard" type="button">Save reference card (.zip)</button>',
  '<button class="btn primary big" id="save" type="button">Save shoe to phone (.stl)</button>\n    <div class="tools"><button class="btn" id="share" type="button">Share STL…</button><button class="btn" id="saveCard" type="button">Save reference card</button></div>');
swap("<li>Tap the saved zip in Files to unzip it. You get the STL plus print notes.</li>\n        <li>On makerworld.com, upload the STL as a private model.</li>",
  '<li>Save the shoe. In the app it lands in <b>Documents › HoofShoe</b>; in Safari or Chrome it goes to <b>Downloads</b> (iPhone: Files › Downloads).</li>\n        <li>On <a href="https://makerworld.com" target="_blank" rel="noopener" style="color:var(--accent)">makerworld.com</a>, upload the STL as a private model.</li>');

// native hooks: replace the artifact-only download path
swap('  var dlPromise = (window.claude && window.claude.use) ? window.claude.use("downloads").catch(function () { return null; }) : Promise.resolve(null);', "");
t = t.replace(/  async function saveZip\(files, filename\) \{[\s\S]*?\n  \}\n  \$\("save"\)\.addEventListener[\s\S]*?\n  \}\);\n  \$\("saveCard"\)\.addEventListener[\s\S]*?\n  \}\);\n/, `  function shoeFiles() {
    var name = "hoof-shoe_" + Math.round(shoe.dims.length) + "x" + Math.round(shoe.dims.width) + "mm";
    return { name: name, files: [{ name: name + ".stl", data: ShoeGeom.stl(lastTris) }, { name: name + "_print-notes.txt", data: notes(name) }] };
  }
  function say(text, kind) { var m = $("saveMsg"); m.className = "msg" + (kind ? " " + kind : ""); m.textContent = text; }
  $("save").addEventListener("click", async function () {
    if (!shoe || !lastTris) return;
    var s = shoeFiles(); say("Saving " + s.name + ".stl…");
    try { var where = await HoofNative.saveFiles(s.files); say("Saved " + s.name + ".stl to " + where + ".", "ok"); }
    catch (e) { say("Couldn't save: " + (e && e.message || e), "err"); }
  });
  $("share").addEventListener("click", async function () {
    if (!shoe || !lastTris) return;
    var s = shoeFiles();
    try { await HoofNative.shareFile(s.files[0]); say("", ""); }
    catch (e) { if (!/cancel/i.test(String(e && e.message || e))) say("Couldn't share: " + (e && e.message || e), "err"); }
  });
  $("saveCard").addEventListener("click", async function () {
    try {
      var where = await HoofNative.saveFiles([{ name: "scale-card_100mm.stl", data: ShoeGeom.stl(ShoeGeom.card()) },
        { name: "scale-card_notes.txt", data: "Scale reference card, 116 x 26 x 1.2 mm.\\nSlots at 0 and 100 mm (3.937 in), ticks every 10 mm.\\nPrint in a color that contrasts with the hoof. PLA or PETG, 0.2 mm layers.\\nTape it flat to the sole near the bearing edge, then tap the 0 and 100 slots in the Scale step." }]);
      say("Saved scale-card_100mm.stl to " + where + ".", "ok");
    } catch (e) { say("Couldn't save: " + (e && e.message || e), "err"); }
  });
`);
if (t.includes("saveZip(")) throw new Error("build: saveZip still referenced");
swap('"Phone route: unzip -> upload the STL to MakerWorld', '"Phone route: upload the STL to MakerWorld');

// photo: native camera/gallery picker on device, file input elsewhere
swap('  $("photo").addEventListener("change", function () {', `  function loadImage(src, label) {
    var img = new Image();
    img.onload = function () {
      S.img = img; S.sample = false; S.scalePts = []; S.outline = []; S.frog = []; S.sel = -1; history = [];
      $("badge").textContent = label.slice(0, 28).toUpperCase(); shoe = null;
      fit(); setMode("scale"); changed();
    };
    img.onerror = function () { $("genMsg").textContent = "That photo didn't open. Try another one."; $("genMsg").className = "msg err"; };
    img.src = src;
  }
  if (HoofNative.isNative) {
    $("photo").closest("label").addEventListener("click", async function (e) {
      e.preventDefault();
      try { var src = await HoofNative.pickPhoto(); if (src) loadImage(src, "SOLE PHOTO"); }
      catch (err) { if (!/cancel/i.test(String(err && err.message || err))) { $("genMsg").textContent = "Couldn't open the camera: " + (err.message || err); $("genMsg").className = "msg err"; } }
    });
  }
  $("photo").addEventListener("change", function () {`);
swap("Load sole photo<input", "Take or choose photo<input");

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0D0B09">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Hoof Shoe">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
`;
t = head + t.replace("</style>", "</style>\n</head>\n<body>").replace(/\s*$/, "\n</body>\n</html>\n");
// move <title> + links into head ordering is fine: they precede </head>
// offline cache for the hosted web app (skipped inside the native apps)
const files = [];
(function walk(d, rel) { for (const f of fs.readdirSync(d)) { const full = path.join(d, f), r = rel ? rel + "/" + f : f; if (fs.statSync(full).isDirectory()) walk(full, r); else files.push(r); } })(www, "");
files.push("index.html");
const version = require("crypto").createHash("sha1").update(t + files.join()).digest("hex").slice(0, 10);
fs.writeFileSync(path.join(www, "sw.js"), `const CACHE = "hoofshoe-${version}";
const FILES = ${JSON.stringify(["./"].concat(files))};
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => { if (e.request.method !== "GET") return; e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request))); });
`);
t = t.replace("</body>", `<script>
if ("serviceWorker" in navigator && location.protocol === "https:" && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) {
  navigator.serviceWorker.register("sw.js").catch(function () {});
}
</script>
</body>`);
fs.writeFileSync(path.join(www, "index.html"), t);
console.log("www built:", fs.readdirSync(www).join(", "));
