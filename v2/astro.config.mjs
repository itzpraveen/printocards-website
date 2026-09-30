import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://printocards.com',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { chunkSizeWarningLimit: 800 },
  },
});
