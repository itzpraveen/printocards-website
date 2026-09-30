import * as THREE from 'three';
import { gsap } from 'gsap';
import { cardGeometry, makeRenderer, studioEnvironment, loopWhileVisible, clamp01, smooth, CARD_W as W, CARD_H as H } from './card';
import { loadAssets, texture, memberFront, memberBack, uvMask, antenna } from './textures';
import { state, bus, story, type Finish } from './state';

const FOV = 30;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const TAU = Math.PI * 2;

// Card pose along the story. s runs 0..4, one unit per chapter.
type Key = { s: number; p: [number, number, number]; r: [number, number, number] };
const KEYS: Key[] = [
  { s: 0.0, p: [7, -6, -8], r: [1.0, -1.7, 0.6] },          // flying in
  { s: 0.3, p: [0, 0, 0], r: [-0.3, -0.4, 0.1] },           // 01 blank, face on, marks drawn
  { s: 0.6, p: [0, 0, 1.2], r: [-0.3, -0.4, 0.1] },
  { s: 0.84, p: [0, 0, 3.2], r: [0.05, -1.45, 0.0] },        // edge on: 0.76 mm
  { s: 1.08, p: [0, 0, 0], r: [-0.14, -0.2, 0.03] },         // 02 ready to print
  { s: 1.6, p: [0, 0, 0], r: [-0.14, -0.08, 0.03] },         // printed
  { s: 1.86, p: [0, 0, 0], r: [-0.12, Math.PI - 0.15, 0] },  // back, printed too
  { s: 2.22, p: [0, 0, 0], r: [-0.2, TAU - 0.32, 0.06] },    // 03 finish
  { s: 2.95, p: [0, 0, 0], r: [-0.2, TAU - 0.32, 0.06] },
  { s: 3.32, p: [-2.6, 0.4, -5], r: [-1.02, TAU, 0.64] },       // 04 lying flat, x-ray
  { s: 4.0, p: [-2.6, 0.4, -5], r: [-1.02, TAU, 0.64] },
];
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function pose(s: number, p: THREE.Vector3, r: THREE.Vector3) {
  let i = 0;
  while (i < KEYS.length - 2 && s > KEYS[i + 1].s) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = ease(clamp01((s - a.s) / (b.s - a.s)));
  p.set(a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t, a.p[2] + (b.p[2] - a.p[2]) * t);
  r.set(a.r[0] + (b.r[0] - a.r[0]) * t, a.r[1] + (b.r[1] - a.r[1]) * t, a.r[2] + (b.r[2] - a.r[2]) * t);
}

// Printing: cyan, magenta, yellow, then key black land in turn behind a moving head.
const INK_GAP = 0.018;
const SWEEP_GLSL = /* glsl */ `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  vec3 art = sampledDiffuseColor.rgb;
  float x = vMapUv.x;
  float fc = 1.0 - smoothstep( uSweep - 0.004, uSweep + 0.004, x );
  float fm = 1.0 - smoothstep( uSweep - ${INK_GAP} - 0.004, uSweep - ${INK_GAP} + 0.004, x );
  float fy = 1.0 - smoothstep( uSweep - ${INK_GAP * 2} - 0.004, uSweep - ${INK_GAP * 2} + 0.004, x );
  float fk = 1.0 - smoothstep( uSweep - ${INK_GAP * 3} - 0.004, uSweep - ${INK_GAP * 3} + 0.004, x );
  vec3 cmy = 1.0 - art;
  float k = min( min( cmy.r, cmy.g ), cmy.b );
  vec3 layer = vec3( 1.0 ) - ( cmy - k ) * vec3( fc, fm, fy );
  layer *= 1.0 - k * fk;
  diffuseColor.rgb *= mix( layer, art, fk );
#endif
`;
const BACK_GLSL = /* glsl */ `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  diffuseColor.rgb *= mix( vec3( 1.0 ), sampledDiffuseColor.rgb, uPrinted );
#endif
`;

const FINISHES: Record<Finish, { roughness: number; clearcoat: number; clearcoatRoughness: number; opacity: number }> = {
  glossy: { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, opacity: 1 },
  matte: { roughness: 0.95, clearcoat: 0, clearcoatRoughness: 0.9, opacity: 1 },
  frosted: { roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3, opacity: 0.5 },
  uv: { roughness: 0.95, clearcoat: 1, clearcoatRoughness: 0.02, opacity: 1 },
};

