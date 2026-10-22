// Turns artifact/index.html (a full document) into the page body Claude's artifact viewer expects.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "artifact", "index.html"), "utf8");
const styles = (src.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("\n");
const scripts = (src.match(/<script[^>]*>[\s\S]*?<\/script>/g) || []).join("\n");
const page = `<title>Shoe Builder</title>
<meta name="claude:viewport-fit-sides" content="cover">
${styles}
<div id="root"></div>
${scripts}
`;
fs.writeFileSync(path.join(__dirname, "..", "artifact", "shoe-builder.html"), page);
console.log("artifact/shoe-builder.html", page.length, "bytes");
