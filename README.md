# Printo Cards & Technologies

A complete, responsive redesign of printocards.com. React, TypeScript, Vite, Three.js and Motion. Product content combines the supplied `Website.zip` with the original website’s Home, About, Services and Contact pages, checked on 30 September 2026. The supplied `printo_cards.svg` defines the logo and colour palette.

## Run locally

```sh
npm ci
npm run dev
```

Development runs at `http://localhost:5173`. The server also exposes a local-network URL for checking the site on a phone connected to the same network.

```sh
npm run build
npm run preview -- --port 4173
```

`dist/` is the complete deployable website. The build generates **44 pre-rendered routes**, a 404 page, unique metadata, structured data and a sitemap. It requires no application server for normal browsing or enquiries. Direct page visits work without relying on a client-side routing fallback.

## What is included

- Full-bleed home page with pointer-responsive 3D cards, colour changes, card flipping, scroll-linked storytelling and product photography.
- 32 product entries: all 26 supplied products plus six restored original-site ranges, organised into six categories. Combined search, product-family and customer-type filters persist in the URL.
- Individual product pages with catalogue-grounded specifications, finish selection, relevant products and contextual enquiry links.
- Four customer journeys: individuals and creators, businesses, institutions, and resellers.
- Interactive card studio with live name/brand preview and colour selection. Finish is explicitly an enquiry preference, rather than a claimed physical simulation.
- Dedicated Services page, industry applications, company story, manufacturing and quality information, all four phone numbers and both email addresses, downloadable original catalogue, FAQs, privacy information and a useful 404 page.
- Four-step enquiry: project, specifications, contact details, review. Product and studio selections carry into the enquiry. The completed enquiry can be opened in WhatsApp/email, copied, or downloaded.
- Responsive desktop/tablet/phone layouts, keyboard navigation, mobile-menu focus handling, reduced-motion behaviour, and a CSS card fallback if WebGL is unavailable.
- Local WOFF2 fonts, optimised WebP images, lazy image loading, a separate lazy-loaded Three.js bundle, capped render resolution and frame rate, and an animation loop that stops when hidden or off-screen.

## Enquiry behaviour

This is a **quote-based business website**, not a priced checkout. The supplied material contains no prices, payment provider or fulfilment integration. Minimum quantities, stock, compatibility, pricing and dates are confirmed by the Printo team.

The enquiry form does not pretend to send a message. It builds a message in browser memory, shows an editable review, and lets the visitor explicitly open WhatsApp or their email app. The visitor must send the message there. There is no database, CRM, payment flow, automatic email delivery or artwork upload service. Form data is not persisted in browser storage; leaving the page clears it. No external message was sent during validation.

## Content and design

- `src/data.ts`: the product catalogue, technical specifications, audience recommendations, FAQ, contact details and metadata.
- `src/styles.css`: the warm-white and charcoal visual system, with the supplied logo’s orange and lime green used throughout the responsive layouts.
- `public/brand/`: the supplied logo, a font-independent SVG version, dark-surface and monochrome variants, and the original card symbol used as the favicon and a graphic motif.
- `src/components/CardScene.tsx`: the actual Three.js card geometry, generated print textures, motion and cleanup.
- `src/pages/Contact.tsx`: enquiry builder and sharing handoff.
- `public/images/`: 26 supplied product images and optimised original-site photos under `legacy/`.
- `public/printo-product-catalogue.pdf`: the original supplied product catalogue.
- `public/fonts/OFL.txt`: Manrope’s SIL Open Font License.

The 3D cards are illustrative Printo concept artwork. Product images show the supplied examples; their printed customer logos are not presented as client endorsements. Printer brands are identified as product brands, not a claim of authorised dealership. The ambiguous smart-card frequency and hotel lock claims in the supplied material are expressed with a compatibility check instead of promising universal support. The original website’s 16+ years and ISO 9001:2015 statements are retained as supplied business claims; the certificate itself was not provided or independently validated. The legacy 15+ counter conflicts with its 16+ narrative; the explicit narrative is used without inventing a founding year. Placeholder text, unsupported superlatives and ambiguous technical claims were not copied. See `docs/content-audit.json` for the source-to-page content map and corrections.

## Validation

```sh
npm run test:e2e
```

Tests use installed Chrome when available, otherwise Playwright Chromium. To install the latter on a fresh development machine, run `npx playwright install chromium`. Override the executable with `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if needed.

The test suite exercises browsing, combined filters, empty results, reloads, all product/solution routes, enquiry validation and field preservation, studio handoff, mobile navigation, reduced motion and unavailable WebGL. It also audits the ten primary page templates using axe WCAG 2.1 A/AA rules at desktop and phone sizes. Automated checks complement visual inspection; they are not a formal accessibility certification.

To test the actual production build:

```sh
npm run build
npm run preview -- --port 4173
# In another terminal:
PLAYWRIGHT_BASE_URL=http://localhost:4173 npm run test:e2e
```

Review screenshots and accessibility reports are written to `artifacts/`. Failed test traces go into `test-results/`.

## Hosting

Upload the **contents** of `dist/` to a static host. It contains page directories with `index.html`, so configure the host to serve those and return `404.html` for unknown paths. `_headers` and `_redirects` are included for hosts that support them. The original `/services` URL is preserved as a dedicated, pre-rendered Services page.

For Nginx, adapt this location configuration to the existing site block:

```nginx
index index.html;
location / { try_files $uri $uri/index.html $uri/ =404; }
error_page 404 /404.html;
location = /404.html { internal; }
location /assets/ {
    try_files $uri =404;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

The canonical domain is `https://printocards.com`, set in the app metadata, pre-render script and robots file. Update these together if hosting under a different permanent domain. **Production DNS and the existing live site have not been changed.**
