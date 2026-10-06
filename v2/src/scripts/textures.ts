// Card faces are drawn on 2D canvases, then used as WebGL textures.
// CR80 cards are 86 x 54 mm, so every canvas keeps that ratio.
import * as THREE from 'three';

const INK = '#231F20';
const ORANGE = '#F26B35';
const LIME = '#CBDB3A';
const C = '#00AEEF', M = '#EC008C', Y = '#FFF212';

type Ctx = CanvasRenderingContext2D;

function make(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}
function font(ctx: Ctx, spec: string, spacing = 0) {
  ctx.font = `${spec} 'Titillium Web', system-ui, sans-serif`;
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${spacing}px`;
}
function fitText(ctx: Ctx, text: string, maxW: number, size: number, spec: (s: number) => string) {
  let s = size;
  font(ctx, spec(s));
  while (ctx.measureText(text).width > maxW && s > 20) { s -= 2; font(ctx, spec(s)); }
  return s;
}
function barcode(ctx: Ctx, x: number, y: number, w: number, h: number, seed = 7) {
  let r = seed;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  ctx.fillStyle = INK;
  let cx = x;
  while (cx < x + w) {
    const bw = 2 + Math.floor(rand() * 4) * 2;
    if (rand() > 0.38) ctx.fillRect(cx, y, Math.min(bw, x + w - cx), h);
    cx += bw + 2 + Math.floor(rand() * 3) * 2;
  }
}
function nfcArcs(ctx: Ctx, x: number, y: number, s: number, colour: string, lw: number) {
  ctx.strokeStyle = colour; ctx.lineWidth = lw; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x - s * 0.9, y, s * (0.35 + i * 0.33), -0.85, 0.85);
    ctx.stroke();
  }
}

export async function loadAssets() {
  await Promise.all([
    ...[400, 600, 700].map((w) => document.fonts.load(`${w} 100px 'Titillium Web'`)),
  ]).catch(() => {});
  const img = new Image();
  img.src = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/brand/printo-logo-light.svg`;
  await img.decode().catch(() => {});
  return { logoLight: img };
}
export type Assets = Awaited<ReturnType<typeof loadAssets>>;

