import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://ostk.ai',
  output: 'static',
  outDir: '../dist',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // /releases/ is a noindex compatibility redirect to GitHub Releases.
      filter: (page) => page !== 'https://ostk.ai/releases/',
    }),
    tailwind(),
  ],
  redirects: {
    '/get-started': '/start/',
    '/docs/getting-started': '/start/',
    '/quick-start': '/start/',
    // Renamed routes
    '/docs/osfile': '/docs/configuration/',
    '/docs/ostk-core': '/docs/ostk/',
    // Removed pages — redirect to closest match
    '/bench': '/why/',
    '/insights': '/docs/',
    '/insights/claude-code-source': '/about/',
    '/insights/compounding': '/docs/coordination-primitives/',
    '/insights/context-injection': '/docs/context-management/',
    '/insights/local-first': '/why/',
    '/insights/model-switch-handoff': '/docs/context-management/',
    // Redirects for deleted /features/ directory
    '/features': '/docs/',
    '/features/audit-trail': '/docs/architecture/',
    '/features/comparison': '/why/',
    '/features/context-injection': '/docs/context-management/',
    '/features/coordination': '/docs/coordination-primitives/',
    '/features/governance': '/docs/security/',
    '/features/invisible-writes': '/docs/coordination-primitives/',
    '/features/local-first': '/why/',
    '/features/model-switching': '/docs/context-management/',
    '/features/secret-management': '/docs/security/',
    '/features/tack': '/docs/tack-grammar/',
    '/features/tui': '/docs/tui/',
    '/features/vfs': '/docs/coordination-primitives/',
    // Consolidation redirects
    '/docs/humanfile': '/docs/configuration/',
    '/docs/primefile': '/docs/configuration/',
    '/docs/entityfile': '/docs/configuration/',
    '/docs/ostk-toml': '/docs/configuration/',
    '/docs/env-vars': '/docs/configuration/',
    '/docs/trust-model': '/docs/security/',
    '/security': '/docs/security/',
    '/docs/isolation-tiers': '/docs/security/',
    '/docs/approval-chain': '/docs/security/',
    '/docs/secrets': '/docs/security/',
    '/docs/bail': '/docs/security/',
    '/docs/pins': '/docs/security/',
    '/docs/five-laws': '/docs/architecture/',
    '/docs/kernel-spec': '/docs/architecture/',
    '/docs/session-topology': '/docs/agent-lifecycle/',
    '/docs/compression': '/docs/context-management/',
    '/docs/enrichment': '/docs/context-management/',
    '/docs/skills': '/docs/context-management/',
    '/docs/pull-model': '/docs/context-management/',
    '/docs/vfs': '/docs/coordination-primitives/',
    // Convenience aliases
    '/install': '/install.sh',
    '/nofollow': '/',
  },
});
