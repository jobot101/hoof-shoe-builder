// Writes www/sw.js: caches every built file so the web app works offline after the first visit.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const www = path.join(__dirname, "..", "www");
const files = [];
(function walk(d, rel) {
  for (const f of fs.readdirSync(d)) {
    const full = path.join(d, f), r = rel ? rel + "/" + f : f;
    if (fs.statSync(full).isDirectory()) walk(full, r);
    else if (f !== "sw.js") files.push(r);
  }
})(www, "");
const hash = crypto.createHash("sha1");
files.forEach((f) => hash.update(f).update(fs.readFileSync(path.join(www, f))));
const version = hash.digest("hex").slice(0, 10);
fs.writeFileSync(path.join(www, "sw.js"), `const CACHE = "shoebuilder-${version}";
const FILES = ${JSON.stringify(["./"].concat(files))};
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => { if (e.request.method !== "GET") return; e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request))); });
`);
console.log("sw.js:", files.length, "files, cache", version);
