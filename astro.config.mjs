import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ostk.ai',
  output: 'static',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
