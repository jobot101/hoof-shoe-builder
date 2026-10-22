import ShoeGeom from "./shoeGeom.js";

// A drawn stand-in sole (4 px per mm) with the reference card, so the tool opens in a working state.
export function makeSampleSole() {
  const PX = 4, W = 760, H = 900, cx = 95, cy = 90;
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
  // scale stick (124 x 34 mm): mm edge on top, inch edge below, zero at the same x
  const ry = cy + 72, X0 = cx - 54, top = ry, bot = ry + 34;
  g.fillStyle = "#e9592a"; g.fillRect((cx - 62) * PX, top * PX, 124 * PX, 34 * PX);
  g.fillStyle = "#2b2420";
  for (let mm = 0; mm <= 100; mm += 5) {
    const end = mm === 0 || mm === 100, len = end ? 12 : mm === 50 ? 9 : mm % 10 === 0 ? 7 : 4, w = end ? 1 : 0.7;
    g.fillRect((X0 + mm - w / 2) * PX, (top + 1.5) * PX, w * PX, len * PX);
  }
  for (let q = 0; q <= 16; q++) {
    const end = q === 0 || q === 16, li = end ? 12 : q % 4 === 0 ? 9 : q % 2 === 0 ? 6 : 3.5, w = end ? 1 : 0.7;
    g.fillRect((X0 + q * 6.35 - w / 2) * PX, (bot - 1.5 - li) * PX, w * PX, li * PX);
  }
  g.fillStyle = "#fff4e6"; g.font = "600 " + 4.5 * PX + "px sans-serif";
  [["0", 0], ["50", 50]].forEach(([t, mm]) => g.fillText(t, (X0 + mm + 1.4) * PX, (top + 12) * PX));
  g.fillText("100 mm", (X0 + 88) * PX, (top + 12) * PX);
  [0, 1, 2, 3].forEach((n) => g.fillText(String(n), (X0 + n * 25.4 + 1.4) * PX, (top + 26) * PX));
  g.fillText("4 in", (X0 + 101.6 + 1.4) * PX, (top + 26) * PX);
  return {
    src: c.toDataURL("image/jpeg", 0.85),
    outline: px,
    scaleMM: [[X0 * PX, (top + 7) * PX], [(X0 + 100) * PX, (top + 7) * PX]],
    scaleIN: [[X0 * PX, (bot - 7) * PX], [(X0 + 101.6) * PX, (bot - 7) * PX]],
    frog: [[cx * PX, (cy - 10) * PX], [(cx + 15) * PX, (cy + 57) * PX], [(cx - 15) * PX, (cy + 57) * PX]],
  };
}