export function texture(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

/* ---------------- hero: portrait staff badge on a lanyard ----------------
   Built like a real security card: guilloche background, a holographic seal and
   foil strip, a gold contact chip. Three aligned canvases:
   colour, foil mask (R = iridescence), surface (G = roughness, B = metalness). */
const BW = 1024, BH = 1630;

function guilloche(ctx: Ctx, y0: number, rows: number, colourA: string, colourB: string) {
  ctx.lineWidth = 1.6;
  for (let i = 0; i < rows; i++) {
    ctx.strokeStyle = i % 2 ? colourA : colourB;
    ctx.beginPath();
    for (let x = -10; x <= BW + 10; x += 8) {
      const y = y0 + i * 17 + Math.sin(x / 150 + i * 0.22) * 48 + Math.sin(x / 61 - i * 0.5) * 9;
      x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function qr(ctx: Ctx, x: number, y: number, size: number, seed = 42) {
  const n = 25, m = size / n;
  let r = seed;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const finder = (fx: number, fy: number) => fx < 7 && fy < 7;
  const isFinder = (i: number, j: number) => finder(i, j) || finder(n - 1 - i, j) || finder(i, n - 1 - j);
  ctx.fillStyle = INK;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (isFinder(i, j)) continue;
    if (rand() > 0.52) ctx.fillRect(x + i * m, y + j * m, m + 0.5, m + 0.5);
  }
  for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    ctx.fillRect(x + fx * m, y + fy * m, 7 * m, 7 * m);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + (fx + 1) * m, y + (fy + 1) * m, 5 * m, 5 * m);
    ctx.fillStyle = INK; ctx.fillRect(x + (fx + 2) * m, y + (fy + 2) * m, 3 * m, 3 * m);
  }
}

export function badgeFront(assets: Assets, name = 'John Doe') {
  const [c, ctx] = make(BW, BH);
  const [f, fx] = make(BW, BH);
  const [s, sx] = make(BW, BH);
  fx.fillStyle = '#000'; fx.fillRect(0, 0, BW, BH);
  sx.fillStyle = 'rgb(0,92,0)'; sx.fillRect(0, 0, BW, BH);       // printed ink: roughness ~0.36, no metal

  const bg = ctx.createLinearGradient(0, 0, 0, BH);
  bg.addColorStop(0, '#2c2829'); bg.addColorStop(1, '#191617');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, BW, BH);
  guilloche(ctx, 250, 48, 'rgba(203,219,58,0.09)', 'rgba(255,255,255,0.045)');

  // punched slot
  ctx.fillStyle = '#0c0a0b'; ctx.beginPath(); ctx.roundRect(BW / 2 - 100, 46, 200, 40, 20); ctx.fill();

  if (assets.logoLight.naturalWidth) ctx.drawImage(assets.logoLight, 76, 150, 400, 400 * 161.75 / 477.28);
  nfcArcs(ctx, 950, 222, 74, LIME, 13);

  // gold contact chip
  const gx = 80, gy = 400, gw = 204, gh = 158;
  const gold = ctx.createLinearGradient(gx, gy, gx + gw, gy + gh);
  gold.addColorStop(0, '#f9e6ad'); gold.addColorStop(0.42, '#c8953b'); gold.addColorStop(0.68, '#f2d68c'); gold.addColorStop(1, '#a5742a');
  ctx.fillStyle = gold; ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh, 28); ctx.fill();
  ctx.strokeStyle = 'rgba(96,62,14,0.6)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.roundRect(gx + gw * 0.34, gy + gh * 0.28, gw * 0.32, gh * 0.44, 12); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gx, gy + gh * 0.5); ctx.lineTo(gx + gw * 0.34, gy + gh * 0.5);
  ctx.moveTo(gx + gw * 0.66, gy + gh * 0.5); ctx.lineTo(gx + gw, gy + gh * 0.5);
  ctx.moveTo(gx + gw * 0.5, gy); ctx.lineTo(gx + gw * 0.5, gy + gh * 0.28);
  ctx.moveTo(gx + gw * 0.5, gy + gh * 0.72); ctx.lineTo(gx + gw * 0.5, gy + gh);
  ctx.moveTo(gx + gw * 0.34, gy + gh * 0.28); ctx.lineTo(gx + gw * 0.18, gy);
  ctx.moveTo(gx + gw * 0.66, gy + gh * 0.72); ctx.lineTo(gx + gw * 0.82, gy + gh);
  ctx.stroke();
  sx.fillStyle = 'rgb(0,72,190)'; sx.beginPath(); sx.roundRect(gx, gy, gw, gh, 28); sx.fill();

  // holographic seal
  const cx = 836, cy = 480, R = 116;
  const seal = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  seal.addColorStop(0, '#e9e9ea'); seal.addColorStop(0.5, '#c9cacc'); seal.addColorStop(1, '#f4f4f5');
  ctx.fillStyle = seal; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(40,40,44,0.35)'; ctx.lineWidth = 2;
  for (let rr = 26; rr < R; rr += 11) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke(); }
  for (let a = 0; a < 48; a++) {
    const t = (a / 48) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * 30, cy + Math.sin(t) * 30); ctx.lineTo(cx + Math.cos(t) * (R - 6), cy + Math.sin(t) * (R - 6)); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(35,31,32,0.75)'; font(ctx, '700 58px', -1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('P', cx, cy + 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const holo = ctx.createConicGradient(0.6, cx, cy);
  ['#ff9ad5', '#9ee7ff', '#fff59a', '#b9a4ff', '#9affc8', '#ff9ad5'].forEach((h, i, a) => holo.addColorStop(i / (a.length - 1), h));
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.55;
  ctx.fillStyle = holo; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  fx.fillStyle = '#fff'; fx.beginPath(); fx.arc(cx, cy, R, 0, Math.PI * 2); fx.fill();
  sx.fillStyle = 'rgb(0,40,235)'; sx.beginPath(); sx.arc(cx, cy, R, 0, Math.PI * 2); sx.fill();

  // name and role
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.join(' ');
  ctx.fillStyle = '#fff';
  const s1 = fitText(ctx, first, 860, 152, (z) => `700 ${z}px`);
  ctx.fillText(first, 80, 800);
  if (last) { fitText(ctx, last, 860, s1, (z) => `700 ${z}px`); ctx.fillText(last, 80, 800 + s1 * 0.95); }
  ctx.fillStyle = LIME; font(ctx, '700 50px');
  ctx.fillText('Production team', 84, last ? 800 + s1 * 0.95 + 88 : 888);

  // foil strip with microtext
  const fy = 1082, fh = 44;
  const strip = ctx.createLinearGradient(0, fy, BW, fy + fh);
  strip.addColorStop(0, '#d9dadc'); strip.addColorStop(0.5, '#f5f5f6'); strip.addColorStop(1, '#cfd0d2');
  ctx.fillStyle = strip; ctx.fillRect(0, fy, BW, fh);
  ctx.fillStyle = 'rgba(35,31,32,0.35)'; font(ctx, '700 20px', 3);
  const micro = 'PRINTO  SECURE  CARD', step = ctx.measureText(micro).width + 36;
  for (let x = 10; x < BW; x += step) ctx.fillText(micro, x, fy + 29);
  const band = ctx.createLinearGradient(0, 0, BW, 0);
  ['#ff9ad5', '#9ee7ff', '#fff59a', '#b9a4ff', '#9affc8', '#ff9ad5', '#9ee7ff'].forEach((h, i, a) => band.addColorStop(i / (a.length - 1), h));
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.5; ctx.fillStyle = band; ctx.fillRect(0, fy, BW, fh); ctx.restore();
  fx.fillRect(0, fy, BW, fh);
  sx.fillStyle = 'rgb(0,40,235)'; sx.fillRect(0, fy, BW, fh);

  // lime footer: staff number, validity, QR. Lime, not orange, so the card stands out on the orange hero
  ctx.fillStyle = LIME; ctx.fillRect(0, 1126, BW, BH - 1126);
  ctx.fillStyle = INK;
  font(ctx, '600 38px'); ctx.fillText('Staff ID', 80, 1250);
  font(ctx, '700 124px', -1); ctx.fillText('0427', 72, 1382);
  font(ctx, '600 38px'); ctx.fillText('Valid to Dec 2027', 80, 1460);
  barcode(ctx, 80, 1500, 440, 70, 9);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(640, 1196, 304, 304, 24); ctx.fill();
  qr(ctx, 666, 1222, 252);
  // film thickness varies in diagonal waves (G channel), so rainbow bands sweep across the foil as it tilts
  const [t, tx] = make(512, 816);
  const waves = tx.createLinearGradient(0, 0, 512, 816);
  for (let i = 0; i <= 24; i++) { const v = Math.round(128 + 127 * Math.sin(i * 1.3)); waves.addColorStop(i / 24, `rgb(0,${v},0)`); }
  tx.fillStyle = waves; tx.fillRect(0, 0, 512, 816);
  return { color: c, foil: f, surface: s, thickness: t };
}

