import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://printocards.com',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  vite: {
    build: { chunkSizeWarningLimit: 800 },
  },
});
