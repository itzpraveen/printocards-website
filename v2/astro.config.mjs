import { defineConfig } from 'astro/config';

// Production builds target printocards.com at the domain root. GitHub Pages previews set
// SITE_URL, BASE_PATH and PUBLIC_PREVIEW=1 (see .github/workflows/pages.yml).
export default defineConfig({
  site: process.env.SITE_URL || 'https://printocards.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  vite: {
    build: { chunkSizeWarningLimit: 800 },
  },
});
