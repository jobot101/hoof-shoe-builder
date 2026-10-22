import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShoeGeom from "./lib/shoeGeom.js";
import { TEMPLATE, LOGO_CHOICES, REFERENCE_PRESETS } from "./lib/template.js";
import { MM_PER_IN, lengthParts, lengthText } from "./lib/units.js";
import { makeSampleSole } from "./lib/sample.js";
import { saveFiles, shareFile, canShare, usesNativePicker, pickPhotoNative, isCancel } from "./lib/platform.js";
import { autoTrace, loadOpenCV } from "./lib/autoTrace.js";
import TraceBoard from "./components/TraceBoard.jsx";
import Preview3D from "./components/Preview3D.jsx";

const MODES = [
  { id: "scale", label: "Scale" },
  { id: "outline", label: "Outline" },
  { id: "frog", label: "Frog" },
];

function remember(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    return null;
  }
  return null;
}

function hintFor(mode, unit) {
  if (mode === "scale") return unit === "in" ? "Tap the 0 and 4 slots on the inch edge of the scale stick. The stick has to lie flat against the sole." : "Tap the 0 and 100 slots on the mm edge of the scale stick. The stick has to lie flat against the sole.";
  if (mode === "frog") return "Tap the frog tip, then each spot where the frog meets the heel. Those three points set the V cut.";
  return "Tap around the outside edge of the hoof wall, about every " + (unit === "in" ? "¾–1¼ in" : "20–30 mm") + ". A tap between two points slots in there. Drag any point to adjust.";
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That photo didn't open. Try another one."));
    img.src = src;
  });
}

function printNotes(name, shoe, unit) {
  const L = (mm) => lengthText(mm, unit);
  const d = shoe.dims;
  return [
    "Shoe Builder export: " + name,
    "",
    "STL units are millimetres (Bambu Studio and Handy expect mm).",
    "Size, toe to heel x widest: " + L(d.length) + "  x  " + L(d.width) + ", toe along +Y",
    "Plate: " + L(TEMPLATE.plateT),
    "Rim: " + L(TEMPLATE.rimW) + " wide x " + L(TEMPLATE.rimH) + " tall",
    "Holes: " + shoe.holeCount + " x " + L(TEMPLATE.holeD) + ". Mirrored for print: yes",
    "",
    "Print: flat face on the bed, rim up, no supports.",
    "Material: TPU 95A-98A. 0.4 mm nozzle, 0.2 mm layers, 5 walls, 50% gyroid, 25-35 mm/s.",
    "Then heat-form to the hoof and have your farrier check fit and breakover before work.",
    "",
    "Phone route: upload the STL to MakerWorld as a private model -> Bambu Handy -> your models -> Print.",
  ].join("\n");
}

const REF_DEFAULT = { mm: { value: "100", unit: "mm" }, in: { value: "4", unit: "in" } };

const STICK_NOTES =
  "Scale stick, 124 x 34 x 1.6 mm (4.88 x 1.34 x 0.063 in), raised numbers 0.6 mm.\n" +
  "Top edge: mm scale, 0-100, ticks every 5 mm. Bottom edge: inch scale, 0-4, ticks every 1/4 in.\n" +
  "Print flat in a color that contrasts with the hoof (orange or white PLA/PETG), 0.2 mm layers, no supports. About 10 minutes.\n" +
  "Tape it flat to the sole near the bearing edge, then tap the 0 and 100 slots in the Scale step.\n" +
  "Print it once and reuse it for every horse.";

