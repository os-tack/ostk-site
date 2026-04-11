import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://ostk.ai',
  output: 'static',
  outDir: '../dist',
  build: { format: 'directory' },
  integrations: [sitemap(), tailwind()],
  redirects: {
    '/get-started': '/docs/getting-started',
    // Renamed routes
    '/docs/osfile': '/docs/primefile',
    // Removed pages — redirect to closest match
    '/bench': '/features/comparison',
    '/insights': '/docs',
    '/insights/claude-code-source': '/about',
    '/insights/compounding': '/features/coordination',
    '/insights/context-injection': '/features/context-injection',
    '/insights/local-first': '/features/local-first',
    '/insights/model-switch-handoff': '/features/model-switching',
  },
});
