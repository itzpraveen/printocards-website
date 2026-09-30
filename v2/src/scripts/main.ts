import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { state, bus, setFinish, setName, story, DEFAULT_NAME, type Finish } from './state';
import { press, hold } from './press';
import { waLink } from '../data/site';

gsap.registerPlugin(ScrollTrigger);

const motion = document.documentElement.classList.contains('is-motion');
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/* ---------- smooth scroll ---------- */
let lenis: Lenis | null = null;
if (motion) {
  lenis = new Lenis({ lerp: 0.11 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- nav: full bar over the hero, floating pill after ---------- */
const nav = $('[data-nav]')!;
const hero = $('[data-hero]')!;
const syncNav = () => nav.classList.toggle('is-pill', window.scrollY > hero.offsetHeight * 0.7);
addEventListener('scroll', syncNav, { passive: true });
syncNav();

const menu = $<HTMLDialogElement>('[data-menu]')!;
$$('[data-menu-open]').forEach((b) => b.addEventListener('click', () => { menu.showModal(); lenis?.stop(); }));
$('[data-menu-close]')!.addEventListener('click', () => menu.close());
menu.addEventListener('close', () => lenis?.start());

/* ---------- in-page links ---------- */
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href')!;
  const el = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
  if (!el) return;
  e.preventDefault();
  if (menu.open) menu.close();
  let y = el.getBoundingClientRect().top + window.scrollY;
  const storySec = $('[data-story]')!;
  if (motion && storySec.contains(el)) {
    // chapters live inside a sticky stage: scroll to the chapter's slice of the section
    const i = Number(el.closest<HTMLElement>('.chapter')?.dataset.i ?? 0);
    y = storySec.offsetTop + (storySec.offsetHeight - innerHeight) * ((i + 0.55) / 4);
  }
  if (lenis) lenis.scrollTo(y, { duration: 1.5 });
  else window.scrollTo({ top: y });
  history.replaceState(null, '', id);
});

/* ---------- headlines press in ---------- */
if (motion) {
  const heads = $$('[data-press]').filter((el) => !el.closest('.hero'));
  heads.forEach(hold);
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting && !en.target.closest('.chapter')) { press(en.target as HTMLElement); io.unobserve(en.target); }
    }
  }, { rootMargin: '0px 0px -12% 0px' });
  heads.forEach((el) => io.observe(el));
}

/* ---------- story chapters (DOM side; the 3D side reads story.s) ---------- */
const storySec = $('[data-story]')!;
const stage = $('[data-stage]', storySec)!;
const chapters = $$('.chapter', storySec);
const railItems = $$('[data-rail]', storySec);
const regInks = $$('[data-regmark] path[fill]', storySec);
let current = -1;
function setChapter(i: number) {
  if (i === current) return;
  current = i;
  stage.dataset.chapter = String(i);
  chapters.forEach((c, k) => c.classList.toggle('is-active', k === i));
  railItems.forEach((li, k) => li.classList.toggle('on', k === i));
  regInks.forEach((p, k) => (p.style.opacity = k <= i ? '1' : '0'));
  press($('[data-press]', chapters[i]));
}
if (motion) {
  ScrollTrigger.create({
    trigger: storySec, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { story.s = self.progress * 4; setChapter(Math.min(3, Math.floor(story.s))); },
  });
  setChapter(0);
}

const finishNote = $('[data-finish-note]');
$$<HTMLInputElement>('input[name="finish"]').forEach((r) =>
  r.addEventListener('change', () => {
    if (!r.checked) return;
    setFinish(r.value as Finish);
    if (finishNote) finishNote.textContent = r.dataset.note ?? '';
  }),
);
$<HTMLInputElement>('[data-try-name]')?.addEventListener('input', (e) => setName((e.target as HTMLInputElement).value.trim() || DEFAULT_NAME));

