// Ships OpenCV with the web app and phone apps as public/lib/opencv.js (loaded on demand by Auto trace).
const fs = require("fs"), path = require("path");
const dest = path.join(__dirname, "..", "public", "lib");
fs.mkdirSync(dest, { recursive: true });
fs.copyFileSync(require.resolve("@techstark/opencv-js/dist/opencv.js"), path.join(dest, "opencv.js"));
console.log("public/lib/opencv.js ready");
