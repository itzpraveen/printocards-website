# Printo Cards website, v2

Home page for printocards.com: "The life of a card". Built with Astro 7, Three.js, GSAP ScrollTrigger and Lenis.

```sh
npm ci
npm run dev            # http://localhost:4321
npm run build          # production build in dist/, for printocards.com
npm run preview        # serve dist/
npm run deploy:pages   # publish the preview to GitHub Pages
```

- **Preview:** https://itzpraveen.github.io/printocards-website/ (noindex, so it stays out of search results).
- **Production:** `npm run build` targets https://printocards.com at the domain root. It is indexable and includes a sitemap.
- **Hosting:** the site is fully static, so `dist/` can go on any host.

## How it is put together

- `src/data/site.ts` holds all copy and product data: the 26 products, industries, FAQ and contact details.
- The hero first paints a still badge (`public/images/badge-front.webp`). The Three.js scenes load on the first pointer, touch, scroll or key press, so first load stays fast. Lighthouse scores 99–100. Keep it that way.
- With reduced motion or no WebGL2, the page shows a static version with photos instead of 3D.
- Asset paths go through `asset()` in `src/data/url.ts`. That lets the site run at a domain root or under a sub-path.

## Before launch

- Replace the stand-in photo in the About section with a real photo of the Omanoor factory.
- Add answers for minimum order, lead time and delivery area to the FAQ.
- Add testimonials or client logos if you have permission to use them.