/* ---------- industries: pinned sideways track on desktop, swipe on phones ---------- */
{
  const pin = $('[data-work-pin]')!;
  const track = $('[data-track]')!;
  const panels = $$('[data-panel]', track);
  const names = panels.map((p) => p.querySelector('h3')!.textContent!.trim());
  const label = $('[data-work-label]')!;
  const ticks = $$('[data-tick]');
  const setIdx = (i: number) => {
    label.textContent = `${names[i]}, ${i + 1} of ${names.length}`;
    ticks.forEach((t, k) => t.classList.toggle('on', k <= i));
  };
  if (motion) {
    gsap.matchMedia().add('(min-width: 900px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (st) => setIdx(Math.min(names.length - 1, Math.round(st.progress * (names.length - 1)))),
        },
      });
      panels.forEach((panel) => {
        const st = { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true };
        gsap.fromTo(panel.querySelector('[data-plate-img]'), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: st });
        gsap.fromTo(panel.querySelector('.panel-place'), { x: 70 }, { x: -40, ease: 'none', scrollTrigger: { ...st } });
      });
    });
  }
  track.addEventListener('scroll', () => {
    const stepW = panels[1].offsetLeft - panels[0].offsetLeft;
    setIdx(Math.max(0, Math.min(names.length - 1, Math.round(track.scrollLeft / stepW))));
  }, { passive: true });
}

/* ---------- product range: accordion + cursor-follow photo ---------- */
{
  const fams = $$('[data-fam]');
  fams.forEach((fam) => {
    const row = $<HTMLButtonElement>('[data-fam-row]', fam)!;
    const panel = $('[data-fam-panel]', fam)!;
    row.addEventListener('click', () => {
      const open = row.getAttribute('aria-expanded') === 'true';
      row.setAttribute('aria-expanded', String(!open));
      hideFloat();
      if (open) {
        gsap.to(panel, { height: 0, duration: motion ? 0.45 : 0, ease: 'power3.inOut', onComplete: () => { panel.hidden = true; panel.style.height = ''; ScrollTrigger.refresh(); } });
      } else {
        panel.hidden = false;
        gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: motion ? 0.6 : 0, ease: 'power3.out', onComplete: () => { panel.style.height = ''; ScrollTrigger.refresh(); } });
        if (motion) gsap.from($$('.product', panel), { y: 30, opacity: 0, duration: 0.55, ease: 'power3.out', stagger: 0.05 });
      }
    });
  });

  const float = $('[data-range-float]')!;
  const img = $<HTMLImageElement>('img', float)!;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function hideFloat() { gsap.to(float, { opacity: 0, scale: 0.85, duration: 0.25 }); }
  if (fine && motion) {
    gsap.set(float, { scale: 0.85, rotate: -6 });
    const xTo = gsap.quickTo(float, 'x', { duration: 0.55, ease: 'power3' });
    const yTo = gsap.quickTo(float, 'y', { duration: 0.55, ease: 'power3' });
    addEventListener('pointermove', (e) => { xTo(e.clientX + 28); yTo(e.clientY - 100); }, { passive: true });
    fams.forEach((fam) => {
      const row = $('[data-fam-row]', fam)!;
      row.addEventListener('pointerenter', () => {
        if (row.getAttribute('aria-expanded') === 'true') return;
        img.src = fam.dataset.img!;
        gsap.to(float, { opacity: 1, scale: 1, duration: 0.3 });
      });
      row.addEventListener('pointerleave', hideFloat);
    });
  }
}

