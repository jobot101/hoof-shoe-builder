import ShoeGeom from "./shoeGeom.js";

// A drawn stand-in sole (4 px per mm) with the reference card, so the tool opens in a working state.
export function makeSampleSole() {
  const PX = 4, W = 760, H = 880, cx = 95, cy = 90;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = "#8d8a83"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = rnd() > 0.5 ? "rgba(40,38,35,.35)" : "rgba(230,228,220,.3)";
    const r = rnd() * 3 + 0.5;
    g.beginPath(); g.arc(rnd() * W, rnd() * H, r, 0, 7); g.fill();
  }
  const mm = [[0,-68],[25,-63],[45,-50],[58,-30],[63,-8],[61,15],[54,36],[42,52],[28,58],[-27,58],[-41,52],[-53,36],[-61,15],[-63,-8],[-57,-30],[-44,-50],[-24,-63]];
  const px = mm.map((p) => [(p[0] + cx) * PX, (p[1] + cy) * PX]);
  const curve = ShoeGeom.catmull(px, 12);
  const pathOf = (pts, k) => {
    g.beginPath();
    pts.forEach((p, i) => {
      const x = cx * PX + (p[0] - cx * PX) * k, y = cy * PX + (p[1] - cy * PX) * k;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.closePath();
  };
  pathOf(curve, 1); g.fillStyle = "#5b4a3b"; g.fill();
  pathOf(curve, 0.86); g.fillStyle = "#cbb79b"; g.fill();
  pathOf(curve, 0.82); g.fillStyle = "#9d8a72"; g.fill();
  g.fillStyle = "#4a3d33"; g.beginPath();
  g.moveTo(cx * PX, (cy - 10) * PX);
  g.quadraticCurveTo((cx + 20) * PX, (cy + 30) * PX, (cx + 17) * PX, (cy + 58) * PX);
  g.lineTo((cx - 17) * PX, (cy + 58) * PX);
  g.quadraticCurveTo((cx - 20) * PX, (cy + 30) * PX, cx * PX, (cy - 10) * PX);
  g.fill();
  g.strokeStyle = "#2c241e"; g.lineWidth = 6;
  g.beginPath(); g.moveTo(cx * PX, (cy + 8) * PX); g.lineTo(cx * PX, (cy + 50) * PX); g.stroke();
  const ry = cy + 80, rx0 = cx - 58;
  g.fillStyle = "#e9592a"; g.fillRect(rx0 * PX, ry * PX, 116 * PX, 26 * PX);
  g.fillStyle = "#2b2420";
  for (let t = 0; t <= 10; t++) {
    const major = t === 0 || t === 10, w = major ? 1 : 0.8, h = major ? 16 : 7, x = cx - 50 + t * 10;
    g.fillRect((x - w / 2) * PX, (ry + 3) * PX, w * PX, h * PX);
  }
  return {
    src: c.toDataURL("image/jpeg", 0.85),
    outline: px,
    scalePts: [[(cx - 50) * PX, (ry + 11) * PX], [(cx + 50) * PX, (ry + 11) * PX]],
    frog: [[cx * PX, (cy - 10) * PX], [(cx + 15) * PX, (cy + 57) * PX], [(cx - 15) * PX, (cy + 57) * PX]],
  };
}
