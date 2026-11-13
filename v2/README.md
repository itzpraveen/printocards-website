# Printo Cards website, v2

Home page for printocards.com: "The life of a card". Built with Astro 7, Three.js, GSAP ScrollTrigger and Lenis.

```sh
npm ci
npm run dev            # http://localhost:4321
npm run build          # production build in dist/, for printocards.com
npm run preview        # serve dist/
npm run deploy:production   # publish to https://printocards.com
```

- **Production:** https://printocards.com, live since 2026-11-13. GitHub Pages serves the `gh-pages` branch of this repo. `npm run deploy:production` builds for the domain root (indexable, with a sitemap) and publishes it with the `CNAME` file that keeps the domain attached.
- **DNS** is at GoDaddy: four A records to GitHub Pages (185.199.108–111.153) and `www` as a CNAME to `itzpraveen.github.io`. Mail (MX, SPF) is Google Workspace and is separate.
- **Old addresses:** `/about/`, `/services/` and `/contact/` from the WordPress site redirect to the matching sections (`redirects` in `astro.config.mjs`).
- **No preview address any more.** The old one, itzpraveen.github.io/printocards-website, now redirects to the domain. Never push a sub-path build to `gh-pages`: it would break the live site. To preview, run `npm run build && npm run preview` locally, or publish a build with `SITE_URL`, `BASE_PATH` and `PUBLIC_PREVIEW=1` set to a different repo.

## How it is put together

- `src/data/site.ts` holds all copy and product data: the 26 products, industries, FAQ and contact details.
- The hero first paints a still badge (`public/images/badge-front.webp`). The Three.js scenes load on the first pointer, touch, scroll or key press, so first load stays fast. Lighthouse scores 99–100. Keep it that way.
- With reduced motion or no WebGL2, the page shows a static version with photos instead of 3D.
- Asset paths go through `asset()` in `src/data/url.ts`. That lets the site run at a domain root or under a sub-path.

## Before launch

- Replace the stand-in photo in the About section with a real photo of the Omanoor factory.
- Add answers for minimum order, lead time and delivery area to the FAQ.
- Add testimonials or client logos if you have permission to use them.