export default function App() {
  const [unit, setUnitState] = useState(() => (remember("hsb-unit") === "in" ? "in" : "mm"));
  const [mode, setModeState] = useState("outline");
  const [image, setImage] = useState(null);
  const [badge, setBadge] = useState("SAMPLE HOOF");
  const [pts, setPts] = useState({ scalePts: [], outline: [], frog: [] });
  const [sel, setSel] = useState(-1);
  const [history, setHistory] = useState([]);
  const [ref, setRef] = useState(() => REF_DEFAULT[remember("hsb-unit") === "in" ? "in" : "mm"]);
  const [logoPart, setLogoPart] = useState(0);
  const [fitKey, setFitKey] = useState(0);
  const [result, setResult] = useState({ shoe: null, tris: null, error: "" });
  const [photoError, setPhotoError] = useState("");
  const [saveMsg, setSaveMsg] = useState({ text: "", kind: "" });
  const dragging = useRef(false);
  const sampleRef = useRef(null);
  const [auto, setAuto] = useState({ armed: false, busy: false, text: "", kind: "" });
  const fileInput = useRef(null);

  // open on the drawn sample sole so the tool shows what it does
  useEffect(() => {
    const s = makeSampleSole();
    loadImage(s.src).then((img) => {
      setImage(img);
      setPts({ scalePts: unit === "in" ? s.scaleIN : s.scaleMM, outline: s.outline, frog: s.frog });
      sampleRef.current = s;
    });
  }, []);

  const refMM = useMemo(() => {
    const v = parseFloat(ref.value);
    if (!(v > 0)) return 0;
    return ref.unit === "in" ? v * MM_PER_IN : v;
  }, [ref]);

  const mmPerPx = useMemo(() => {
    if (pts.scalePts.length < 2) return 0;
    const [a, b] = pts.scalePts;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return d > 2 && refMM > 0 ? refMM / d : 0;
  }, [pts.scalePts, refMM]);

  const missing = useMemo(() => {
    const m = [];
    if (!mmPerPx) m.push("set the scale (2 points on the scale stick)");
    if (pts.outline.length < 6) m.push("trace at least 6 outline points");
    if (pts.frog.length < 3) m.push("mark the frog tip and both heels");
    return m;
  }, [mmPerPx, pts]);

  // rebuild the shoe shortly after anything changes (longer pause while a point is being dragged)
  useEffect(() => {
    if (missing.length) { setResult({ shoe: null, tris: null, error: "" }); return; }
    const t = setTimeout(() => {
      const sc = (p) => [p[0] * mmPerPx, p[1] * mmPerPx];
      const P = { ...TEMPLATE, logoPart: Math.max(0, logoPart), logoOn: logoPart >= 0 };
      try {
        const shoe = ShoeGeom.build({ outline: pts.outline.map(sc), apex: sc(pts.frog[0]), heelA: sc(pts.frog[1]), heelB: sc(pts.frog[2]) }, P);
        setResult({ shoe, tris: ShoeGeom.mesh(shoe, P.mirror), error: "" });
      } catch (e) {
        setResult({ shoe: null, tris: null, error: e.message || "Couldn't build that outline. Check for crossed points." });
      }
    }, dragging.current ? 220 : 60);
    return () => clearTimeout(t);
  }, [pts, mmPerPx, logoPart, missing]);

  const snapshot = useCallback(() => {
    setHistory((h) => [...h.slice(-79), pts]);
  }, [pts]);

  const undo = () => {
    if (!history.length) return;
    setPts(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setSel(-1);
  };

  const setMode = (m) => { setModeState(m); setSel(-1); };

  // the unit picks which edge of the scale stick you tap: mm edge 0-100 or inch edge 0-4
  const setUnit = (u) => {
    if (u === unit) return;
    setRef(REF_DEFAULT[u]);
    if (badge === "SAMPLE HOOF" && sampleRef.current) {
      setPts((cur) => ({ ...cur, scalePts: u === "in" ? sampleRef.current.scaleIN : sampleRef.current.scaleMM }));
    }
    setUnitState(u);
    remember("hsb-unit", u);
  };

  const nearest = (list, p) => {
    let b = 0, bd = Infinity;
    list.forEach((q, i) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; b = i; } });
    return b;
  };

  const runAutoTrace = async (seed) => {
    setAuto({ armed: false, busy: true, text: "Finding the hoof edge…", kind: "" });
    try {
      const r = await autoTrace(image, seed, mmPerPx, pts.scalePts);
      snapshot();
      const keepFrog = pts.frog.length === 3 && badge === "SAMPLE HOOF";
      setPts({ ...pts, outline: r.outline, frog: keepFrog ? pts.frog : r.frog });
      setSel(-1);
      setAuto({ armed: false, busy: false, kind: "ok",
        text: "Traced. Drag any point that's off the wall" + (keepFrog ? "." : ", then check the frog points in the Frog step (they're a first guess, toe at the top).") });
    } catch (e) {
      setAuto({ armed: false, busy: false, kind: "err", text: e.message || String(e) });
    }
  };

  const armAutoTrace = () => {
    setMode("outline");
    setAuto({ armed: true, busy: false, text: "Tap the middle of the hoof sole.", kind: "" });
    loadOpenCV().catch(() => {});
  };

  const onTap = (p) => {
    if (auto.armed) { runAutoTrace(p); return; }
    snapshot();
    const cur = pts;
    if (mode === "scale") {
      const s = cur.scalePts.slice();
      if (s.length < 2) s.push(p); else s[nearest(s, p)] = p;
      setPts({ ...cur, scalePts: s });
      if (s.length === 2 && cur.scalePts.length === 1 && !cur.outline.length) setMode("outline"); // next: auto trace
      return;
    }
    if (mode === "frog") {
      const f = cur.frog.slice();
      if (f.length < 3) f.push(p); else f[nearest(f, p)] = p;
      setPts({ ...cur, frog: f });
      return;
    }
    const L = cur.outline.slice();
    let at = L.length;
    if (L.length >= 3) {
      let best = 0, bc = Infinity;
      for (let i = 0; i < L.length; i++) {
        const a = L[i], b = L[(i + 1) % L.length];
        const cost = Math.hypot(p[0] - a[0], p[1] - a[1]) + Math.hypot(p[0] - b[0], p[1] - b[1]) - Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (cost < bc) { bc = cost; best = i; }
      }
      at = best + 1;
    }
    L.splice(at, 0, p);
    setPts({ ...cur, outline: L });
    setSel(at);
  };

  const listKey = mode === "scale" ? "scalePts" : mode === "frog" ? "frog" : "outline";
  const onDragStart = () => { snapshot(); dragging.current = true; };
  const onDrag = (idx, p) => setPts((cur) => {
    const list = cur[listKey].slice();
    list[idx] = p;
    return { ...cur, [listKey]: list };
  });
  const onDragEnd = () => { dragging.current = false; setPts((cur) => ({ ...cur })); };

  const removePoint = () => {
    if (mode !== "outline" || sel < 0) return;
    snapshot();
    setPts((cur) => ({ ...cur, outline: cur.outline.filter((_, i) => i !== sel) }));
    setSel(-1);
  };
  const clearStep = () => {
    snapshot();
    setPts((cur) => ({ ...cur, [listKey]: [] }));
    setSel(-1);
  };

  const startNewPhoto = async (src, label) => {
    try {
      const img = await loadImage(src);
      setImage(img);
      setBadge(label.slice(0, 28).toUpperCase());
      setPts({ scalePts: [], outline: [], frog: [] });
      setHistory([]);
      setSel(-1);
      setPhotoError("");
      setAuto({ armed: false, busy: false, text: "", kind: "" });
      setMode("scale");
    } catch (e) {
      setPhotoError(e.message);
    }
  };

  const onPhotoButton = async (e) => {
    if (!usesNativePicker) return; // the file input handles it
    e.preventDefault();
    try {
      const src = await pickPhotoNative();
      if (src) startNewPhoto(src, "Sole photo");
    } catch (err) {
      if (!isCancel(err)) setPhotoError("Couldn't open the camera: " + (err.message || err));
    }
  };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) startNewPhoto(URL.createObjectURL(f), f.name);
    e.target.value = "";
  };

  const shoeFiles = () => {
    const { shoe, tris } = result;
    const name = "shoe_" + Math.round(shoe.dims.length) + "x" + Math.round(shoe.dims.width) + "mm";
    return [
      { name: name + ".stl", data: ShoeGeom.stl(tris) },
      { name: name + "_print-notes.txt", data: printNotes(name, shoe, unit) },
    ];
  };

  const onSave = async () => {
    if (!result.tris) return;
    const files = shoeFiles();
    setSaveMsg({ text: "Saving " + files[0].name + "…", kind: "" });
    try {
      const where = await saveFiles(files);
      setSaveMsg({ text: "Saved " + files[0].name + " to " + where + ".", kind: "ok" });
    } catch (e) {
      setSaveMsg({ text: e.message || String(e), kind: "err" });
    }
  };

  const onShare = async () => {
    if (!result.tris) return;
    const f = shoeFiles()[0];
    try {
      const where = await shareFile(f);
      setSaveMsg(where ? { text: "Saved " + f.name + " to " + where + ".", kind: "ok" } : { text: "", kind: "" });
    } catch (e) {
      if (!isCancel(e)) setSaveMsg({ text: "Couldn't share: " + (e.message || e), kind: "err" });
    }
  };

  const stickTris = useMemo(() => ShoeGeom.card(), []);
  const [stickMsg, setStickMsg] = useState({ text: "", kind: "" });
  const onSaveStick = async () => {
    setStickMsg({ text: "Saving scale-stick_100mm.stl…", kind: "" });
    try {
      const where = await saveFiles([
        { name: "scale-stick_100mm.stl", data: ShoeGeom.stl(stickTris) },
        { name: "scale-stick_notes.txt", data: STICK_NOTES },
      ]);
      setStickMsg({ text: "Saved scale-stick_100mm.stl to " + where + ". Print it the same way as a shoe.", kind: "ok" });
    } catch (e) {
      setStickMsg({ text: e.message || String(e), kind: "err" });
    }
  };

  const done = { scale: !!mmPerPx, outline: pts.outline.length >= 6, frog: pts.frog.length === 3 };
  const overlay = result.shoe && mmPerPx ? { mmPerPx, shape: result.shoe.overlay } : null;
  const dims = result.shoe ? result.shoe.dims : null;
  const Len = ({ mm }) => {
    const [main, other] = lengthParts(mm, unit);
    return <b>{main}<small>{other}</small></b>;
  };

  return (
    <div className="wrap">
      <header>
        <div className="titles">
          <p className="maker">Ragamuffin Studios</p>
          <h1>Shoe Builder</h1>
          <p>Photo the trimmed sole with the scale stick taped flat to it. Trace the wall, mark the frog, and save a print-ready shoe.</p>
        </div>
        <div className="units" role="group" aria-label="Units">
          {["mm", "in"].map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}>{u}</button>
          ))}
        </div>
      </header>

      <section className="panel" aria-labelledby="h-stick">
        <h2 id="h-stick"><span className="step">01</span>Print the scale stick</h2>
        <p className="fine">You only need one. Print it, tape it flat to the sole for each photo, and the app reads the real size from it.</p>
        <Preview3D tris={stickTris} compact tilt={-0.32} spin={0} note="mm edge 0–100 · inch edge 0–4 · 124 × 34 mm" />
        <button className="btn primary big" type="button" onClick={onSaveStick}>Save scale stick for printing</button>
        <p className={"msg" + (stickMsg.kind ? " " + stickMsg.kind : "")} role="status">{stickMsg.text}</p>
      </section>

      <section className="panel" aria-labelledby="h-trace">
        <h2 id="h-trace"><span className="step">02</span>Trace the sole</h2>
        <div className="tools">
          <label className="btn primary file" onClick={onPhotoButton}>
            Take or choose photo
            <input id="photo" ref={fileInput} type="file" accept="image/*" onChange={onFile} />
          </label>
          <button className="btn" type="button" onClick={() => setFitKey((k) => k + 1)}>Fit view</button>
        </div>
        <div className="seg" role="group" aria-label="What a tap marks">
          {MODES.map((m) => (
            <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              <i className={"dot" + (done[m.id] ? " done" : "")} />{m.label}
            </button>
          ))}
        </div>
        <p className="hint">{auto.armed ? "Tap the middle of the hoof sole. The app finds the wall and places the outline points for you." : hintFor(mode, unit)}</p>
        <TraceBoard
          image={image}
          badge={badge}
          mode={mode}
          scalePts={pts.scalePts}
          scaleLabel={ref.value + (ref.unit === "in" ? " in" : "")}
          outline={pts.outline}
          frog={pts.frog}
          sel={sel}
          overlay={overlay}
          fitKey={fitKey}
          onTap={onTap}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onSelect={setSel}
        />
        {mode === "scale" && (
          <div className="scale-row">
            <span className="label">Reference length</span>
            <input id="refLen" type="number" inputMode="decimal" min="1" step="0.1" value={ref.value} onChange={(e) => setRef({ ...ref, value: e.target.value })} />
            <select id="refUnit" value={ref.unit} onChange={(e) => setRef({ ...ref, unit: e.target.value })}>
              <option value="mm">mm</option>
              <option value="in">in</option>
            </select>
            {REFERENCE_PRESETS.map((r) => (
              <button key={r.label} className="chip" type="button" onClick={() => setRef({ value: String(r.value), unit: r.unit })}>{r.label}</button>
            ))}
            <p className="fine ruler-note">
              No scale stick? A regular ruler works. Lay it flat across the hoof wall at heel height, tap two marks at least {unit === "in" ? "4 in (100 mm)" : "100 mm (4 in)"} apart, and type the distance between them above.
            </p>
          </div>
        )}
        {mode === "outline" && (
          <button className="btn primary big" type="button" onClick={armAutoTrace} disabled={auto.busy || !image}>
            {auto.busy ? "Tracing…" : auto.armed ? "Now tap the hoof" : "Auto trace the outline"}
          </button>
        )}
        {auto.text && <p className={"msg" + (auto.kind ? " " + auto.kind : "")} role="status">{auto.text}</p>}
        <div className="tools">
          <button className="btn" type="button" onClick={undo} disabled={!history.length}>Undo</button>
          <button className="btn" type="button" onClick={removePoint} disabled={!(mode === "outline" && sel >= 0)}>Remove point</button>
          <button className="btn" type="button" onClick={clearStep}>Clear this step</button>
        </div>
        {photoError && <p className="msg err">{photoError}</p>}
      </section>

      <section className="panel" aria-labelledby="h-logo">
        <h2 id="h-logo"><span className="step">03</span>Pick the logo</h2>
        <div className="seg choice logos" role="group" aria-label="Logo on the shoe" style={{ gridTemplateColumns: "repeat(" + LOGO_CHOICES.length + ", 1fr)" }}>
          {LOGO_CHOICES.map((c) => (
            <button key={c.value} type="button" aria-pressed={logoPart === c.value} onClick={() => setLogoPart(c.value)}>{c.label}</button>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="h-out">
        <h2 id="h-out"><span className="step">04</span>Check and save</h2>
        <Preview3D tris={result.tris} emptyNote={missing.length ? "To build the shoe: " + missing.join(", ") + "." : ""} />
        <div className="dims">
          <div className="stat">{dims ? <Len mm={dims.length} /> : <b>–</b>}<span>toe to heel</span></div>
          <div className="stat">{dims ? <Len mm={dims.width} /> : <b>–</b>}<span>widest</span></div>
        </div>
        {result.error && <p className="msg err">{result.error}</p>}
        <button className="btn primary big" type="button" onClick={onSave} disabled={!result.tris}>Save shoe for printing</button>
        {canShare && <div className="tools"><button className="btn" type="button" onClick={onShare} disabled={!result.tris}>Share STL…</button></div>}
        <p className={"msg" + (saveMsg.kind ? " " + saveMsg.kind : "")} role="status">{saveMsg.text}</p>
        <div>
          <div className="label" style={{ marginBottom: ".5rem" }}>Getting it to the Bambu from your phone</div>
          <ol className="route">
            <li>Save the shoe. It lands in your phone's Files or Downloads.</li>
            <li>On <a href="https://makerworld.com" target="_blank" rel="noopener noreferrer">makerworld.com</a>, upload the STL as a private model.</li>
            <li>In Bambu Handy, open your models, pick it, choose your TPU, and print.</li>
          </ol>
          <p className="fine" style={{ marginTop: ".5rem" }}>Handy slices in the cloud with stock settings. For tuned TPU settings, slice it once in Bambu Studio and attach that 3MF as the model's print profile; prints from Handy then use it.</p>
        </div>
      </section>
    </div>
  );
}
