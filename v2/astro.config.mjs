import { defineConfig } from 'astro/config';

// Production builds target printocards.com at the domain root (npm run deploy:production).
// A preview build elsewhere sets SITE_URL, BASE_PATH and PUBLIC_PREVIEW=1.
export default defineConfig({
  site: process.env.SITE_URL || 'https://printocards.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  // The pages of the WordPress site this one replaced (2026-11-13). Each lands on the section
  // that now holds its content. GitHub Pages is static, so these build as instant-redirect pages.
  redirects: {
    '/about': '/#about',
    '/services': '/#products',
    '/contact': '/#contact',
    '/hello-world': '/',
    '/category/uncategorized': '/',
  },
  build: { inlineStylesheets: 'always' },
  vite: {
    build: { chunkSizeWarningLimit: 800 },
  },
});
