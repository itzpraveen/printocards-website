import * as THREE from 'three';
import { cardGeometry, makeRenderer, studioEnvironment, loopWhileVisible, clamp01, CARD_W, CARD_H } from './card';
import { loadAssets, texture, idFront, idBack, nfcCard, woodCard, loyaltyCard, giftCard, strap } from './textures';

const FOV = 30;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const N = 16;                 // rope particles below the anchor
const IW = CARD_H, IH = CARD_W; // portrait ID card, 5.4 x 8.6
const HANG = IH / 2 + 0.5;    // rope end to card centre
const STEP = 1 / 120;

type Floater = {
  mesh: THREE.Mesh; z: number;
  desk: [number, number]; mob: [number, number];
  rot: THREE.Euler; phase: number; speed: number; base: THREE.Vector3;
};

export async function initHero(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>('[data-hero-canvas]')!;
  const hint = hero.querySelector<HTMLElement>('[data-hero-hint]');
  const assets = await loadAssets();

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.85;
  const fog = new THREE.Fog(0xf26b35, 30, 70);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);

  const key = new THREE.DirectionalLight(0xfff1e4, 1.7);
  key.position.set(-8, 12, 14);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.3));

  /* ---------- the ID card ---------- */
  const edge = new THREE.MeshPhysicalMaterial({ color: 0xf2f2ef, roughness: 0.45, clearcoat: 0.6 });
  const idMat = new THREE.MeshPhysicalMaterial({ map: texture(idFront(assets), renderer), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  const idBackMat = new THREE.MeshPhysicalMaterial({ map: texture(idBack(), renderer), roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const idCard = new THREE.Mesh(cardGeometry(IW, IH, 0.1), [idMat, edge, idBackMat]);
  idCard.rotation.order = 'ZYX';
  scene.add(idCard);

  const clip = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xc4c4c0, metalness: 0.9, roughness: 0.22 });
  const clipBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 0.2), metal);
  const clipRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 24), metal);
  clipRing.position.y = -0.42;
  clip.add(clipBody, clipRing);
  scene.add(clip);

  /* ---------- lanyard: two printed straps meeting at the clip ---------- */
  const strapTex = texture(strap(), renderer);
  strapTex.wrapS = THREE.RepeatWrapping;
  const strapMat = new THREE.MeshStandardMaterial({ map: strapTex, roughness: 0.75, side: THREE.DoubleSide });
  const STRAP_W = 0.74;
  const makeStrap = (side: number) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((N + 1) * 2 * 3);
    const uv = new Float32Array((N + 1) * 2 * 2);
    const idx: number[] = [];
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setIndex(idx);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const mesh = new THREE.Mesh(geo, strapMat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { geo, pos, uv, side };
  };
  const straps = [makeStrap(-1), makeStrap(1)];

  /* ---------- floating product cards ---------- */
  const floatGeo = cardGeometry(CARD_W, CARD_H, 0.08);
  const floatEdge = new THREE.MeshPhysicalMaterial({ color: 0xeeeeea, roughness: 0.5 });
  const mk = (c: HTMLCanvasElement, rough = 0.3) =>
    new THREE.Mesh(floatGeo, [new THREE.MeshPhysicalMaterial({ map: texture(c, renderer), roughness: rough, clearcoat: 1, clearcoatRoughness: 0.08 }), floatEdge, floatEdge]);
  const floaters: Floater[] = [
    { mesh: mk(nfcCard(), 0.35), z: -5, desk: [0.87, 0.24], mob: [0.88, 0.1], rot: new THREE.Euler(0.25, -0.6, -0.28), phase: 0.3, speed: 0.8, base: new THREE.Vector3() },
    { mesh: mk(woodCard(), 0.7), z: -15, desk: [0.47, 0.3], mob: [0.13, 0.15], rot: new THREE.Euler(0.4, 0.62, 0.42), phase: 1.9, speed: 0.6, base: new THREE.Vector3() },
    { mesh: mk(giftCard()), z: -26, desk: [0.43, 0.56], mob: [0.14, 0.33], rot: new THREE.Euler(-0.3, 0.5, 0.25), phase: 3.1, speed: 0.5, base: new THREE.Vector3() },
    { mesh: mk(loyaltyCard()), z: 5, desk: [0.955, 0.5], mob: [0.93, 0.29], rot: new THREE.Euler(-0.25, 0.55, 0.42), phase: 4.2, speed: 0.9, base: new THREE.Vector3() },
  ];
  floaters.forEach((f) => { f.mesh.scale.setScalar(0.62); scene.add(f.mesh); });

  /* ---------- rope physics (Verlet) ---------- */
  const rope = Array.from({ length: N + 1 }, () => new THREE.Vector2());
  const ropePrev = rope.map((v) => v.clone());
  const cardP = new THREE.Vector2();
  const cardPrev = new THREE.Vector2();
  const anchor = new THREE.Vector2();
  const target = new THREE.Vector2();
  const grab = new THREE.Vector2();
  let segLen = 1;
  let ropeTotal = 1;
  let dragging = false;
  let twist = 0, twistV = 0;

  let camZ = 36, vh = 20, vw = 30, mobile = false, heroH = 1;
  const pointer = new THREE.Vector2();
  const camOffset = new THREE.Vector2();

  function layout() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    mobile = aspect < 0.9;
    camZ = mobile ? IW / 0.42 / aspect / (2 * TAN) : Math.max(28, IH / 0.41 / (2 * TAN));
    camera.position.set(0, 0, camZ);
    camera.updateProjectionMatrix();
    vh = 2 * camZ * TAN;
    vw = vh * aspect;
    fog.near = camZ - 2;
    fog.far = camZ + 42;
    heroH = hero.offsetHeight;

    const cx = mobile ? 0 : (0.63 - 0.5) * vw;
    const cy = mobile ? (0.5 - 0.235) * vh : (0.5 - 0.405) * vh;
    anchor.set(cx, vh / 2 + 2.5);
    ropeTotal = anchor.y - (cy + HANG);
    segLen = ropeTotal / N;
    for (let i = 0; i <= N; i++) { rope[i].set(cx, anchor.y - i * segLen); ropePrev[i].copy(rope[i]); }
    cardP.set(cx, cy); cardPrev.copy(cardP);

    for (const f of floaters) {
      const d = camZ - f.z;
      const hh = d * TAN, hw = hh * aspect;
      const [fx, fy] = mobile ? f.mob : f.desk;
      f.base.set((fx - 0.5) * 2 * hw, (0.5 - fy) * 2 * hh, f.z);
    }
  }

  function satisfy(a: THREE.Vector2, b: THREE.Vector2, len: number, wa: number) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    const k = (d - len) / d;
    a.x += dx * k * wa; a.y += dy * k * wa;
    b.x -= dx * k * (1 - wa); b.y -= dy * k * (1 - wa);
  }

  function step(t: number) {
    const g = -34 * STEP * STEP;
    const damp = 0.991;
    for (let i = 1; i <= N; i++) {
      const p = rope[i], q = ropePrev[i];
      const vx = (p.x - q.x) * damp, vy = (p.y - q.y) * damp;
      q.copy(p); p.x += vx; p.y += vy + g;
    }
    const vx = (cardP.x - cardPrev.x) * damp, vy = (cardP.y - cardPrev.y) * damp;
    cardPrev.copy(cardP);
    if (dragging) {
      cardP.lerp(target, 0.4);
    } else {
      cardP.x += vx + Math.sin(t * 0.7) * 0.000045;
      cardP.y += vy + g;
    }
    for (let k = 0; k < 14; k++) {
      rope[0].copy(anchor);
      for (let i = 0; i < N; i++) satisfy(rope[i], rope[i + 1], segLen, i === 0 ? 0 : 0.5);
      // card hangs from the rope end; the card is heavier, so the rope gives way
      const a = rope[N];
      const dx = cardP.x - a.x, dy = cardP.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const kk = (d - HANG) / d;
      const wa = dragging ? 1 : 0.72;
      a.x += dx * kk * wa; a.y += dy * kk * wa;
      cardP.x -= dx * kk * (1 - wa); cardP.y -= dy * kk * (1 - wa);
    }
    // twist around the card's own axis, driven by sideways speed
    const sway = (cardP.x - cardPrev.x) / STEP;
    twistV += (-twist * 16 - twistV * 2.4 + sway * 1.1) * STEP;
    twist += twistV * STEP;
  }

  const tmpN = new THREE.Vector2();
  function updateStraps() {
    for (const s of straps) {
      let len = 0;
      const prevPt = new THREE.Vector2();
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const off = s.side * (1.35 * Math.pow(1 - t, 1.15) + 0.12);
        const px = rope[i].x + off, py = rope[i].y;
        const a = rope[Math.max(0, i - 1)], b = rope[Math.min(N, i + 1)];
        const offA = s.side * (1.35 * Math.pow(1 - Math.max(0, i - 1) / N, 1.15) + 0.12);
        const offB = s.side * (1.35 * Math.pow(1 - Math.min(N, i + 1) / N, 1.15) + 0.12);
        tmpN.set(b.x + offB - (a.x + offA), b.y - a.y).normalize();
        const nx = -tmpN.y * STRAP_W * 0.5, ny = tmpN.x * STRAP_W * 0.5;
        const z = s.side < 0 ? 0.06 : -0.06;
        const o = i * 6;
        s.pos[o] = px + nx; s.pos[o + 1] = py + ny; s.pos[o + 2] = z;
        s.pos[o + 3] = px - nx; s.pos[o + 4] = py - ny; s.pos[o + 5] = z;
        if (i > 0) len += Math.hypot(px - prevPt.x, py - prevPt.y);
        prevPt.set(px, py);
        const u = len / (STRAP_W * 8);
        s.uv[i * 4] = u; s.uv[i * 4 + 1] = 1; s.uv[i * 4 + 2] = u; s.uv[i * 4 + 3] = 0;
      }
      s.geo.attributes.position.needsUpdate = true;
      s.geo.attributes.uv.needsUpdate = true;
      s.geo.computeVertexNormals();
    }
  }

  /* ---------- pointer ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const setNdc = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  };
  const overCard = (e: PointerEvent) => { setNdc(e); return ray.intersectObject(idCard, false).length > 0; };
  const worldAt = (e: PointerEvent) => { setNdc(e); ray.ray.intersectPlane(plane, hit); return hit; };
  let interacted = false;

  hero.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (e.target as Element).closest('a, button, input')) return;
    if (!overCard(e)) return;
    interacted = true;
    if (e.pointerType === 'touch') {
      // on touch screens a tap flicks the card instead of hijacking the scroll
      const dir = worldAt(e).x < cardP.x ? 1 : -1;
      cardPrev.x -= dir * 0.09;
      twistV += dir * 5;
      return;
    }
    const w = worldAt(e);
    grab.set(w.x - cardP.x, w.y - cardP.y);
    target.copy(cardP);
    dragging = true;
    hero.setPointerCapture(e.pointerId);
    hero.classList.add('is-dragging');
    e.preventDefault();
  });
  hero.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    if (dragging) {
      const w = worldAt(e);
      target.set(w.x - grab.x, w.y - grab.y);
      // keep it on the lanyard
      const dx = target.x - anchor.x, dy = target.y - anchor.y;
      const max = ropeTotal + HANG - 0.2;
      const d = Math.hypot(dx, dy);
      if (d > max) target.set(anchor.x + (dx / d) * max, anchor.y + (dy / d) * max);
      target.y = Math.max(target.y, -vh / 2 + 3);
    } else if (e.pointerType === 'mouse') {
      hero.classList.toggle('is-hover-card', overCard(e));
    }
  });
  const release = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    hero.classList.remove('is-dragging');
    if (hero.hasPointerCapture(e.pointerId)) hero.releasePointerCapture(e.pointerId);
  };
  hero.addEventListener('pointerup', release);
  hero.addEventListener('pointercancel', release);

  new ResizeObserver(layout).observe(hero);
  layout();

  /* ---------- frame ---------- */
  let acc = 0;
  const proj = new THREE.Vector3();
  let first = true;
  loopWhileVisible(hero, (dt, t) => {
    acc += dt;
    let n = 0;
    while (acc >= STEP && n++ < 8) { step(t); acc -= STEP; }

    const a = rope[N];
    const ang = Math.atan2(cardP.x - a.x, -(cardP.y - a.y));
    idCard.position.set(cardP.x, cardP.y, 0);
    idCard.rotation.set(0.04, twist + Math.sin(t * 0.55) * 0.18, ang);
    clip.position.set(a.x + Math.sin(ang) * 0.22, a.y - Math.cos(ang) * 0.22, 0.02);
    clip.rotation.set(0, 0, ang);
    updateStraps();

    for (const f of floaters) {
      f.mesh.position.set(
        f.base.x,
        f.base.y + Math.sin(t * f.speed + f.phase) * 0.35,
        f.base.z,
      );
      f.mesh.rotation.set(
        f.rot.x + Math.sin(t * 0.4 + f.phase) * 0.12,
        f.rot.y + t * 0.05 * f.speed,
        f.rot.z + Math.cos(t * 0.3 + f.phase) * 0.06,
      );
    }

    // scroll + pointer parallax: moving the camera shifts near cards more than far ones
    const p = clamp01(window.scrollY / heroH);
    if (!mobile) camOffset.lerp(pointer, 0.05);
    camera.position.set(camOffset.x * 0.9, -camOffset.y * 0.6 - p * vh * 0.32, camZ);
    renderer.render(scene, camera);

    if (hint && !mobile) {
      proj.set(cardP.x + IW / 2 + 0.5, cardP.y - IH / 2 + 1.2, 0).project(camera);
      hint.style.transform = `translate(${((proj.x + 1) / 2) * canvas.clientWidth}px, ${((1 - proj.y) / 2) * canvas.clientHeight}px)`;
      hint.classList.toggle('is-on', t > 2 && !interacted);
    }
    if (first) { first = false; hero.classList.add('is-ready'); }
  });
}
