/**
 * Motor three.js do gêmeo digital. Renderiza sob demanda (câmera, seleção, estilo) e só anima o fluxo
 * e o pulso de itens críticos quando permitido (interativo, visível na tela, sem prefers-reduced-motion).
 * three.js só pode ser importado dentro de viz/scene3d/ (o módulo é carregado sob demanda).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Scene3DProps } from '../../editor/doc';
import type { NetLink, NetStatus } from '../../net/generate';
import { hash } from '../../net/generate';
import { LOS_DEMO, losDemo, terrain } from '../../net/los';
import { type Area, type AreaNode, groundAt, toLocal } from './area';
import { STATUS_WORD, fmt, type Palette } from './format';

export type LayerKey = keyof Scene3DProps['layers'];
export type Perspective = Scene3DProps['perspective'];
const LAYER_KEYS: LayerKey[] = ['terreno', 'edificios', 'torres', 'fibras', 'cobertura', 'visada', 'fluxo'];

interface LinkPath { link: NetLink; pts: Float32Array; cum: Float32Array; len: number }
interface Label { el: HTMLDivElement; status: HTMLSpanElement | null; x: number; y: number; z: number; layer: LayerKey; id: string | null }
interface Tween { p0: THREE.Vector3; p1: THREE.Vector3; t0v: THREE.Vector3; t1v: THREE.Vector3; start: number; dur: number }

// temporários reaproveitados (sem alocação por quadro)
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3();
const _c = new THREE.Color(), _ndc = new THREE.Vector2(), _sa = new THREE.Vector3(), _sb = new THREE.Vector3();
const SPEED = 42; // m/s do fluxo
const PI = Math.PI;

function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
  });
}
function clearGroup(g: THREE.Group) { for (const c of [...g.children]) { g.remove(c); disposeTree(c); } }

export class Scene3DEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 4, 80_000);
  private controls: OrbitControls | null = null;
  private target = new THREE.Vector3();
  private groups = {} as Record<LayerKey, THREE.Group>;
  private dyn = new THREE.Group(); // seleção (sempre visível)
  private area: Area | null = null;
  private palette: Palette | null = null;
  private statusOf: (id: string) => NetStatus = () => 'normal';
  private layerOn: Record<LayerKey, boolean> = { terreno: true, edificios: true, torres: true, fibras: true, cobertura: true, visada: true, fluxo: true };
  private w = 1; private h = 1;
  private raf = 0; private dirty = false; private disposed = false;
  private visible = true; private animAllowed = false; private lastAnim = 0;
  private tween: Tween | null = null;
  private perspective: Perspective = 'orbital';
  private raycaster = new THREE.Raycaster();

  // objetos por construção
  private mats: Record<string, THREE.Material> = {};
  private terrainMesh: THREE.Mesh | null = null;
  private buildings: THREE.InstancedMesh | null = null; private bJitter = new Float32Array(0);
  private nodeMeshes: { mesh: THREE.InstancedMesh; ids: string[] }[] = [];
  private paths: LinkPath[] = [];
  private pathById = new Map<string, LinkPath>();
  private lineObjs: { obj: THREE.LineSegments; segLink: Int32Array }[] = [];
  private flow: THREE.Points | null = null; private flowLink = new Int32Array(0); private flowPhase = new Float32Array(0);
  private pulse: THREE.InstancedMesh | null = null;
  private selRing: THREE.Mesh | null = null; private selTube: THREE.Mesh | null = null;
  private picked: string | null = null;
  private losObjs: { blocked: THREE.Object3D[]; relay: THREE.Object3D[]; marker: THREE.Object3D[] } = { blocked: [], relay: [], marker: [] };
  private labels: Label[] = [];

  constructor(private host: HTMLElement, private labelHost: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.domElement.className = 's3d-canvas';
    host.appendChild(this.renderer.domElement);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa0a8, PI * 0.62);
    const sun = new THREE.DirectionalLight(0xffffff, PI * 0.42);
    sun.position.set(-0.6, 1.6, 0.9);
    this.scene.add(hemi, sun);
    for (const k of LAYER_KEYS) { const g = new THREE.Group(); g.name = k; this.groups[k] = g; this.scene.add(g); }
    this.scene.add(this.dyn);
  }

  // ---------- ciclo de vida ----------
  dispose() {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.controls?.dispose();
    for (const k of LAYER_KEYS) clearGroup(this.groups[k]);
    clearGroup(this.dyn);
    for (const l of this.labels) l.el.remove();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
  resize(w: number, h: number) {
    this.w = Math.max(1, w); this.h = Math.max(1, h);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h; this.camera.updateProjectionMatrix();
    if (this.flow) (this.flow.material as THREE.PointsMaterial).size = 3 * this.renderer.getPixelRatio();
    this.requestRender();
  }
  setVisible(v: boolean) { this.visible = v; if (v) this.requestRender(); }
  setAnimationAllowed(v: boolean) {
    this.animAllowed = v;
    if (!v && this.pulse) { (this.pulse.material as THREE.MeshBasicMaterial).opacity = 0.32; this.requestRender(); }
    if (v) this.schedule();
  }
  requestRender() { this.dirty = true; this.schedule(); }
  private schedule() { if (!this.raf && !this.disposed) this.raf = requestAnimationFrame(this.frame); }

  private frame = (now: number) => {
    this.raf = 0;
    let again = false;
    if (this.tween) {
      const tw = this.tween, k = Math.min(1, (now - tw.start) / tw.dur), e = ease(k);
      this.camera.position.lerpVectors(tw.p0, tw.p1, e);
      this.target.lerpVectors(tw.t0v, tw.t1v, e);
      if (this.controls) this.controls.target.copy(this.target);
      this.camera.lookAt(this.target);
      if (k >= 1) this.tween = null; else again = true;
      this.dirty = true;
    }
    if (this.controls && !this.tween && this.controls.update()) { this.dirty = true; again = true; }
    if (this.animating()) {
      if (now - this.lastAnim >= 33) { this.updateAnim(now / 1000); this.lastAnim = now; this.dirty = true; }
      again = true;
    }
    if (this.dirty && this.visible) { this.renderer.render(this.scene, this.camera); this.updateLabels(); this.dirty = false; }
    if (again && this.visible) this.schedule();
  };
  private animating() {
    if (!this.animAllowed || !this.visible) return false;
    const flow = !!this.flow && this.flowLink.length > 0 && this.layerOn.fluxo && this.layerOn.fibras;
    const pulse = !!this.pulse && this.pulse.count > 0 && this.layerOn.torres;
    return flow || pulse;
  }
  private updateAnim(t: number) {
    if (this.pulse) (this.pulse.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.22 * (0.5 + 0.5 * Math.sin((t * 2 * PI) / 2.6));
    const f = this.flow;
    if (!f || !this.layerOn.fluxo) return;
    const attr = f.geometry.getAttribute('position') as THREE.BufferAttribute, arr = attr.array as Float32Array;
    for (let i = 0; i < this.flowLink.length; i++) {
      const lp = this.paths[this.flowLink[i]!]; if (!lp) continue;
      const s = (((this.flowPhase[i] ?? 0) * lp.len + t * SPEED) % lp.len + lp.len) % lp.len;
      let lo = 0, hi = lp.cum.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if ((lp.cum[mid] ?? 0) <= s) lo = mid; else hi = mid; }
      const c0 = lp.cum[lo] ?? 0, c1 = lp.cum[hi] ?? c0, u = c1 > c0 ? (s - c0) / (c1 - c0) : 0, P = lp.pts;
      arr[i * 3] = (P[lo * 3] ?? 0) + ((P[hi * 3] ?? 0) - (P[lo * 3] ?? 0)) * u;
      arr[i * 3 + 1] = (P[lo * 3 + 1] ?? 0) + ((P[hi * 3 + 1] ?? 0) - (P[lo * 3 + 1] ?? 0)) * u + 1.5;
      arr[i * 3 + 2] = (P[lo * 3 + 2] ?? 0) + ((P[hi * 3 + 2] ?? 0) - (P[lo * 3 + 2] ?? 0)) * u;
    }
    attr.needsUpdate = true;
  }

  // ---------- interação ----------
  setInteractive(on: boolean) {
    if (on && !this.controls) {
      const c = new OrbitControls(this.camera, this.renderer.domElement);
      c.enableDamping = true; c.dampingFactor = 0.12; c.minDistance = 60; c.maxDistance = 14_000;
      c.maxPolarAngle = PI / 2 - 0.03; c.screenSpacePanning = false; c.zoomToCursor = true;
      c.target.copy(this.target);
      c.addEventListener('change', () => this.requestRender());
      c.addEventListener('start', () => { this.tween = null; });
      this.controls = c;
    } else if (!on && this.controls) { this.controls.dispose(); this.controls = null; }
    this.requestRender();
  }
  setLayers(l: Scene3DProps['layers']) {
    for (const k of LAYER_KEYS) { this.layerOn[k] = !!l[k]; this.groups[k].visible = !!l[k]; }
    if (this.flow) this.flow.visible = this.layerOn.fluxo && this.layerOn.fibras;
    this.requestRender(); this.schedule();
  }

  private pose(p: Perspective) {
    const a = this.area!;
    const f = a.byId.get(a.focusId);
    const fx = f?.x ?? 0, fz = f?.z ?? 0, fg = f?.ground ?? groundAt(a, 0, 0), fh = f?.height ?? 30;
    // olha a partir do lado oposto à torre do par de visada, para que ambas entrem no quadro
    let az = 0.55;
    const to = a.byId.get(LOS_DEMO.to);
    if (to && LOS_DEMO.from === a.focusId) az = Math.atan2(fx - to.x, fz - to.z) + 0.5;
    const target = new THREE.Vector3(fx, fg + fh * 0.5, fz), pos = new THREE.Vector3();
    if (p === 'topo') { target.y = fg; pos.set(fx, fg + 9000, fz + 2); } // norte para cima
    else if (p === 'rua') {
      const d = 420, x = fx + Math.sin(az) * d, z = fz + Math.cos(az) * d;
      target.y = fg + fh * 0.75; pos.set(x, groundAt(a, x, z) + 24, z);
    } else {
      const d = 3000, pol = 0.98;
      pos.set(fx + Math.sin(pol) * Math.sin(az) * d, fg + Math.cos(pol) * d, fz + Math.sin(pol) * Math.cos(az) * d);
    }
    return { pos, target };
  }
  view(p: Perspective, animate: boolean) {
    this.perspective = p;
    if (!this.area) return;
    const { pos, target } = this.pose(p);
    this.moveTo(pos, target, animate);
  }
  focusOn(id: string, animate: boolean) {
    const an = this.area?.byId.get(id);
    const lp = this.pathById.get(id);
    let tgt: THREE.Vector3, dist: number;
    if (an) { tgt = new THREE.Vector3(an.x, an.ground + an.height * 0.6, an.z); dist = an.node.tipo === 'Equipamento' ? 260 : 620; }
    else if (lp) {
      const n = lp.pts.length / 3, mid = Math.floor(n / 2);
      tgt = new THREE.Vector3(lp.pts[mid * 3] ?? 0, lp.pts[mid * 3 + 1] ?? 0, lp.pts[mid * 3 + 2] ?? 0);
      dist = Math.max(500, lp.len * 0.9);
    } else return;
    const dir = _v.copy(this.camera.position).sub(this.target);
    if (dir.lengthSq() < 1) dir.set(0.4, 0.7, 0.6);
    dir.normalize();
    if (this.perspective === 'rua') { dir.y = Math.min(dir.y, 0.25); dir.normalize(); }
    this.moveTo(tgt.clone().addScaledVector(dir, dist), tgt, animate);
  }
  private moveTo(pos: THREE.Vector3, target: THREE.Vector3, animate: boolean) {
    if (animate) {
      this.tween = { p0: this.camera.position.clone(), p1: pos, t0v: this.target.clone(), t1v: target, start: performance.now(), dur: 250 };
    } else {
      this.tween = null; this.camera.position.copy(pos); this.target.copy(target); this.camera.lookAt(target);
      if (this.controls) { this.controls.target.copy(target); this.controls.update(); }
    }
    this.requestRender();
  }

  /** Retorna o id do nó ou enlace sob o ponteiro, ou null. */
  hitTest(clientX: number, clientY: number): string | null {
    if (!this.area) return null;
    const r = this.renderer.domElement.getBoundingClientRect();
    _ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(_ndc, this.camera);
    // nós: teste em espaço de tela contra o segmento base→topo (tolerância em px, independe do zoom)
    if (this.layerOn.torres) {
      const px = clientX - r.left, py = clientY - r.top;
      let best: { d: number; z: number; id: string } | null = null;
      for (const an of this.area.nodes) {
        this.toScreen(an.x, an.ground, an.z, _sa); this.toScreen(an.x, an.ground + an.height, an.z, _sb);
        if (_sa.z > 1 || _sb.z > 1) continue;
        const dx = _sb.x - _sa.x, dy = _sb.y - _sa.y, L2 = dx * dx + dy * dy;
        const t = L2 > 0 ? Math.max(0, Math.min(1, ((px - _sa.x) * dx + (py - _sa.y) * dy) / L2)) : 0;
        const d = Math.hypot(px - (_sa.x + dx * t), py - (_sa.y + dy * t));
        const tol = an.node.tipo === 'Equipamento' ? 6 : an.node.tipo === 'POP' ? 12 : 10;
        if (d <= tol && (!best || d < best.d - 2 || (Math.abs(d - best.d) <= 2 && _sa.z < best.z))) best = { d, z: _sa.z, id: an.node.id };
      }
      if (best) return best.id;
    }
    if (this.layerOn.fibras) {
      this.raycaster.params.Line = { threshold: Math.max(4, this.camera.position.distanceTo(this.target) * 0.006) };
      let best: { d: number; id: string } | null = null;
      for (const lo of this.lineObjs) {
        const hit = this.raycaster.intersectObject(lo.obj, false)[0];
        if (hit && hit.index !== undefined && (!best || hit.distance < best.d)) {
          const li = lo.segLink[Math.floor(hit.index / 2)], lp = li !== undefined ? this.paths[li] : undefined;
          if (lp) best = { d: hit.distance, id: lp.link.id };
        }
      }
      if (best) return best.id;
    }
    return null;
  }

  private toScreen(x: number, y: number, z: number, out: THREE.Vector3) {
    out.set(x, y, z).project(this.camera);
    out.set(((out.x + 1) / 2) * this.w, ((1 - out.y) / 2) * this.h, out.z);
  }

  setPicked(id: string | null) {
    this.picked = id;
    if (this.selTube) { this.dyn.remove(this.selTube); disposeTree(this.selTube); this.selTube = null; }
    if (this.selRing) this.selRing.visible = false;
    const an = id ? this.area?.byId.get(id) : undefined;
    const lp = id ? this.pathById.get(id) : undefined;
    const col = this.palette?.title ?? '#1a1d22';
    if (an && this.selRing) {
      const s = an.node.tipo === 'POP' ? 1.5 : an.node.tipo === 'Equipamento' ? 0.4 : 1;
      this.selRing.position.set(an.x, an.ground + 2, an.z); this.selRing.scale.setScalar(s); this.selRing.visible = true;
      (this.selRing.material as THREE.MeshBasicMaterial).color.setStyle(col);
    } else if (lp) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < lp.pts.length; i += 3) pts.push(new THREE.Vector3(lp.pts[i], (lp.pts[i + 1] ?? 0) + 1, lp.pts[i + 2]));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0);
      this.selTube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(400, pts.length * 2), 4.5, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 }));
      this.dyn.add(this.selTube);
    }
    this.requestRender();
  }

  // ---------- construção ----------
  build(area: Area) {
    for (const k of LAYER_KEYS) clearGroup(this.groups[k]);
    clearGroup(this.dyn);
    for (const l of this.labels) l.el.remove();
    this.labels = []; this.nodeMeshes = []; this.lineObjs = []; this.paths = []; this.pathById.clear();
    this.flow = null; this.pulse = null; this.selRing = null; this.selTube = null; this.buildings = null; this.terrainMesh = null;
    this.losObjs = { blocked: [], relay: [], marker: [] };
    this.mats = {};
    this.area = area;
    this.buildTerrain(area);
    this.buildBuildings(area);
    this.buildNodes(area);
    this.buildPaths(area);
    this.buildCoverage(area);
    this.buildLos(area);
    this.buildLabels(area);
    const ring = new THREE.RingGeometry(26, 29.5, 48); ring.rotateX(-PI / 2);
    this.selRing = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, depthWrite: false }));
    this.selRing.visible = false; this.dyn.add(this.selRing);
    for (const k of LAYER_KEYS) this.groups[k].visible = this.layerOn[k];
    if (this.palette) this.restyle(this.palette, this.statusOf);
    this.view(this.perspective, false);
    if (this.picked) this.setPicked(this.picked);
  }

  private buildTerrain(a: Area) {
    const N = a.N, W = N + 1, R = a.R, st = a.step;
    const pos = new Float32Array(W * W * 3);
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const k = j * W + i; pos[k * 3] = -R + i * st; pos[k * 3 + 1] = a.sceneY[k] ?? 0; pos[k * 3 + 2] = -R + j * st; }
    const idx = new Uint32Array(N * N * 6);
    let q = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const p0 = j * W + i, p1 = p0 + 1, p2 = p0 + W, p3 = p2 + 1; idx[q++] = p0; idx[q++] = p2; idx[q++] = p1; idx[q++] = p1; idx[q++] = p2; idx[q++] = p3; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    const land = this.mats.land = new THREE.MeshLambertMaterial({ color: 0xeeeeee, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    this.terrainMesh = new THREE.Mesh(g, land);
    this.groups.terreno.add(this.terrainMesh);

    // saia lateral: bloco de levantamento topográfico
    const sk: number[] = [], bottom = -40;
    const edge = (fx: (t: number) => [number, number, number]) => { for (let t = 0; t < N; t++) { const [x0, y0, z0] = fx(t), [x1, y1, z1] = fx(t + 1); sk.push(x0, y0, z0, x0, bottom, z0, x1, y1, z1, x1, y1, z1, x0, bottom, z0, x1, bottom, z1); } };
    const Y = (i: number, j: number) => a.sceneY[j * W + i] ?? 0;
    edge((t) => [-R + t * st, Y(t, 0), -R]); edge((t) => [-R + t * st, Y(t, N), R]); edge((t) => [-R, Y(0, t), -R + t * st]); edge((t) => [R, Y(N, t), -R + t * st]);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sk, 3));
    this.groups.terreno.add(new THREE.Mesh(sg, this.mats.skirt = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide })));

    // curvas de nível a cada 10 m (mestras a cada 50 m)
    const H = a.heights, minor: number[] = [], major: number[] = [];
    const ex = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let L = Math.ceil(a.minH / 10) * 10; L <= a.maxH; L += 10) {
      const out = L % 50 === 0 ? major : minor, y = (L - a.base) * a.exag + 1.2;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const h0 = H[j * W + i] ?? 0, h1 = H[j * W + i + 1] ?? 0, h2 = H[(j + 1) * W + i + 1] ?? 0, h3 = H[(j + 1) * W + i] ?? 0;
        const code = (h0 > L ? 1 : 0) | (h1 > L ? 2 : 0) | (h2 > L ? 4 : 0) | (h3 > L ? 8 : 0);
        if (code === 0 || code === 15) continue;
        const x0 = -R + i * st, z0 = -R + j * st;
        let n = 0;
        const cross = (ha: number, hb: number, xa: number, za: number, xb: number, zb: number) => {
          if ((ha > L) === (hb > L)) return; const t = (L - ha) / (hb - ha); ex[n++] = xa + (xb - xa) * t; ex[n++] = za + (zb - za) * t;
        };
        cross(h0, h1, x0, z0, x0 + st, z0); cross(h1, h2, x0 + st, z0, x0 + st, z0 + st); cross(h2, h3, x0 + st, z0 + st, x0, z0 + st); cross(h3, h0, x0, z0 + st, x0, z0);
        for (let s = 0; s + 3 < n; s += 4) out.push(ex[s]!, y, ex[s + 1]!, ex[s + 2]!, y, ex[s + 3]!);
      }
    }
    const lines = (arr: number[], mat: THREE.Material) => { const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); const o = new THREE.LineSegments(lg, mat); this.groups.terreno.add(o); };
    lines(minor, this.mats.contour = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16, depthWrite: false }));
    lines(major, this.mats.contourMajor = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.32, depthWrite: false }));
    // grade de 500 m drapeada
    const grid: number[] = [];
    for (let k = Math.ceil(-R / 500) * 500; k <= R; k += 500) for (let t = 0; t < N; t++) {
      const u0 = -R + t * st, u1 = u0 + st;
      grid.push(k, groundAt(a, k, u0) + 1, u0, k, groundAt(a, k, u1) + 1, u1);
      grid.push(u0, groundAt(a, u0, k) + 1, k, u1, groundAt(a, u1, k) + 1, k);
    }
    lines(grid, this.mats.grid = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false }));
  }

  private buildBuildings(a: Area) {
    const rnd = mulberry32(hash(a.focusId) ^ 0x5bd1e995);
    const centers: { x: number; z: number; ang: number }[] = a.nodes.filter((n) => n.node.tipo !== 'Equipamento').map((n) => ({ x: n.x, z: n.z, ang: (hash(n.node.id) % 90) * (PI / 180) }));
    if (!centers.length) centers.push({ x: 0, z: 0, ang: 0 });
    const COUNT = 380, mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), this.mats.bld = new THREE.MeshLambertMaterial({ color: 0xffffff }), COUNT);
    const jit = new Float32Array(COUNT);
    let placed = 0;
    for (let tries = 0; placed < COUNT && tries < 6000; tries++) {
      const c = centers[Math.floor(rnd() * centers.length)]!;
      let x: number, z: number;
      if (rnd() < 0.22) { x = (rnd() * 2 - 1) * (a.R - 120); z = (rnd() * 2 - 1) * (a.R - 120); }
      else { const r = Math.sqrt(-2 * Math.log(Math.max(1e-6, rnd()))) * 420, t = rnd() * 2 * PI; x = c.x + Math.cos(t) * r; z = c.z + Math.sin(t) * r; }
      if (Math.abs(x) > a.R - 80 || Math.abs(z) > a.R - 80) continue;
      let dmin = Infinity, ang = 0;
      for (const o of centers) { const d = Math.hypot(o.x - x, o.z - z); if (d < dmin) { dmin = d; ang = o.ang; } }
      if (dmin < 70) continue;
      if (rnd() > Math.exp(-dmin / 1600) + 0.12) continue;
      const w = 12 + rnd() * 26, d = 10 + rnd() * 22;
      const h = Math.min(60, 6 + 54 * rnd() ** 2.4 * Math.exp(-dmin / 2200) + rnd() * 4);
      const yc = groundAt(a, x, z), ymin = Math.min(yc, groundAt(a, x + w / 2, z + d / 2), groundAt(a, x - w / 2, z - d / 2), groundAt(a, x + w / 2, z - d / 2), groundAt(a, x - w / 2, z + d / 2)) - 1;
      _q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, ang + (rnd() < 0.15 ? rnd() * 0.6 : 0));
      _m4.compose(_p.set(x, ymin, z), _q, _s.set(w, h + (yc - ymin), d));
      mesh.setMatrixAt(placed, _m4);
      jit[placed] = 0.93 + rnd() * 0.12;
      placed++;
    }
    mesh.count = placed;
    mesh.computeBoundingSphere();
    this.buildings = mesh; this.bJitter = jit;
    this.groups.edificios.add(mesh);
  }

  private buildNodes(a: Area) {
    const T = a.nodes.filter((n) => n.node.tipo === 'Torre'), P = a.nodes.filter((n) => n.node.tipo === 'POP'), E = a.nodes.filter((n) => n.node.tipo === 'Equipamento');
    const mk = (geo: THREE.BufferGeometry, list: AreaNode[], place: (n: AreaNode) => void, basic = false) => {
      const mat = basic ? new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }) : new THREE.MeshLambertMaterial({ color: 0xffffff });
      const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
      m.count = list.length;
      list.forEach((n, i) => { place(n); m.setMatrixAt(i, _m4); m.setColorAt(i, _c.set(0xffffff)); });
      m.computeBoundingSphere();
      this.nodeMeshes.push({ mesh: m, ids: list.map((n) => n.node.id) });
      this.groups.torres.add(m);
      return m;
    };
    // mastro triangular afunilado + cabeça de antenas
    mk(new THREE.CylinderGeometry(1.8, 4.6, 1, 3, 1).translate(0, 0.5, 0), T, (n) => _m4.compose(_p.set(n.x, n.ground - 2, n.z), _q.identity(), _s.set(1, n.height + 2, 1)));
    mk(new THREE.CylinderGeometry(6, 6, 7, 6).translate(0, 3.5, 0), T, (n) => _m4.compose(_p.set(n.x, n.ground + n.height - 7, n.z), _q.identity(), _s.set(1, 1, 1)));
    const ring = new THREE.RingGeometry(10, 13.5, 28); ring.rotateX(-PI / 2);
    mk(ring, [...T, ...P], (n) => _m4.compose(_p.set(n.x, n.ground + 1.6, n.z), _q.identity(), _s.set(n.node.tipo === 'POP' ? 2 : 1, 1, n.node.tipo === 'POP' ? 2 : 1)), true);
    const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    mk(box, P, (n) => _m4.compose(_p.set(n.x, n.ground - 3, n.z), _q.identity(), _s.set(36, n.height + 3, 24)));
    mk(box.clone(), E, (n) => _m4.compose(_p.set(n.x, n.ground - 2, n.z), _q.identity(), _s.set(6, n.height + 2, 6)));
  }

  /** Curva de visada que preserva a folga real sobre o chão exagerado: y = chão(cena) + (reta real − chão real). */
  private losPts(a: Area, A: AreaNode, B: AreaNode, n: number): Float32Array {
    const out = new Float32Array((n + 1) * 3);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = A.x + (B.x - A.x) * t, z = A.z + (B.z - A.z) * t;
      const lon = A.lon + (B.lon - A.lon) * t, lat = A.lat + (B.lat - A.lat) * t;
      const los = A.topReal + (B.topReal - A.topReal) * t;
      out[i * 3] = x; out[i * 3 + 1] = groundAt(a, x, z) + (los - terrain(lon, lat)); out[i * 3 + 2] = z;
    }
    return out;
  }
  private buildPaths(a: Area) {
    for (const l of a.links) {
      const A = a.byId.get(l.origem), B = a.byId.get(l.destino);
      if (!A || !B) continue;
      let pts: Float32Array;
      if (l.tipo === 'Rádio') pts = this.losPts(a, A, B, 32);
      else {
        const ctrl: [number, number][] = [[A.x, A.z], ...l.geometria.slice(1, -1).map(([lon, lat]) => toLocal(a, lon, lat)), [B.x, B.z]];
        const arr: number[] = [];
        for (let s = 0; s < ctrl.length - 1; s++) {
          const [x0, z0] = ctrl[s]!, [x1, z1] = ctrl[s + 1]!, n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 25));
          for (let k = s === 0 ? 0 : 1; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; arr.push(x, groundAt(a, x, z) + 4, z); }
        }
        pts = new Float32Array(arr);
      }
      const n = pts.length / 3, cum = new Float32Array(n);
      for (let i = 1; i < n; i++) cum[i] = (cum[i - 1] ?? 0) + Math.hypot((pts[i * 3] ?? 0) - (pts[i * 3 - 3] ?? 0), (pts[i * 3 + 1] ?? 0) - (pts[i * 3 - 2] ?? 0), (pts[i * 3 + 2] ?? 0) - (pts[i * 3 - 1] ?? 0));
      const lp: LinkPath = { link: l, pts, cum, len: cum[n - 1] ?? 0 };
      this.paths.push(lp); this.pathById.set(l.id, lp);
    }
  }

  private buildCoverage(a: Area) {
    const towers = a.nodes.filter((n) => n.node.tipo === 'Torre' && n.node.tecnologia.includes('5G'));
    const RINGS = 12, SEG = 56, pos: number[] = [], idx: number[] = [], outline: number[] = [];
    for (const t of towers) {
      const rad = 600 + (hash(t.node.id) % 300), base = pos.length / 3;
      pos.push(t.x, groundAt(a, t.x, t.z) + 6, t.z);
      for (let r = 1; r <= RINGS; r++) for (let s = 0; s < SEG; s++) {
        const ang = (s / SEG) * 2 * PI, rr = (r / RINGS) * rad, x = t.x + Math.cos(ang) * rr, z = t.z + Math.sin(ang) * rr;
        pos.push(x, groundAt(a, x, z) + 6, z);
      }
      for (let s = 0; s < SEG; s++) idx.push(base, base + 1 + ((s + 1) % SEG), base + 1 + s);
      for (let r = 1; r < RINGS; r++) for (let s = 0; s < SEG; s++) {
        const i0 = base + 1 + (r - 1) * SEG + s, i1 = base + 1 + (r - 1) * SEG + ((s + 1) % SEG), o0 = i0 + SEG, o1 = i1 + SEG;
        idx.push(i0, i1, o0, i1, o1, o0);
      }
      const ob = base + 1 + (RINGS - 1) * SEG;
      for (let s = 0; s < SEG; s++) { const p0 = (ob + s) * 3, p1 = (ob + ((s + 1) % SEG)) * 3; outline.push(pos[p0]!, pos[p0 + 1]! + 0.5, pos[p0 + 2]!, pos[p1]!, pos[p1 + 1]! + 0.5, pos[p1 + 2]!); }
    }
    if (!towers.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    this.groups.cobertura.add(new THREE.Mesh(g, this.mats.cov = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })));
    const og = new THREE.BufferGeometry(); og.setAttribute('position', new THREE.Float32BufferAttribute(outline, 3));
    this.groups.cobertura.add(new THREE.LineSegments(og, this.mats.covLine = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.45, depthWrite: false })));
  }

  private buildLos(a: Area) {
    const A = a.byId.get(LOS_DEMO.from), B = a.byId.get(LOS_DEMO.to);
    if (!A || !B || A === B) return;
    const r = losDemo();
    const tube = (pts: Float32Array, radius: number, mat: THREE.Material) => {
      const v: THREE.Vector3[] = [];
      for (let i = 0; i < pts.length; i += 3) v.push(new THREE.Vector3(pts[i], pts[i + 1], pts[i + 2]));
      return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v, false, 'catmullrom', 0), v.length * 2, radius, 6), mat);
    };
    const main = this.losPts(a, A, B, 64);
    const mMain = this.mats.losMain = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const t1 = tube(main, 3, mMain);
    // trecho "dentro" do morro: tracejado sem teste de profundidade, mostrando por onde a reta passaria
    const lg = new THREE.BufferGeometry(), ld = new Float32Array(main.length / 3);
    for (let i = 1; i < ld.length; i++) ld[i] = (ld[i - 1] ?? 0) + Math.hypot((main[i * 3] ?? 0) - (main[i * 3 - 3] ?? 0), (main[i * 3 + 1] ?? 0) - (main[i * 3 - 2] ?? 0), (main[i * 3 + 2] ?? 0) - (main[i * 3 - 1] ?? 0));
    lg.setAttribute('position', new THREE.BufferAttribute(main, 3)); lg.setAttribute('lineDistance', new THREE.BufferAttribute(ld, 1));
    const ghost = new THREE.Line(lg, this.mats.losGhost = new THREE.LineDashedMaterial({ dashSize: 22, gapSize: 16, transparent: true, opacity: 0.55, depthTest: false }));
    ghost.renderOrder = 5;
    this.groups.visada.add(t1, ghost);
    this.losObjs.blocked.push(t1, ghost);
    if (r.blocked) {
      const t = r.distance_km > 0 ? r.worst.d_km / r.distance_km : 0.5;
      const x = A.x + (B.x - A.x) * t, z = A.z + (B.z - A.z) * t, g = groundAt(a, x, z);
      const mk = new THREE.Mesh(new THREE.OctahedronGeometry(9), this.mats.losMarker = new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      mk.position.set(x, g + 16, z);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 16, 6).translate(0, 8, 0), this.mats.losMarker);
      stem.position.set(x, g, z);
      this.groups.visada.add(mk, stem); this.losObjs.marker.push(mk, stem);
      this.labels.push(this.makeLabel(`Obstrução · ${fmt(r.worst.ground_m)} m`, null, x, g + 34, z, 'visada', null, 's3d-label s3d-label--los'));
    }
    const R = LOS_DEMO.relay ? a.byId.get(LOS_DEMO.relay) : undefined;
    if (R) {
      const mRel = this.mats.losRelay = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      for (const [p, q] of [[A, R], [R, B]] as const) { const o = tube(this.losPts(a, p, q, 48), 2.2, mRel); this.groups.visada.add(o); this.losObjs.relay.push(o); }
    }
  }

  private makeLabel(text: string, status: string | null, x: number, y: number, z: number, layer: LayerKey, id: string | null, cls = 's3d-label'): Label {
    const el = document.createElement('div');
    el.className = cls;
    if (id) el.dataset.id = id;
    const name = document.createElement('span'); name.textContent = text; el.appendChild(name);
    let st: HTMLSpanElement | null = null;
    if (status !== null) { st = document.createElement('span'); st.className = 's3d-label-status'; el.appendChild(st); }
    el.style.display = 'none';
    this.labelHost.appendChild(el);
    return { el, status: st, x, y, z, layer, id };
  }
  private buildLabels(a: Area) {
    const f = a.byId.get(a.focusId);
    const list = a.nodes.filter((n) => n.node.tipo !== 'Equipamento')
      .sort((p, q) => (p.node.tipo === 'Torre' ? 0 : 1) - (q.node.tipo === 'Torre' ? 0 : 1) || Math.hypot(p.x - (f?.x ?? 0), p.z - (f?.z ?? 0)) - Math.hypot(q.x - (f?.x ?? 0), q.z - (f?.z ?? 0)))
      .slice(0, 30);
    for (const n of list) this.labels.push(this.makeLabel(n.node.nome, '', n.x, n.ground + n.height + 10, n.z, 'torres', n.node.id));
  }
  private updateLabels() {
    const maxD = 9000;
    for (const l of this.labels) {
      if (!this.layerOn[l.layer]) { if (l.el.style.display !== 'none') l.el.style.display = 'none'; continue; }
      _v.set(l.x, l.y, l.z);
      const dist = _v.distanceTo(this.camera.position);
      _v.project(this.camera);
      if (_v.z > 1 || _v.z < -1 || Math.abs(_v.x) > 1.05 || Math.abs(_v.y) > 1.05 || dist > maxD) { if (l.el.style.display !== 'none') l.el.style.display = 'none'; continue; }
      const sx = ((_v.x + 1) / 2) * this.w, sy = ((1 - _v.y) / 2) * this.h;
      l.el.style.display = '';
      l.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
      l.el.dataset.picked = l.id !== null && l.id === this.picked ? 'true' : 'false';
    }
  }

  // ---------- estilo (tema e status) ----------
  restyle(p: Palette, statusOf: (id: string) => NetStatus) {
    this.palette = p; this.statusOf = statusOf;
    this.scene.background = new THREE.Color().setStyle(p.surface);
    const set = (k: string, css: string) => { const m = this.mats[k] as (THREE.Material & { color?: THREE.Color }) | undefined; m?.color?.setStyle(css); };
    set('land', p.land); set('skirt', p.boundary); set('contour', p.axis); set('contourMajor', p.axis); set('grid', p.boundary);
    set('cov', p.cat1); set('covLine', p.cat1);
    const losBlocked = this.area && this.losObjs.marker.length > 0;
    set('losMain', losBlocked ? p.critical : p.normal); set('losGhost', losBlocked ? p.critical : p.normal); set('losMarker', p.critical); set('losRelay', p.normal);
    const sc: Record<NetStatus, string> = { normal: p.normal, warning: p.warning, critical: p.critical, offline: p.offline };
    // edifícios: neutro entre o limite do mapa e o subtítulo
    if (this.buildings) {
      const base = new THREE.Color().setStyle(p.boundary).lerp(_c.setStyle(p.subtitle), 0.08);
      for (let i = 0; i < this.buildings.count; i++) this.buildings.setColorAt(i, _c.copy(base).multiplyScalar(this.bJitter[i] ?? 1));
      if (this.buildings.instanceColor) this.buildings.instanceColor.needsUpdate = true;
    }
    for (const { mesh, ids } of this.nodeMeshes) {
      ids.forEach((id, i) => mesh.setColorAt(i, _c.setStyle(sc[statusOf(id)])));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    for (const l of this.labels) if (l.status && l.id) { const s = statusOf(l.id); l.status.textContent = s === 'normal' ? '' : STATUS_WORD[s]; l.el.dataset.status = s; }
    if (this.selRing) (this.selRing.material as THREE.MeshBasicMaterial).color.setStyle(p.title);
    this.rebuildStatusObjects(p, statusOf);
    if (this.picked) this.setPicked(this.picked);
    this.requestRender();
  }

  private rebuildStatusObjects(p: Palette, statusOf: (id: string) => NetStatus) {
    const a = this.area; if (!a) return;
    for (const o of this.lineObjs) { this.groups.fibras.remove(o.obj); disposeTree(o.obj); }
    this.lineObjs = [];
    if (this.flow) { this.groups.fluxo.remove(this.flow); disposeTree(this.flow); this.flow = null; }
    if (this.pulse) { this.groups.torres.remove(this.pulse); disposeTree(this.pulse); this.pulse = null; }
    // enlaces: contínuos com cor por vértice; fora do ar tracejados com distância acumulada (o tracejado não reinicia a cada segmento)
    const sc: Record<NetStatus, string> = { normal: p.normal, warning: p.warning, critical: p.critical, offline: p.offline };
    const build = (sel: (s: NetStatus) => boolean, dashed: boolean) => {
      const chosen = this.paths.map((lp, i) => ({ lp, i, s: statusOf(lp.link.id) })).filter((x) => sel(x.s));
      const nSeg = chosen.reduce((acc, x) => acc + Math.max(0, x.lp.pts.length / 3 - 1), 0);
      if (!nSeg) return;
      const pos = new Float32Array(nSeg * 6), col = new Float32Array(nSeg * 6), dist = new Float32Array(nSeg * 2), segLink = new Int32Array(nSeg);
      let k = 0;
      for (const { lp, i, s } of chosen) {
        _c.setStyle(sc[s]);
        const P = lp.pts, n = P.length / 3;
        for (let v = 0; v < n - 1; v++) {
          for (let e = 0; e < 2; e++) {
            const src = (v + e) * 3, dst = (k * 2 + e) * 3;
            pos[dst] = P[src] ?? 0; pos[dst + 1] = P[src + 1] ?? 0; pos[dst + 2] = P[src + 2] ?? 0;
            col[dst] = _c.r; col[dst + 1] = _c.g; col[dst + 2] = _c.b;
            dist[k * 2 + e] = lp.cum[v + e] ?? 0;
          }
          segLink[k++] = i;
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      let mat: THREE.Material;
      if (dashed) { g.setAttribute('lineDistance', new THREE.BufferAttribute(dist, 1)); mat = new THREE.LineDashedMaterial({ color: new THREE.Color().setStyle(p.offline), dashSize: 28, gapSize: 22 }); }
      else { g.setAttribute('color', new THREE.BufferAttribute(col, 3)); mat = new THREE.LineBasicMaterial({ vertexColors: true }); }
      const obj = new THREE.LineSegments(g, mat);
      this.groups.fibras.add(obj);
      this.lineObjs.push({ obj, segLink });
    };
    build((s) => s !== 'offline', false);
    build((s) => s === 'offline', true);

    // fluxo: pontos discretos ao longo das fibras saudáveis
    const fl: number[] = [], ph: number[] = [];
    this.paths.forEach((lp, i) => {
      const s = statusOf(lp.link.id);
      if (lp.link.tipo !== 'Fibra' || (s !== 'normal' && s !== 'warning') || lp.len < 50) return;
      const k = Math.max(1, Math.min(5, Math.round(lp.len / 700)));
      for (let j = 0; j < k; j++) { fl.push(i); ph.push((j + (hash(lp.link.id) % 100) / 100) / k); }
    });
    this.flowLink = Int32Array.from(fl); this.flowPhase = Float32Array.from(ph);
    if (fl.length) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fl.length * 3), 3));
      const m = new THREE.PointsMaterial({ color: new THREE.Color().setStyle(p.surface), size: 3 * this.renderer.getPixelRatio(), sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false });
      this.flow = new THREE.Points(g, m);
      this.flow.frustumCulled = false;
      this.flow.visible = this.layerOn.fluxo && this.layerOn.fibras;
      this.groups.fluxo.add(this.flow);
      this.updateAnim(0);
    }

    // pulso discreto na base de itens críticos
    const crit = a.nodes.filter((n) => n.node.tipo !== 'Equipamento' && statusOf(n.node.id) === 'critical');
    if (crit.length) {
      const ring = new THREE.RingGeometry(18, 22, 40); ring.rotateX(-PI / 2);
      const m = new THREE.InstancedMesh(ring, new THREE.MeshBasicMaterial({ color: new THREE.Color().setStyle(p.critical), transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }), crit.length);
      crit.forEach((n, i) => m.setMatrixAt(i, _m4.compose(_p.set(n.x, n.ground + 1.4, n.z), _q.identity(), _s.set(n.node.tipo === 'POP' ? 1.6 : 1, 1, n.node.tipo === 'POP' ? 1.6 : 1))));
      m.computeBoundingSphere();
      this.pulse = m;
      this.groups.torres.add(m);
    }
    this.schedule();
  }
}
