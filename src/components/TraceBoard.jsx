import { useEffect, useRef } from "react";
import ShoeGeom from "../lib/shoeGeom.js";

const OVERLAY = "#D9A93F";
const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * The photo with the traced points. Tap to place, drag a point to move it,
 * pinch (or wheel) to zoom in on the spot between your fingers. No panning.
 */
export default function TraceBoard({ image, badge, mode, scalePts, outline, frog, sel, overlay, fitKey, onTap, onDragStart, onDrag, onDragEnd, onSelect }) {
  const canvasRef = useRef(null);
  const view = useRef({ k: 1, ox: 0, oy: 0 });
  const props = useRef({});
  props.current = { image, mode, scalePts, outline, frog, sel, overlay, onTap, onDragStart, onDrag, onDragEnd, onSelect };

  const toScreen = (p) => [p[0] * view.current.k + view.current.ox, p[1] * view.current.k + view.current.oy];
  const toImg = (x, y) => [(x - view.current.ox) / view.current.k, (y - view.current.oy) / view.current.k];

  function draw() {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = cv.width / dpr, h = cv.height / dpr;
    const { image, mode, scalePts, outline, frog, sel, overlay } = props.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = css("--board") || "#1A1612";
    ctx.fillRect(0, 0, w, h);
    if (!image) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, view.current.ox, view.current.oy, image.naturalWidth * view.current.k, image.naturalHeight * view.current.k);

    if (overlay && overlay.mmPerPx) {
      const s = overlay.mmPerPx, o = overlay.shape;
      const path = (polys) => {
        const p2 = new Path2D();
        polys.forEach((poly) => {
          poly.forEach((p, i) => { const q = toScreen([p[0] / s, p[1] / s]); i ? p2.lineTo(q[0], q[1]) : p2.moveTo(q[0], q[1]); });
          p2.closePath();
        });
        return p2;
      };
      ctx.save();
      ctx.globalAlpha = 0.38; ctx.fillStyle = OVERLAY; ctx.fill(path(o.base), "evenodd");
      ctx.globalAlpha = 0.55; ctx.fill(path(o.rim), "evenodd");
      if (o.logo.length) { ctx.globalAlpha = 0.85; ctx.fillStyle = "#FFF4DA"; ctx.fill(path(o.logo), "evenodd"); }
      ctx.globalAlpha = 1; ctx.strokeStyle = OVERLAY; ctx.lineWidth = 1.5; ctx.stroke(path(o.plate));
      ctx.restore();
    }

    if (outline.length >= 3) {
      const pts = ShoeGeom.catmull(outline, 10);
      ctx.beginPath();
      pts.forEach((p, i) => { const q = toScreen(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
    }

    const rr = rem();
    const handle = (p, fill, label, active, selected, left) => {
      const q = toScreen(p);
      ctx.beginPath(); ctx.arc(q[0], q[1], rr * (selected ? 0.625 : 0.44), 0, 7);
      ctx.fillStyle = fill; ctx.globalAlpha = active ? 1 : 0.55; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = selected ? "#fff" : "rgba(0,0,0,.7)"; ctx.stroke(); ctx.globalAlpha = 1;
      if (label) {
        const off = rr * 0.7, lx = left ? q[0] - off : q[0] + off;
        ctx.font = "600 " + rr * 0.75 + "px " + css("--mono");
        ctx.textAlign = left ? "right" : "left";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.strokeText(label, lx, q[1] - off * 0.8);
        ctx.fillStyle = "#fff"; ctx.fillText(label, lx, q[1] - off * 0.8);
        ctx.textAlign = "left";
      }
    };
    outline.forEach((p, i) => handle(p, "#ffffff", null, mode === "outline", mode === "outline" && i === sel));
    if (scalePts.length === 2) {
      const a = toScreen(scalePts[0]), b = toScreen(scalePts[1]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      ctx.lineWidth = 3; ctx.strokeStyle = "#3fd0ff"; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
    scalePts.forEach((p, i) => handle(p, "#3fd0ff", i ? "100" : "0", mode === "scale", false, !i));
    const names = ["frog tip", "heel A", "heel B"];
    frog.forEach((p, i) => {
      const other = i === 1 ? frog[2] : frog[1];
      handle(p, "#ffd23f", names[i], mode === "frog", false, i > 0 && !!other && p[0] < other[0]);
    });
  }

  function fit() {
    const cv = canvasRef.current, img = props.current.image;
    if (!cv || !img) return;
    const r = cv.getBoundingClientRect();
    view.current.k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight) * 0.96;
    view.current.ox = (r.width - img.naturalWidth * view.current.k) / 2;
    view.current.oy = (r.height - img.naturalHeight * view.current.k) / 2;
    draw();
  }

  // redraw on every render (points, overlay, mode changed)
  useEffect(draw);

  // fit when the photo changes or the parent asks
  useEffect(fit, [image, fitKey]);

  // keep the canvas sized to its box
  useEffect(() => {
    const cv = canvasRef.current;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const r = cv.getBoundingClientRect();
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // gestures
  useEffect(() => {
    const cv = canvasRef.current;
    const ptrs = new Map();
    let gest = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const activeList = () => {
      const p = props.current;
      return p.mode === "scale" ? p.scalePts : p.mode === "frog" ? p.frog : p.outline;
    };
    const hit = (x, y) => {
      let best = -1, bd = rem() * 1.6;
      activeList().forEach((p, i) => { const q = toScreen(p), d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    const down = (e) => {
      if (!props.current.image) return;
      cv.setPointerCapture(e.pointerId);
      const p = pos(e);
      ptrs.set(e.pointerId, p);
      if (ptrs.size === 1) {
        const h = hit(p[0], p[1]);
        gest = { type: h >= 0 ? "drag" : "pending", idx: h, start: p, o0: [view.current.ox, view.current.oy], started: false };
        if (h >= 0 && props.current.mode === "outline") props.current.onSelect(h);
      } else if (ptrs.size === 2) {
        const [a, b] = Array.from(ptrs.values());
        gest = { type: "pinch", d0: Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, k0: view.current.k, m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], o0: [view.current.ox, view.current.oy] };
      }
    };
    const move = (e) => {
      if (!ptrs.has(e.pointerId) || !gest) return;
      const p = pos(e);
      ptrs.set(e.pointerId, p);
      if (gest.type === "pinch" && ptrs.size >= 2) {
        const [a, b] = Array.from(ptrs.values());
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]), m = gest.m0; // zoom stays anchored where the pinch started
        const k = Math.min(40, Math.max(0.02, (gest.k0 * d) / gest.d0));
        const ix = (m[0] - gest.o0[0]) / gest.k0, iy = (m[1] - gest.o0[1]) / gest.k0;
        view.current = { k, ox: m[0] - ix * k, oy: m[1] - iy * k };
        draw();
        return;
      }
      const moved = Math.hypot(p[0] - gest.start[0], p[1] - gest.start[1]);
      if (gest.type === "drag") {
        if (moved < 3 && !gest.started) return;
        if (!gest.started) { props.current.onDragStart(); gest.started = true; }
        props.current.onDrag(gest.idx, toImg(p[0], p[1]));
        return;
      }
      if (gest.type === "pending" && moved > 8) gest.type = "none"; // a swipe isn't a tap
    };
    const up = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      const p = pos(e);
      ptrs.delete(e.pointerId);
      if (gest && gest.type === "pending" && ptrs.size === 0) props.current.onTap(toImg(p[0], p[1]));
      if (gest && gest.type === "drag" && gest.started) props.current.onDragEnd();
      if (ptrs.size === 0) gest = null;
      else if (gest && gest.type === "pinch") gest = { type: "none", start: p };
    };
    const cancel = (e) => { ptrs.delete(e.pointerId); if (!ptrs.size) gest = null; };
    const wheel = (e) => {
      e.preventDefault();
      const p = pos(e), f = Math.exp(-e.deltaY * 0.0015);
      const ix = (p[0] - view.current.ox) / view.current.k, iy = (p[1] - view.current.oy) / view.current.k;
      const k = Math.min(40, Math.max(0.02, view.current.k * f));
      view.current = { k, ox: p[0] - ix * k, oy: p[1] - iy * k };
      draw();
    };
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", cancel);
    cv.addEventListener("wheel", wheel, { passive: false });
    return () => {
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      cv.removeEventListener("pointercancel", cancel);
      cv.removeEventListener("wheel", wheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="board">
      <canvas id="board" ref={canvasRef} aria-label="Sole photo. Tap to place points, drag to move them, pinch to zoom." />
      <div className="badge">{badge}</div>
      <div className="zoomhint">pinch to zoom</div>
    </div>
  );
}
