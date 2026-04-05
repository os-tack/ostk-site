import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ostk.ai',
  output: 'static',
  integrations: [sitemap()],
  redirects: {
    '/get-started': '/docs/getting-started',
  },
  build: {
    format: 'directory',
  },
});
