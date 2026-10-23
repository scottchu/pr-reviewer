import { IconButton } from "./Icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, MeshBasicMaterial, Mesh, Vector3, Shape, ShapeGeometry } from "three";
import { layoutGraph, graphBounds } from "./graph-layout";
const colors = { added: { fill: 2767666, line: 11525571 }, removed: { fill: 4206133, line: 15712208 }, modified: { fill: 4143399, line: 16771992 }, renamed: { fill: 4143399, line: 16771992 }, context: { fill: 2829872, line: 12237751 } };
const status = { added: "+ Added", removed: "− Removed", modified: "~ Modified", renamed: "~ Renamed", context: "Context" };
const roles = { run: "Routes the request", stop: "Reads & saves state", decide: "Continue or stop?", verify: "Checks task status" };
export default function ThreeGraph({ nodes, directed, mobile, relation = "calls", focus, step, follow, replay, onNode, onEdge }) {
  const host = useRef(null), engine = useRef(null), latest = useRef({ focus, step });
  latest.current = { focus, step };
  const [labels, setLabels] = useState([]), [edgeLabels, setEdgeLabels] = useState([]), [zoom, setZoom] = useState(100), [error, setError] = useState("");
  const signature = JSON.stringify(nodes.map((n) => [n.id, n.name, n.file, n.status]));
  const model = useMemo(() => layoutGraph(nodes, directed, mobile), [signature, directed, mobile]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError("WebGL is unavailable. Source components remain available below.");
      return;
    }
    setError("");
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(1974306, 1);
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.prepend(renderer.domElement);
    const scene = new Scene(), camera = new OrthographicCamera(-400, 400, 200, -200, 1, 1e3);
    camera.position.set(0, 0, 100);
    const nodeMeshes = /* @__PURE__ */ new Map(), edgeMeshes = /* @__PURE__ */ new Map();
    const rectangle = (w, h, color, z) => {
      const mesh = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color, transparent: true }));
      mesh.position.z = z;
      scene.add(mesh);
      return mesh;
    };
    for (const node of model.nodes) {
      const palette = colors[node.status] ?? colors.context;
      const outer = rectangle(node.width, node.height, palette.line, 0);
      outer.position.set(node.x, node.y, 0);
      const inner = rectangle(node.width - 3, node.height - 3, palette.fill, 1);
      inner.position.set(node.x, node.y, 1);
      nodeMeshes.set(node.id, { outer, inner });
    }
    for (const edge of model.edges) {
      const dx = edge.end.x - edge.start.x, dy = edge.end.y - edge.start.y, length = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
      const line = rectangle(length - 10, 2, 7633534, 2);
      line.position.set(edge.start.x + dx * (length - 10) / length / 2, edge.start.y + dy * (length - 10) / length / 2, 2);
      line.rotation.z = angle;
      const shape = new Shape();
      shape.moveTo(0, 0);
      shape.lineTo(-12, 7);
      shape.lineTo(-12, -7);
      shape.closePath();
      const arrow = new Mesh(new ShapeGeometry(shape), new MeshBasicMaterial({ color: 7633534 }));
      arrow.position.set(edge.end.x, edge.end.y, 2);
      arrow.rotation.z = angle;
      scene.add(arrow);
      edgeMeshes.set(edge.id, { line, arrow });
    }
    let size = { width: 1, height: 1 }, frame = 0, drag = null;
    function draw() {
      if (!size.width || !size.height) return;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const current = latest.current;
      for (const [id, meshes] of nodeMeshes) {
        const active = current.focus.nodeIds.includes(id);
        meshes.outer.material.opacity = active ? 1 : 0.5;
        meshes.inner.material.opacity = active ? 1 : 0.72;
        meshes.inner.scale.set(active ? 0.975 : 1, active ? 0.96 : 1, 1);
      }
      for (const [id, meshes] of edgeMeshes) {
        const active = id === current.focus.edgeId;
        meshes.line.material.color.setHex(active ? 11525571 : 7633534);
        meshes.arrow.material.color.setHex(active ? 11525571 : 7633534);
        meshes.line.scale.y = active ? 2 : 1;
      }
      renderer.render(scene, camera);
      const project = (x, y) => {
        const p = new Vector3(x, y, 0).project(camera);
        return { x: (p.x + 1) * size.width / 2, y: (1 - p.y) * size.height / 2 };
      };
      setLabels(model.nodes.map((n) => ({ ...n, ...project(n.x, n.y), screenWidth: n.width * camera.zoom, screenHeight: n.height * camera.zoom })).filter((n) => n.x + n.screenWidth / 2 > 0 && n.x - n.screenWidth / 2 < size.width && n.y + n.screenHeight / 2 > 0 && n.y - n.screenHeight / 2 < size.height));
      setEdgeLabels(model.edges.map((e) => ({ ...e, ...project((e.start.x + e.end.x) / 2, (e.start.y + e.end.y) / 2) })).filter((e) => e.x > 0 && e.x < size.width && e.y > 0 && e.y < size.height));
      setZoom(Math.round(camera.zoom * 100));
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    }
    function fit(ids) {
      let chosen = model.nodes.filter((n) => ids?.includes(n.id));
      if (!chosen.length) chosen = model.nodes;
      if (mobile && chosen.length === 1) {
        const i = model.nodes.findIndex((n) => n.id === chosen[0].id);
        chosen = model.nodes.slice(Math.max(0, i - 1), Math.min(model.nodes.length, i + 2));
      }
      const b = graphBounds(chosen);
      camera.position.x = (b.left + b.right) / 2;
      camera.position.y = (b.top + b.bottom) / 2;
      camera.zoom = Math.max(0.35, Math.min(1.15, (size.width - 40) / (b.right - b.left + 20), (size.height - (mobile ? 60 : 24)) / (b.top - b.bottom + 20)));
      schedule();
    }
    const resize = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (!width || !height) return;
      size = { width, height };
      renderer.setSize(width, height, false);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      fit(mobile ? latest.current.focus.nodeIds : void 0);
    });
    resize.observe(element);
    engine.current = { draw: schedule, fit, zoom: (factor) => {
      camera.zoom = Math.max(0.25, Math.min(2, camera.zoom * factor));
      schedule();
    }, pan: (dx, dy) => {
      camera.position.x += dx / camera.zoom;
      camera.position.y += dy / camera.zoom;
      schedule();
    } };
    const down = (e) => {
      if (e.button !== 0 || e.target.closest("button")) return;
      drag = { x: e.clientX, y: e.clientY };
      element.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!drag) return;
      camera.position.x -= (e.clientX - drag.x) / camera.zoom;
      camera.position.y += (e.clientY - drag.y) / camera.zoom;
      drag = { x: e.clientX, y: e.clientY };
      schedule();
    };
    const up = () => {
      drag = null;
    };
    const key = (e) => {
      if (e.target !== element) return;
      const moves = { ArrowLeft: [-35, 0], ArrowRight: [35, 0], ArrowUp: [0, 35], ArrowDown: [0, -35] };
      if (moves[e.key]) {
        e.preventDefault();
        engine.current.pan(...moves[e.key]);
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        engine.current.zoom(1.2);
      }
      if (e.key === "-") {
        e.preventDefault();
        engine.current.zoom(1 / 1.2);
      }
      if (e.key === "Home") {
        e.preventDefault();
        fit();
      }
    };
    const lost = (e) => {
      e.preventDefault();
      setError("The graph graphics context was lost. Reload to restore it; source components are still available.");
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("keydown", key);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("keydown", key);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) {
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      engine.current = null;
    };
  }, [model, mobile]);
  const focusKey = JSON.stringify(focus);
  useEffect(() => {
    if (follow) engine.current?.fit(mobile ? focus.nodeIds : void 0);
    else engine.current?.draw();
  }, [focusKey, step, follow, replay]);
  return <div className="three-graph"><div className="three-toolbar" role="group" aria-label="Graph navigation"><span>{zoom}%</span><IconButton icon="plus" label="Zoom graph in" onClick={() => engine.current?.zoom(1.2)} /><IconButton icon="minus" label="Zoom graph out" onClick={() => engine.current?.zoom(1 / 1.2)} /><IconButton icon="maximize" label="Fit all" onClick={() => engine.current?.fit()} /><IconButton icon="circle-dot" label="Focus" onClick={() => engine.current?.fit(focus.nodeIds)} /></div>
 <div ref={host} className="three-stage" tabIndex="0" role="group" aria-label={`${directed ? relation === "calls" ? "Interactive call graph" : "Interactive component configuration graph" : "Interactive file change map"}. Drag background to pan; arrow keys pan, plus and minus zoom, Home fits all.`}>
 {!error && labels.map((n) => <button key={n.id} className={`three-node ${n.status} ${focus.nodeIds.includes(n.id) ? "focused" : "subdued"} ${n.screenHeight < 70 ? "compact" : ""}`} style={{ left: n.x, top: n.y, width: n.screenWidth, height: n.screenHeight }} onClick={() => onNode(n)} aria-label={`${n.name} ${status[n.status] ?? n.status}`} title={n.file}><small className="three-node-top">{focus.nodeIds.includes(n.id) ? `${step + 1} · ` : ""}{directed && n.id === "decide" ? "Core change · " : ""}{status[n.status] ?? n.status}</small><strong>{n.name}</strong>{directed && <span>{n.role ?? roles[n.id]}</span>}<small>{n.file.split("/").pop()}</small></button>)}
 {!error && edgeLabels.map((e) => <button key={e.id} className={`three-edge-label ${e.id === focus.edgeId ? "active" : ""}`} style={{ left: e.x + (e.vertical ? 42 : 0), top: e.y - (e.vertical ? 0 : 18) }} onClick={() => onEdge(e.id)} aria-label={`Follow ${nodes.find((n) => n.id === e.source)?.name} ${relation === "calls" ? "call to" : "configuration of"} ${nodes.find((n) => n.id === e.target)?.name}`}>{e.id === focus.edgeId ? `${step + 1} · ${relation === "calls" ? e.id < 2 ? "New call" : "Calls" : "Configures"}` : relation}</button>)}
 </div><p className="sr-only graph-help">Drag the background or use arrow keys to pan. Node selection opens source evidence.</p>
 {error && <><p className="notice" role="status">{error}</p><div className="graph-fallback">{nodes.map((n) => <button key={n.id} onClick={() => onNode(n)}>{n.name} · {status[n.status]}</button>)}</div></>}
 </div>;
}