/* ---------- print in-house: printers at different speeds, a card ejects ---------- */
if (motion) {
  $$('[data-speed]').forEach((el) => {
    const k = 1 - parseFloat(el.dataset.speed!);
    gsap.fromTo(el, { y: k * -90 }, { y: k * 90, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.fromTo('[data-eject]', { yPercent: 40 }, { yPercent: -215, ease: 'power2.out', scrollTrigger: { trigger: '.printers', start: 'top 85%', end: 'top 35%', scrub: 0.6 } });
}

/* ---------- proof: ticks land, then the ISO stamp ---------- */
if (motion) {
  const ticks = $$('.ticket li i');
  const stamp = $('[data-stamp]')!;
  gsap.set(ticks, { scale: 0 });
  gsap.set(stamp, { opacity: 0, scale: 1.9, rotate: -34 });
  ScrollTrigger.create({
    trigger: '[data-ticket]', start: 'top 72%', once: true,
    onEnter: () => {
      gsap.timeline()
        .to(ticks, { scale: 1, duration: 0.35, ease: 'back.out(2.6)', stagger: 0.11 })
        .to(stamp, { opacity: 1, scale: 1, rotate: -14, duration: 0.32, ease: 'power4.in' }, '+=0.1')
        .to('[data-ticket]', { x: 4, duration: 0.05, yoyo: true, repeat: 3, ease: 'none' });
    },
  });
}

/* ---------- quote form → WhatsApp ---------- */
{
  const form = $<HTMLFormElement>('[data-quote]')!;
  const carry = $('[data-carry]')!;
  const err = $('[data-form-error]')!;
  const finishName: Record<Finish, string> = { glossy: 'Glossy', matte: 'Matte', frosted: 'Frosted', uv: 'UV spot' };
  const customName = () => state.name && state.name !== DEFAULT_NAME;
  const syncCarry = () => {
    if (!state.touched) return;
    carry.hidden = false;
    carry.textContent = `From the card you tried: ${finishName[state.finish]} finish${customName() ? `, printed with "${state.name}"` : ''}. This goes into your message.`;
  };
  bus.addEventListener('finish', syncCarry);
  bus.addEventListener('name', syncCarry);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = $$<HTMLInputElement | HTMLSelectElement>('[required]', form);
    const missing = required.filter((f) => !f.value.trim());
    required.forEach((f) => f.setAttribute('aria-invalid', String(missing.includes(f))));
    if (missing.length) {
      const names = missing.map((f) => form.querySelector(`label[for="${f.id}"]`)!.childNodes[0].textContent!.trim().replace('?', '').toLowerCase());
      err.textContent = `Please fill in: ${names.join(', ')}.`;
      missing[0].focus();
      return;
    }
    err.textContent = '';
    const d = new FormData(form);
    const get = (k: string) => String(d.get(k) ?? '').trim();
    const lines = ['Hi Printo, I would like a quote.', `Product: ${get('product')}`, `Quantity: ${get('qty')}`];
    if (get('date')) lines.push(`Needed by: ${new Date(get('date')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
    lines.push(`Name: ${get('name')}`);
    if (get('org')) lines.push(`Organisation: ${get('org')}`);
    if (state.touched) lines.push(`Finish: ${finishName[state.finish]}`);
    if (customName()) lines.push(`Text on card: ${state.name}`);
    if (get('notes')) lines.push(`Notes: ${get('notes')}`);
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  });
}

/* ---------- phone bottom bar: only once the hero button is gone, never over the contact form ---------- */
{
  const bar = $('[data-sticky-bar]');
  const heroCtas = $('.hero .ctas');
  const contactSec = $('#contact');
  if (bar && heroCtas && contactSec) {
    let pastHero = false, atContact = false;
    const sync = () => bar.classList.toggle('is-on', pastHero && !atContact);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(heroCtas);
    new IntersectionObserver(([e]) => { atContact = e.isIntersecting; sync(); }, { rootMargin: '0px 0px -30% 0px' }).observe(contactSec);
  }
}

/* ---------- WebGL scenes load after first paint ---------- */
if (motion) {
  // First paint shows the still badge. The 3D engine loads on the first sign of a person
  // (pointer, touch, scroll, key), so nobody pays for WebGL before they engage with the page.
  const wake = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown', 'scroll'] as const;
  let awake = false;
  const start = () => {
    if (awake) return;
    awake = true;
    wake.forEach((ev) => removeEventListener(ev, start));
    import('./hero-scene').then((m) => m.initHero(hero)).catch((e) => console.warn('hero scene', e));
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      import('./story-scene').then((m) => m.initStory(storySec)).catch((e) => console.warn('story scene', e));
    }, { rootMargin: '100% 0px' });
    near.observe(storySec);
  };
  wake.forEach((ev) => addEventListener(ev, start, { passive: true }));
  if (window.scrollY > 0) start();
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
