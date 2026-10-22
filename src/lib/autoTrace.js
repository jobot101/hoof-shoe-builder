// Auto trace: finds the outside of the hoof wall in the photo with OpenCV GrabCut,
// seeded by one tap in the middle of the sole. Returns editable outline points
// (photo pixels) plus a first guess at the frog points (toe toward the top of the photo).

const CV_CDN = "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.12.0-release.1/dist/opencv.js";
let cvReady = null;

// OpenCV's module object has its own then(), so it must never be returned from an
// async function directly (the promise would chase it forever). Wrap it instead.
async function settle(mod) {
  if (mod instanceof Promise) mod = await new Promise((resolve) => mod.then((m) => resolve({ m })).catch(() => resolve({ m: null }))).then((x) => x.m);
  if (!mod) throw new Error("Couldn't load the tracer.");
  if (!mod.Mat) await new Promise((resolve) => { mod.onRuntimeInitialized = resolve; });
  if (typeof mod.then === "function") { try { delete mod.then; } catch (e) { /* read-only */ } }
  return { cv: mod };
}

/**
 * Loads OpenCV once (about 11 MB) as a plain script, never through import(): its module
 * object has a then() that would send any promise chain round in circles.
 * Web app and phone apps ship it in lib/opencv.js; inside Claude it comes from the CDN.
 */
export function loadOpenCV() {
  if (!cvReady) {
    cvReady = (async () => {
      if (!window.cv) {
        const src = import.meta.env.MODE === "artifact" ? CV_CDN : "lib/opencv.js";
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = src;
          s.async = true;
          s.onload = resolve;
          s.onerror = () => reject(new Error("Couldn't load the tracer. Check the connection and try again."));
          document.head.appendChild(s);
        });
      }
      return settle(window.cv);
    })().catch((e) => { cvReady = null; throw e; });
  }
  return cvReady;
}

function resampleClosed(pts, n) {
  const cum = [0];
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1], b = pts[i % pts.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[cum.length - 1], out = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const s = (k / n) * total;
    while (cum[j] < s) j++;
    const a = pts[j - 1], b = pts[j % pts.length], f = (s - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}

/**
 * @param {HTMLImageElement} image  the sole photo
 * @param {[number, number]} seed   tap in the middle of the sole (photo pixels)
 * @param {number} mmPerPx          scale, or 0 if not set yet
 * @param {Array} scalePts          the two scale points, kept out of the hoof
 */
export async function autoTrace(image, seed, mmPerPx, scalePts) {
  const { cv } = await loadOpenCV();
  const W = image.naturalWidth, H = image.naturalHeight;
  const s = Math.min(1, 520 / Math.max(W, H));
  const w = Math.round(W * s), h = Math.round(H * s);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(image, 0, 0, w, h);

  const mats = [];
  const keep = (m) => { mats.push(m); return m; };
  try {
    const rgba = keep(cv.imread(canvas));
    const rgb = keep(new cv.Mat());
    cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);

    const pxPerMM = mmPerPx ? s / mmPerPx : 0;
    const cx = seed[0] * s, cy = seed[1] * s;
    const reach = pxPerMM ? 100 * pxPerMM : 0.46 * Math.min(w, h);   // hooves run up to ~180 mm across
    const core = pxPerMM ? 18 * pxPerMM : 0.07 * Math.min(w, h);     // surely sole

    const mask = keep(new cv.Mat(h, w, cv.CV_8UC1, new cv.Scalar(cv.GC_BGD)));
    cv.circle(mask, new cv.Point(cx, cy), Math.round(reach), new cv.Scalar(cv.GC_PR_FGD), -1);
    cv.circle(mask, new cv.Point(cx, cy), Math.round(core), new cv.Scalar(cv.GC_FGD), -1);
    if (scalePts && scalePts.length === 2 && pxPerMM) {
      // the scale stick is never part of the hoof
      const a = scalePts[0].map((v) => v * s), b = scalePts[1].map((v) => v * s);
      const ux = b[0] - a[0], uy = b[1] - a[1], L = Math.hypot(ux, uy) || 1, ex = ux / L, ey = uy / L;
      const half = 10 * pxPerMM, ext = 14 * pxPerMM;
      const corners = [
        [a[0] - ex * ext - ey * half, a[1] - ey * ext + ex * half],
        [b[0] + ex * ext - ey * half, b[1] + ey * ext + ex * half],
        [b[0] + ex * ext + ey * half, b[1] + ey * ext - ex * half],
        [a[0] - ex * ext + ey * half, a[1] - ey * ext - ex * half],
      ];
      const poly = keep(cv.matFromArray(4, 1, cv.CV_32SC2, corners.flat().map(Math.round)));
      const polys = keep(new cv.MatVector());
      polys.push_back(poly);
      cv.fillPoly(mask, polys, new cv.Scalar(cv.GC_BGD));
    }

    const bgd = keep(new cv.Mat()), fgd = keep(new cv.Mat());
    cv.grabCut(rgb, mask, new cv.Rect(0, 0, 1, 1), bgd, fgd, 5, cv.GC_INIT_WITH_MASK);

    // foreground = sure + probable foreground
    const fg = keep(new cv.Mat(h, w, cv.CV_8UC1));
    const md = mask.data, fd = fg.data;
    for (let i = 0; i < md.length; i++) fd[i] = md[i] === cv.GC_FGD || md[i] === cv.GC_PR_FGD ? 255 : 0;

    const k = Math.max(3, Math.round((pxPerMM ? 4 * pxPerMM : 0.012 * Math.min(w, h)) / 2) * 2 + 1);
    const kernel = keep(cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k)));
    cv.morphologyEx(fg, fg, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(fg, fg, cv.MORPH_CLOSE, kernel);

    const contours = keep(new cv.MatVector()), hier = keep(new cv.Mat());
    cv.findContours(fg, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);
    let best = -1, bestScore = -1;
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const inside = cv.pointPolygonTest(c, new cv.Point(cx, cy), false) >= 0;
      const area = cv.contourArea(c);
      const score = area * (inside ? 10 : 1);
      if (score > bestScore) { bestScore = score; best = i; }
      c.delete();
    }
    if (best < 0) throw new Error("Couldn't find the hoof edge. Tap closer to the middle of the sole, or trace it by hand.");
    const c = contours.get(best);
    const raw = [];
    for (let i = 0; i < c.data32S.length; i += 2) raw.push([c.data32S[i] / s, c.data32S[i + 1] / s]);
    const area = cv.contourArea(c) / (s * s);
    c.delete();
    if (raw.length < 20) throw new Error("Couldn't find the hoof edge. Tap closer to the middle of the sole, or trace it by hand.");
    if (mmPerPx) {
      const mm2 = area * mmPerPx * mmPerPx;
      if (mm2 < 40 * 40 || mm2 > 220 * 220) throw new Error("What it found doesn't look like a hoof. Check the scale, then tap the middle of the sole again, or trace it by hand.");
    }

    const outline = resampleClosed(raw, 20);
    // first guess at the frog, assuming the toe is toward the top of the photo
    const xs = outline.map((p) => p[0]), ys = outline.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const mid = (minX + maxX) / 2, wd = maxX - minX, ht = maxY - minY;
    const frog = [
      [mid, minY + ht * 0.46],
      [mid + wd * 0.12, maxY - ht * 0.01],
      [mid - wd * 0.12, maxY - ht * 0.01],
    ];
    return { outline, frog };
  } finally {
    mats.forEach((m) => { try { m.delete(); } catch (e) { /* already freed */ } });
  }
}
