// Card faces are drawn on 2D canvases, then used as WebGL textures.
// CR80 cards are 86 x 54 mm, so every canvas keeps that ratio.
import * as THREE from 'three';

const INK = '#231F20';
const ORANGE = '#F26B35';
const LIME = '#CBDB3A';
const C = '#00AEEF', M = '#EC008C', Y = '#FFF212';

type Ctx = CanvasRenderingContext2D;
type Stretch = 'condensed' | 'normal' | 'semi-expanded' | 'expanded';

function make(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}
function font(ctx: Ctx, spec: string, stretch: Stretch = 'normal', spacing = 0) {
  ctx.font = `${spec} Archivo, system-ui, sans-serif`;
  if ('fontStretch' in ctx) (ctx as Ctx & { fontStretch: string }).fontStretch = stretch;
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${spacing}px`;
}
function fitText(ctx: Ctx, text: string, maxW: number, size: number, spec: (s: number) => string, stretch: Stretch) {
  let s = size;
  font(ctx, spec(s), stretch);
  while (ctx.measureText(text).width > maxW && s > 20) { s -= 2; font(ctx, spec(s), stretch); }
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
    document.fonts.load('900 100px Archivo'),
    document.fonts.load('500 40px Archivo'),
  ]).catch(() => {});
  const img = new Image();
  img.src = '/brand/printo-logo-light.svg';
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

/* ---------------- hero: portrait staff ID on a lanyard ---------------- */
export function idFront(assets: Assets, name = 'Anjali Menon') {
  const W = 1024, H = 1630;
  const [c, ctx] = make(W, H);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 540);
  if (assets.logoLight.naturalWidth) ctx.drawImage(assets.logoLight, 74, 170, 470, 470 * 161.75 / 477.28);
  ctx.fillStyle = '#3a302c'; ctx.beginPath(); ctx.roundRect(W / 2 - 100, 44, 200, 40, 20); ctx.fill();
  ctx.fillStyle = ORANGE; ctx.fillRect(0, 540, W, 26);
  // photo
  ctx.save();
  ctx.beginPath(); ctx.arc(W / 2, 560, 232, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(W / 2, 560, 210, 0, Math.PI * 2); ctx.fillStyle = '#E9E4DC'; ctx.fill(); ctx.clip();
  ctx.fillStyle = '#9d938a';
  ctx.beginPath(); ctx.arc(W / 2, 505, 82, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W / 2, 745, 155, 135, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = INK; ctx.textAlign = 'center';
  fitText(ctx, name, 880, 88, (s) => `800 ${s}px`, 'semi-expanded');
  ctx.fillText(name, W / 2, 920);
  font(ctx, '500 44px'); ctx.fillStyle = '#6a6466'; ctx.fillText('Production team', W / 2, 992);
  ctx.textAlign = 'left'; font(ctx, '700 40px', 'condensed', 2); ctx.fillText('EMP 0427', 80, 1340);
  ctx.textAlign = 'right'; ctx.fillText('VALID 2027', W - 80, 1340);
  barcode(ctx, 80, 1390, W - 160, 130, 11);
  return c;
}

export function idBack() {
  const W = 1024, H = 1630;
  const [c, ctx] = make(W, H);
  ctx.fillStyle = '#fbfbf9'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#3a302c'; ctx.beginPath(); ctx.roundRect(W / 2 - 100, 44, 200, 40, 20); ctx.fill();
  ctx.fillStyle = ORANGE; ctx.fillRect(0, 160, W, 18);
  ctx.fillStyle = INK; ctx.textAlign = 'left';
  font(ctx, '800 58px', 'semi-expanded'); ctx.fillText('If found,', 80, 330); ctx.fillText('please return to', 80, 400);
  font(ctx, '500 40px');
  ['Printo Cards & Technologies', 'C-19, Darussalam Complex', 'Mavoor Road, Calicut 673 004', '0495 406 0457'].forEach((l, i) => ctx.fillText(l, 80, 520 + i * 62));
  ctx.fillStyle = '#e4e2de'; ctx.fillRect(80, 900, W - 160, 150);
  ctx.fillStyle = '#6a6466'; font(ctx, '500 32px'); ctx.fillText('Signature', 96, 1090);
  barcode(ctx, 80, 1390, W - 160, 130, 3);
  return c;
}

/* ---------------- story: the card that gets printed ---------------- */
export const ART_W = 1600, ART_H = 1004;

export function memberFront(name = 'Anjali Menon') {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = M; ctx.beginPath(); ctx.arc(330, 250, 340, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = Y; ctx.beginPath(); ctx.arc(900, 190, 175, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C; ctx.beginPath(); ctx.arc(1340, 940, 470, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(1040, 560, 90, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = INK; ctx.textAlign = 'left';
  font(ctx, '900 150px', 'expanded', -6);
  ctx.fillText('Coastline', 86, 250);
  ctx.fillText('Club', 86, 390);
  nfcArcs(ctx, 1500, 150, 90, INK, 14);
  fitText(ctx, name, 900, 80, (s) => `800 ${s}px`, 'semi-expanded');
  ctx.fillText(name, 90, 850);
  font(ctx, '700 44px', 'condensed', 6);
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
  ctx.fillStyle = INK; font(ctx, '500 38px');
  ctx.fillText('Coastline Club membership card. Show it at the front desk.', 90, 580);
  ctx.fillStyle = '#6a6466'; font(ctx, '500 32px');
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
  font(ctx, '900 150px', 'expanded', -6);
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
  ctx.fillStyle = '#fff'; font(ctx, '800 76px', 'semi-expanded'); ctx.fillText('Tap to enter', 90, 900);
  ctx.globalAlpha = 0.6; font(ctx, '700 40px', 'condensed', 4); ctx.textAlign = 'right'; ctx.fillText('NTAG 215', ART_W - 90, 900);
  ctx.globalAlpha = 1;
  return c;
}

export function woodCard() {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = '#c4935f'; ctx.fillRect(0, 0, ART_W, ART_H);
  let r = 3;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 140; i++) {
    const y0 = rand() * ART_H * 1.2 - 100;
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(120,70,30,0.22)' : 'rgba(230,190,140,0.25)';
    ctx.lineWidth = 2 + rand() * 7;
    ctx.beginPath();
    for (let x = -20; x <= ART_W + 20; x += 30) {
      const y = y0 + Math.sin(x / 260 + i) * 22 + Math.sin(x / 90 + i * 2) * 5;
      x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(80,45,15,0.58)'; ctx.textAlign = 'center';
  font(ctx, '900 150px', 'expanded', -4); ctx.fillText('Room 204', ART_W / 2, 560);
  font(ctx, '600 46px', 'normal', 8); ctx.fillText('GUEST KEY', ART_W / 2, 660);
  return c;
}

export function loyaltyCard() {
  const [c, ctx] = make(ART_W, ART_H);
  ctx.fillStyle = LIME; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.fillStyle = INK; font(ctx, '900 124px', 'expanded', -5); ctx.fillText('Stamp card', 90, 220);
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
  ctx.fillStyle = INK; font(ctx, '900 170px', 'expanded', -6);
  ctx.fillText('Gift', 90, 760); ctx.fillText('card', 90, 910);
  return c;
}

/* ---------------- lanyard strap, text runs along the length ---------------- */
export function strap() {
  const [c, ctx] = make(1024, 128);
  ctx.fillStyle = '#373435'; ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = LIME; font(ctx, '900 76px', 'expanded', 2);
  ctx.textBaseline = 'middle';
  ctx.fillText('printo', 40, 68);
  ctx.fillText('printo', 552, 68);
  return c;
}
