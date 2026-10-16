import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// World units: 1 unit = 10 mm, so a CR80 card is 8.6 x 5.4.
export const CARD_W = 8.6;
export const CARD_H = 5.4;
export const CARD_R = 0.318; // 3.18 mm corner radius

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * A thin rounded card. Material groups: 0 = front face, 1 = edge, 2 = back face.
 * Face UVs span 0..1 across the card; the back is mirrored so it reads correctly.
 */
export function cardGeometry(w: number, h: number, depth: number, r = CARD_R) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const caps = g.groups[0].count;
  for (let i = 0; i < caps; i++) {
    const u = (pos.getX(i) + w / 2) / w;
    const v = (pos.getY(i) + h / 2) / h;
    uv.setXY(i, pos.getZ(i) < 0 ? 1 - u : u, v);
  }
  uv.needsUpdate = true;
  g.clearGroups();
  g.addGroup(0, caps / 2, 2);
  g.addGroup(caps / 2, caps / 2, 0);
  g.addGroup(caps, pos.count - caps, 1);
  return g;
}

export function makeRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const coarse = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 1.75));
  return renderer;
}

export function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return env;
}

/** Calls fn(dt, t) every frame, but only while the element is on screen and the tab is visible. */
export function loopWhileVisible(el: Element, fn: (dt: number, t: number) => void) {
  let visible = false;
  let raf = 0;
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fn(dt, now / 1000);
    raf = requestAnimationFrame(tick);
  };
  const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { rootMargin: '100px' }).observe(el);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