export function badgeBack() {
  const [c, ctx] = make(BW, BH);
  const [s, sx] = make(BW, BH);
  sx.fillStyle = 'rgb(0,92,0)'; sx.fillRect(0, 0, BW, BH);
  const bg = ctx.createLinearGradient(0, 0, 0, BH);
  bg.addColorStop(0, '#2c2829'); bg.addColorStop(1, '#191617');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, BW, BH);
  guilloche(ctx, 520, 40, 'rgba(203,219,58,0.07)', 'rgba(255,255,255,0.04)');
  ctx.fillStyle = '#0c0a0b'; ctx.beginPath(); ctx.roundRect(BW / 2 - 100, 46, 200, 40, 20); ctx.fill();
  ctx.fillStyle = '#0a0909'; ctx.fillRect(0, 150, BW, 150);                   // magnetic stripe
  sx.fillStyle = 'rgb(0,30,0)'; sx.fillRect(0, 150, BW, 150);
  ctx.fillStyle = '#fff'; font(ctx, '700 60px');
  ctx.fillText('If found,', 80, 420); ctx.fillText('please return to', 80, 492);
  font(ctx, '400 40px'); ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ['Printo Cards & Technologies', 'C-19, Darussalam Complex', 'Mavoor Road, Calicut 673004', '0495 406 0457'].forEach((l, i) => ctx.fillText(l, 80, 600 + i * 62));
  ctx.fillStyle = '#f2f1ee'; ctx.beginPath(); ctx.roundRect(80, 940, BW - 160, 140, 14); ctx.fill();
  ctx.fillStyle = '#8b8580'; font(ctx, '400 30px'); ctx.fillText('Signature', 100, 1062);
  ctx.fillStyle = LIME; ctx.fillRect(0, 1180, BW, BH - 1180);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(80, 1300, BW - 160, 200, 18); ctx.fill();
  barcode(ctx, 120, 1330, BW - 240, 140, 3);
  return { color: c, surface: s };
}

/* ---------------- story: the card that gets printed ---------------- */
export const ART_W = 1600, ART_H = 1004;