export async function initStory(section: HTMLElement) {
  const stage = section.querySelector<HTMLElement>('[data-stage]')!;
  const canvas = section.querySelector<HTMLCanvasElement>('[data-story-canvas]')!;
  const marks = section.querySelector<SVGSVGElement>('[data-marks]')!;
  const labels = [...section.querySelectorAll<HTMLElement>('[data-layer-labels] span')];
  await loadAssets();

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.95;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-6, 9, 12);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

  /* ---------- materials ---------- */
  const artCanvas = memberFront(state.name);
  const artTex = texture(artCanvas, renderer);
  const uvTex = new THREE.CanvasTexture(uvMask());
  const uSweep = { value: -0.1 };
  const uPrinted = { value: 0 };

  const frontMat = new THREE.MeshPhysicalMaterial({ map: artTex, ...FINISHES.glossy, transparent: true });
  frontMat.onBeforeCompile = (sh) => {
    sh.uniforms.uSweep = uSweep;
    sh.fragmentShader = 'uniform float uSweep;\n' + sh.fragmentShader.replace('#include <map_fragment>', SWEEP_GLSL);
  };
  frontMat.customProgramCacheKey = () => 'printo-front';

  const backMat = new THREE.MeshPhysicalMaterial({ map: texture(memberBack(), renderer), roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.08, transparent: true });
  backMat.onBeforeCompile = (sh) => {
    sh.uniforms.uPrinted = uPrinted;
    sh.fragmentShader = 'uniform float uPrinted;\n' + sh.fragmentShader.replace('#include <map_fragment>', BACK_GLSL);
  };
  backMat.customProgramCacheKey = () => 'printo-back';

  const edgeMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f3f0, roughness: 0.4, clearcoat: 0.6, transparent: true });
  const coreMat = new THREE.MeshPhysicalMaterial({ color: 0xf6f7f5, roughness: 0.5, transparent: true, depthWrite: true });
  const inlayMat = new THREE.MeshStandardMaterial({
    map: texture(antenna(), renderer), emissive: 0xf79633, emissiveIntensity: 0,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.4, metalness: 0.3,
  });
  inlayMat.emissiveMap = inlayMat.map;

  /* ---------- the card: four layers stacked 0.1 thick ---------- */
  const card = new THREE.Group();
  scene.add(card);
  const front = new THREE.Mesh(cardGeometry(W, H, 0.03), [frontMat, edgeMat, edgeMat]);
  const core = new THREE.Mesh(cardGeometry(W, H, 0.034), coreMat);
  const inlay = new THREE.Mesh(new THREE.PlaneGeometry(W, H), inlayMat);
  const back = new THREE.Mesh(cardGeometry(W, H, 0.03), [edgeMat, edgeMat, backMat]);
  const Z = { front: 0.035, core: -0.001, inlay: -0.019, back: -0.035 };
  front.position.z = Z.front; core.position.z = Z.core; inlay.position.z = Z.inlay; back.position.z = Z.back;
  inlay.renderOrder = 2;
  card.add(back, inlay, core, front);
  const layers = [front, core, inlay, back];

  // print head: four ink bars that ride across the face
  const head = new THREE.Group();
  ['#00AEEF', '#EC008C', '#FFF212', '#231F20'].forEach((c, i) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, H + 1, 0.12), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
    bar.position.x = -i * INK_GAP * W;
    head.add(bar);
  });
  head.position.z = 0.4;
  card.add(head);

  // radio waves for the smart card
  const waves: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.985, 1, 128),
      new THREE.MeshBasicMaterial({ color: 0xcbdb3a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    );
    card.add(m);
    waves.push(m);
  }

  /* ---------- finishes and live name ---------- */
  function applyFinish(f: Finish, instant = false) {
    const v = FINISHES[f];
    const wantMap = f === 'uv' ? uvTex : null;
    if (frontMat.clearcoatMap !== wantMap) { frontMat.clearcoatMap = wantMap; frontMat.needsUpdate = true; }
    const d = instant ? 0 : 0.9;
    gsap.to(frontMat, { ...v, duration: d, ease: 'power2.out' });
    gsap.to(backMat, { opacity: f === 'frosted' ? 0.3 : 1, duration: d });
    gsap.to(edgeMat, { opacity: f === 'frosted' ? 0.45 : 1, duration: d });
    core.visible = f !== 'frosted';
    spin += f === 'uv' || f === 'glossy' ? 0.9 : 0.5; // tilt so the new surface catches the light
  }
  bus.addEventListener('finish', () => applyFinish(state.finish));
  bus.addEventListener('name', () => {
    artTex.image = memberFront(state.name);
    artTex.needsUpdate = true;
  });

  /* ---------- drag to tilt (finish chapter) ---------- */
  const user = { x: 0, y: 0, vx: 0, vy: 0 };
  let spin = 0;
  let drag: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (stage.dataset.chapter !== '2') return;
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    user.vy = (e.clientX - drag.x) * 0.012;
    user.vx = (e.clientY - drag.y) * 0.008;
    user.y += user.vy; user.x += user.vx;
    drag = { x: e.clientX, y: e.clientY };
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  const hover = new THREE.Vector2();
  const hoverS = new THREE.Vector2();
  section.addEventListener('pointermove', (e) => hover.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1));

  /* ---------- layout ---------- */
  let camZ = 30, vh = 16, vw = 26, narrow = false, cw = 1, ch = 1;
  const base = new THREE.Vector3();
  function layout() {
    cw = canvas.clientWidth || 1; ch = canvas.clientHeight || 1;
    renderer.setSize(cw, ch, false);
    const aspect = cw / ch;
    camera.aspect = aspect;
    narrow = aspect < 0.9;
    const byWidth = W / (narrow ? 0.74 : 0.36) / aspect / (2 * TAN);
    const byHeight = H / (narrow ? 0.3 : 0.46) / (2 * TAN);
    camZ = Math.max(byWidth, byHeight);
    camera.position.set(0, 0, camZ);
    camera.updateProjectionMatrix();
    vh = 2 * camZ * TAN; vw = vh * aspect;
    base.set(narrow ? 0 : vw * 0.2, narrow ? -vh * 0.2 : -vh * 0.01, 0);
    marks.setAttribute('viewBox', `0 0 ${cw} ${ch}`);
  }
  new ResizeObserver(layout).observe(stage);
  layout();

  /* ---------- print marks and layer labels, projected from 3D ---------- */
  const crop = [...marks.querySelectorAll<SVGPathElement>('[data-crop] path')];
  const dimW = marks.querySelector<SVGGElement>('[data-dim-w]')!;
  const dimH = marks.querySelector<SVGGElement>('[data-dim-h]')!;
  const dimT = marks.querySelector<SVGGElement>('[data-dim-t]')!;
  const cropG = marks.querySelector<SVGGElement>('[data-crop]')!;
  const v = new THREE.Vector3();
  const toScreen = (obj: THREE.Object3D, x: number, y: number, z: number) => {
    v.set(x, y, z).applyMatrix4(obj.matrixWorld).project(camera);
    return [((v.x + 1) / 2) * cw, ((1 - v.y) / 2) * ch] as const;
  };
  function drawMarks(s: number) {
    const o = smooth(0.2, 0.3, s) * (1 - smooth(0.56, 0.66, s));
    const ot = smooth(0.76, 0.82, s) * (1 - smooth(0.93, 1.0, s));
    cropG.style.opacity = dimW.style.opacity = dimH.style.opacity = String(o);
    dimT.style.opacity = String(ot);
    if (o <= 0.001 && ot <= 0.001) return;
    const pts = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => toScreen(front, (sx * W) / 2, (sy * H) / 2, 0.015));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const G = 14, L = 26;
    [[x0, y0, -1, -1], [x1, y0, 1, -1], [x1, y1, 1, 1], [x0, y1, -1, 1]].forEach(([x, y, sx, sy], i) => {
      const px = x + sx * G, py = y + sy * G;
      crop[i].setAttribute('d', `M${px} ${py - sy * L}L${px} ${py}L${px - sx * L} ${py}`);
    });
    const yW = y0 - 46;
    dimW.querySelector('path')!.setAttribute('d', `M${x0} ${yW - 6}V${yW + 6}M${x0} ${yW}H${x1}M${x1} ${yW - 6}V${yW + 6}`);
    const tw = dimW.querySelector('text')!;
    tw.setAttribute('x', String((x0 + x1) / 2)); tw.setAttribute('y', String(yW - 10));
    const xH = x1 + 46;
    dimH.querySelector('path')!.setAttribute('d', `M${xH - 6} ${y0}H${xH + 6}M${xH} ${y0}V${y1}M${xH - 6} ${y1}H${xH + 6}`);
    const th = dimH.querySelector('text')!;
    const my = (y0 + y1) / 2;
    th.setAttribute('x', String(xH + 16)); th.setAttribute('y', String(my));
    th.setAttribute('transform', `rotate(90 ${xH + 16} ${my})`);
    const [cx, cy] = toScreen(front, 0, 0, 0);
    dimT.querySelector('path')!.setAttribute('d', `M${cx + 16} ${cy}H${cx + 110}`);
    const tt = dimT.querySelector('text')!;
    tt.setAttribute('x', String(cx + 120)); tt.setAttribute('y', String(cy + 5));
  }
  function drawLabels(e: number) {
    const on = !narrow && e > 0.5;
    labels.forEach((el, i) => {
      if (!on) { el.style.opacity = '0'; return; }
      const layer = layers[i];
      let best = [-Infinity, 0] as readonly [number, number];
      for (const [sx, sy] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
        const p = toScreen(layer, (sx * W) / 2, (sy * H) / 2, 0);
        if (p[0] > best[0]) best = p;
      }
      el.style.opacity = String(smooth(0.5, 1, e));
      const x = Math.min(best[0] + 22, cw - el.offsetWidth - 16);
      el.style.transform = `translate(${x}px, ${best[1] - 12}px)`;
    });
  }

  /* ---------- frame ---------- */
  let s = story.s;
  const p = new THREE.Vector3(), r = new THREE.Vector3();
  applyFinish(state.finish, true);
  spin = 0;
  loopWhileVisible(section, (dt, t) => {
    s += (story.s - s) * (1 - Math.exp(-dt * 7));
    pose(s, p, r);

    // user tilt springs back; hover adds a small lean
    if (!drag) {
      user.x += user.vx; user.y += user.vy;
      user.vx *= 0.9; user.vy *= 0.9;
      user.x *= 0.94; user.y *= 0.94;
    }
    spin *= 0.95;
    hoverS.lerp(hover, 0.05);

    card.position.set(base.x + p.x, base.y + p.y + Math.sin(t * 1.1) * 0.07, p.z);
    card.rotation.set(
      r.x + user.x + hoverS.y * 0.08,
      r.y + user.y + spin * Math.sin(t * 2) * 0.3 + hoverS.x * 0.12,
      r.z,
    );

    // print
    uSweep.value = -0.1 + smooth(1.08, 1.6, s) * 1.25;
    uPrinted.value = smooth(1.5, 1.62, s);
    head.visible = uSweep.value > -0.08 && uSweep.value < 1.12;
    head.position.x = (uSweep.value - 0.5) * W;

    // x-ray: layers separate, antenna lights, waves pulse
    const e = smooth(3.3, 3.72, s);
    front.position.z = Z.front + e * 2.7;
    core.position.z = Z.core + e * 0.9;
    inlay.position.z = Z.inlay - e * 0.9;
    back.position.z = Z.back - e * 2.7;
    coreMat.opacity = 1 - e * 0.8;
    if (state.finish === 'frosted') core.visible = e > 0.05;
    inlayMat.emissiveIntensity = smooth(3.45, 3.85, s) * 2.4;
    const w = smooth(3.7, 3.9, s);
    waves.forEach((m, i) => {
      const ph = (t * 0.32 + i / waves.length) % 1;
      m.scale.setScalar(4.8 + ph * 8);
      (m.material as THREE.MeshBasicMaterial).opacity = w * (1 - ph) * 0.55;
      m.visible = w > 0.001;
    });

    scene.environmentRotation.y = t * 0.1 + s * 0.9;
    card.updateMatrixWorld();
    drawMarks(s);
    drawLabels(e);
    renderer.render(scene, camera);
  });
}
