import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ostk.ai',
  output: 'static',
  build: {
    format: 'directory',
  },
});