export function memberFront(name = 'John Doe') {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = M; ctx.beginPath(); ctx.arc(330, 250, 340, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = Y; ctx.beginPath(); ctx.arc(900, 190, 175, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C; ctx.beginPath(); ctx.arc(1340, 940, 470, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(1040, 560, 90, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = INK; ctx.textAlign = 'left';
  font(ctx, '700 150px', -2);
  ctx.fillText('Coastline', 86, 250);
  ctx.fillText('Club', 86, 390);
  nfcArcs(ctx, 1500, 150, 90, INK, 14);
  fitText(ctx, name, 900, 80, (s) => `700 ${s}px`);
  ctx.fillText(name, 90, 850);
  font(ctx, '700 44px', 6);
  ctx.fillText('MEMBER  0427 1180', 90, 930);
  return c;
}

export function memberBack() {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = '#fbfbf9'; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.fillStyle = INK; ctx.fillRect(0, 100, ART_W, 170);
  ctx.fillStyle = '#fff'; ctx.fillRect(90, 340, 960, 130);
  ctx.strokeStyle = '#d8d4cf'; ctx.lineWidth = 3;
  for (let x = 90; x < 1050; x += 22) { ctx.beginPath(); ctx.moveTo(x, 340); ctx.lineTo(x + 40, 470); ctx.stroke(); }
  ctx.fillStyle = INK; font(ctx, '400 38px');
  ctx.fillText('Coastline Club membership card. Show it at the front desk.', 90, 580);
  ctx.fillStyle = '#6a6466'; font(ctx, '400 32px');
  ctx.fillText('Printed by Printo Cards & Technologies, Calicut', 90, 900);
  barcode(ctx, 1110, 780, 400, 150, 5);
  return c;
}

/** Where the UV varnish goes: white = gloss. */
export function uvMask() {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 12;
  for (let r = 60; r < 900; r += 42) { ctx.beginPath(); ctx.arc(1340, 260, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#fff';
  font(ctx, '700 150px', -2);
  ctx.fillText('Coastline', 86, 250);
  ctx.fillText('Club', 86, 390);
  return c;
}

export function antenna() {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath(); ctx.roundRect(0, 0, ART_W, ART_H, 60); ctx.fill();
  ctx.strokeStyle = '#F79633'; ctx.lineWidth = 9;
  for (let i = 0; i < 5; i++) {
    const inset = 70 + i * 28;
    ctx.beginPath(); ctx.roundRect(inset, inset, ART_W - inset * 2, ART_H - inset * 2, 40 - i * 5); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(182, ART_H / 2); ctx.lineTo(740, ART_H / 2); ctx.stroke();
  ctx.fillStyle = '#F79633'; ctx.beginPath(); ctx.roundRect(740, ART_H / 2 - 60, 120, 120, 10); ctx.fill();
  ctx.fillStyle = '#b86a1f';
  for (let i = 0; i < 3; i++) ctx.fillRect(760, ART_H / 2 - 42 + i * 32, 80, 12);
  return c;
}

/* ---------------- hero: floating product cards ---------------- */
export function nfcCard() {
  const [c, ctx] = make(ART_W, ART_H);
  const g = ctx.createLinearGradient(0, 0, ART_W, ART_H);
  g.addColorStop(0, '#2d292a'); g.addColorStop(1, '#141112');
  ctx.fillStyle = g; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    for (let x = 0; x <= ART_W; x += 20) {
      const y = 520 + i * 9 + Math.sin(x / 210 + i * 0.35) * (90 + i * 3);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  nfcArcs(ctx, 1480, 170, 100, LIME, 18);
  ctx.fillStyle = '#fff'; font(ctx, '700 76px'); ctx.fillText('Tap to enter', 90, 900);
  ctx.globalAlpha = 0.6; font(ctx, '700 40px', 4); ctx.textAlign = 'right'; ctx.fillText('NTAG 215', ART_W - 90, 900);
  ctx.globalAlpha = 1;
  return c;
}

export function loyaltyCard() {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = LIME; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.fillStyle = INK; font(ctx, '700 124px', -2); ctx.fillText('Stamp card', 90, 220);
  font(ctx, '600 44px'); ctx.fillText('Your 10th coffee is on us', 92, 300);
  for (let i = 0; i < 10; i++) {
    const x = 170 + (i % 5) * 190, y = 590 + Math.floor(i / 5) * 190;
    ctx.beginPath(); ctx.arc(x, y, 64, 0, Math.PI * 2);
    if (i < 3) { ctx.fill(); } else { ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  return c;
}

export function giftCard() {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = M; ctx.beginPath(); ctx.arc(1180, 260, 330, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C; ctx.beginPath(); ctx.arc(1480, 700, 380, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = Y; ctx.beginPath(); ctx.arc(900, 760, 220, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = INK; font(ctx, '700 170px', -2);
  ctx.fillText('Gift', 90, 760); ctx.fillText('card', 90, 910);
  return c;
}

/* ---------------- lanyard strap, text runs along the length ---------------- */
export function strap() {
  const [c, ctx] = make(1024, 128);
  ctx.fillStyle = '#373435'; ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = LIME; font(ctx, '700 76px', 2);
  ctx.textBaseline = 'middle';
  ctx.fillText('printo', 40, 68);
  ctx.fillText('printo', 552, 68);
  return c;
}
