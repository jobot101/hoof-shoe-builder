import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Brass 3D preview of the shoe. Drag sideways to spin. */
export default function Preview3D({ tris, emptyNote, note = "drag sideways to spin · top face goes against the hoof", compact = false, tilt = -1.05 }) {
  const canvasRef = useRef(null);
  const ctx = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 1, 5000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 0.85));
    const light = new THREE.DirectionalLight(0xffffff, 0.75);
    light.position.set(120, -160, 300);
    scene.add(light);
    const group = new THREE.Group();
    scene.add(group);
    const state = { renderer, scene, cam, group, mesh: null, spin: -0.5, tilt };
    const render = () => { group.rotation.set(state.tilt, 0, state.spin); renderer.render(scene, cam); };
    const size = () => {
      const r = c.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(r.width, r.height, false);
      cam.aspect = r.width / Math.max(1, r.height);
      cam.updateProjectionMatrix();
      render();
    };
    state.render = render;
    state.size = size;
    ctx.current = state;

    let drag = null;
    const down = (e) => { drag = { x: e.clientX, s: state.spin }; c.setPointerCapture(e.pointerId); };
    const move = (e) => { if (!drag) return; state.spin = drag.s + (e.clientX - drag.x) * 0.012; render(); };
    const up = () => { drag = null; };
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
    const ro = new ResizeObserver(size);
    ro.observe(c);
    size();
    return () => {
      ro.disconnect();
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", up);
      c.removeEventListener("pointercancel", up);
      if (state.mesh) state.mesh.geometry.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const s = ctx.current;
    if (!s) return;
    if (s.mesh) { s.group.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh = null; }
    if (tris) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(tris, 3));
      geo.computeVertexNormals();
      s.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color("#C9A048"), roughness: 0.55, metalness: 0 }));
      s.group.add(s.mesh);
      geo.computeBoundingSphere();
      s.cam.position.set(0, 0, geo.boundingSphere.radius * (compact ? 3.2 : 4.1));
      s.cam.lookAt(0, 0, 0);
    }
    s.size();
  }, [tris]);

  return (
    <div className={"view3d" + (compact ? " compact" : "")}>
      <canvas ref={canvasRef} aria-label="3D preview, drag sideways to spin" />
      {!tris && <div className="empty3d">{emptyNote}</div>}
      {note && <div className="note">{note}</div>}
    </div>
  );
}
