#!/usr/bin/env node
// build-llms-full.mjs — generates v2/public/llms-full.txt from the built dist/.
//
// Reads the curated list of in-scope page paths (mirroring v2/public/llms.txt),
// extracts the <main> body from each dist/<path>/index.html, strips HTML chrome,
// and concatenates with markdown-style separators for LLM consumption.
//
// Run AFTER `astro build` so dist/ is populated. Invoked from v2/package.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DIST = resolve(REPO_ROOT, 'dist');
// Write to dist/ (the published output) so the file is served at /llms-full.txt
// on the very build that produced it. We also mirror to v2/public/ so the file
// is checked in as a static asset and survives clean builds — astro's static
// copy will overwrite the dist/ copy on the next build, but that's fine since
// this script regenerates it post-build anyway.
const OUT_DIST = resolve(DIST, 'llms-full.txt');
const OUT_PUBLIC = resolve(REPO_ROOT, 'v2/public/llms-full.txt');
const SITE = 'https://ostk.ai';

// In-scope pages — keep in sync with v2/public/llms.txt.
// Each entry is { path: URL path on the site, title: human title }.
const PAGES = [
  { path: '/',                               title: 'Home — like containers, for AI agents' },
  { path: '/why/',                           title: 'Why ostk — the three problems it solves' },
  { path: '/start/',                         title: 'Start here — pick your path' },
  { path: '/start/local/',                   title: 'Start — Local Model TUI' },
  { path: '/start/server/',                  title: 'Start — Server Mode' },
  // Docs
  { path: '/docs/',                          title: 'Documentation index' },
  { path: '/docs/architecture/',             title: 'System Architecture' },
  { path: '/docs/five-laws/',                title: 'Five Laws' },
  { path: '/docs/kernel-spec/',              title: 'Kernel Specification' },
  { path: '/docs/commands/',                 title: 'CLI Surface' },
  { path: '/docs/mcp/',                      title: 'MCP — both directions' },
  { path: '/docs/trust-model/',              title: 'Trust Model' },
  { path: '/docs/pins/',                     title: 'Pin Caps' },
  { path: '/docs/approval-chain/',           title: 'Approval Chain' },
  { path: '/docs/isolation-tiers/',          title: 'Isolation Tiers' },
  { path: '/docs/agentfile/',                title: 'Agentfile' },
  { path: '/docs/humanfile/',                title: 'HUMANFILE' },
  { path: '/docs/primefile/',                title: '.primefile' },
  { path: '/docs/entityfile/',               title: 'ENTITYFILE' },
  { path: '/docs/ostk-toml/',                title: 'ostk.toml' },
  { path: '/docs/secrets/',                  title: 'Secrets' },
  { path: '/docs/bail/',                     title: 'Bail (signed bundles)' },
  { path: '/docs/session-topology/',         title: 'Session Topology' },
  { path: '/docs/agent-lifecycle/',          title: 'Agent Lifecycle' },
  { path: '/docs/coordination-primitives/',  title: 'Coordination Primitives' },
  { path: '/docs/context-management/',       title: 'Context Management' },
  { path: '/docs/compression/',              title: 'Compression' },
  { path: '/docs/boot-sequence/',            title: 'Boot Sequence' },
  { path: '/docs/enrichment/',               title: 'Enrichment Hooks' },
  { path: '/docs/pull-model/',               title: 'Pull Model' },
  { path: '/docs/tack-grammar/',             title: 'Tack Grammar' },
  { path: '/docs/models/',                   title: 'Models' },
  { path: '/docs/skills/',                   title: 'Skills' },
  { path: '/docs/needles/',                  title: 'Needles' },
  { path: '/docs/sphere-navigator/',         title: 'Sphere Navigator' },
  { path: '/docs/tui/',                      title: 'TUI' },
  { path: '/docs/env-vars/',                 title: 'Environment Variables' },
  { path: '/docs/downloads/',                title: 'Downloads' },
  { path: '/docs/how-to/learn-sandbox/',     title: 'How-to: Learn a Sandbox Policy' },
  { path: '/docs/faq/',                      title: 'FAQ' },
  // Features
  { path: '/features/',                      title: 'Features' },
  { path: '/features/coordination/',         title: 'AI Agent Coordination' },
  { path: '/features/invisible-writes/',     title: 'AI Agent File Write Tracking' },
  { path: '/features/audit-trail/',          title: 'AI Agent Audit Trail' },
  { path: '/features/context-injection/',    title: 'AI Agent Context Management' },
  { path: '/features/local-first/',          title: 'Local-First AI Agent Coordination' },
  { path: '/features/governance/',           title: 'AI Agent Trust Model and Security' },
  { path: '/features/tack/',                 title: 'Tack — AI Agent Intent Language' },
  { path: '/features/model-switching/',      title: 'Switch AI Models Mid-Session' },
  { path: '/features/secret-management/',    title: 'AI Agent API Key Security' },
  { path: '/features/tui/',                  title: 'AI Agent Terminal Dashboard' },
  { path: '/features/comparison/',           title: 'How ostk Compares to AI Coding Tools' },
  // Optional
  { path: '/about/',                         title: 'About ostk' },
  { path: '/security/',                      title: 'Security' },
];

// HTML entities we need to decode after stripping tags.
const ENTITIES = {
  '&amp;':  '&',
  '&lt;':   '<',
  '&gt;':   '>',
  '&quot;': '"',
  '&#39;':  "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&copy;': '©',
  '&rarr;': '→',
  '&larr;': '←',
};

function decodeEntities(s) {
  return s
    .replace(/&[a-z]+;|&#\d+;/g, (m) => {
      if (ENTITIES[m] !== undefined) return ENTITIES[m];
      const num = m.match(/&#(\d+);/);
      if (num) return String.fromCodePoint(Number(num[1]));
      return m;
    });
}

// Pull the inner HTML of the first <main>...</main> block; if there's no <main>,
// fall back to <body>...</body>. Then strip nav/header/footer/aside/script/style/svg.
function extractMain(html) {
  let body = '';
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    body = mainMatch[1];
  } else {
    const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    body = bodyMatch ? bodyMatch[1] : html;
  }
  // Drop chrome blocks first (whole-element removal).
  body = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, '')
    .replace(/<header\b[\s\S]*?<\/header>/gi, '')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  return body;
}

// Convert HTML to plain text. Block-level tags become paragraph breaks; inline
// elements collapse. Code fences become triple-backtick blocks. Lists become
// hyphen-prefixed lines.
function htmlToText(html) {
  let s = html;

  // Pre/code: preserve content with markdown fences. Capture <pre><code>...</code></pre>
  // first so nested <code> tags don't double-process.
  s = s.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, inner) => {
    const innerText = inner
      .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '$1')
      .replace(/<[^>]+>/g, '');
    return '\n```\n' + decodeEntities(innerText).replace(/\n+$/, '') + '\n```\n';
  });

  // Inline <code>foo</code> -> `foo`
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => {
    return '`' + decodeEntities(inner.replace(/<[^>]+>/g, '')) + '`';
  });

  // Headings -> markdown
  s = s.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, inner) => {
    const text = decodeEntities(inner.replace(/<[^>]+>/g, '').trim());
    return '\n\n' + '#'.repeat(Number(lvl)) + ' ' + text + '\n\n';
  });

  // List items
  s = s.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => {
    return '\n- ' + inner.replace(/\s+/g, ' ').trim();
  });

  // Block-level elements: insert paragraph breaks
  s = s.replace(/<(p|div|section|article|tr|table|thead|tbody|ul|ol|blockquote|hr)\b[^>]*>/gi, '\n\n');
  s = s.replace(/<\/(p|div|section|article|tr|table|thead|tbody|ul|ol|blockquote)\s*>/gi, '\n\n');

  // Line breaks
  s = s.replace(/<br\b[^>]*\/?>/gi, '\n');

  // Anchor: "text (url)" — only for non-#anchor-only links
  s = s.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const hrefMatch = attrs.match(/href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i);
    const href = hrefMatch ? (hrefMatch[1] || hrefMatch[2]) : '';
    if (!href || href.startsWith('#') || href === text) return text;
    return text + ' (' + href + ')';
  });

  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, '');

  // Decode entities
  s = decodeEntities(s);

  // Collapse whitespace: spaces+tabs (not newlines) collapse to one space; collapse 3+ newlines to 2.
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/ *\n */g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

function processPage(page) {
  const filePath = resolve(DIST, '.' + page.path, 'index.html');
  if (!existsSync(filePath)) {
    console.warn(`  [skip] missing: ${filePath}`);
    return null;
  }
  const html = readFileSync(filePath, 'utf8');
  const main = extractMain(html);
  const text = htmlToText(main);
  if (!text || text.length < 50) {
    console.warn(`  [skip] empty content: ${page.path}`);
    return null;
  }
  return text;
}

function main() {
  if (!existsSync(DIST)) {
    console.error(`dist/ not found at ${DIST} — run \`astro build\` first.`);
    process.exit(1);
  }
  console.log(`Building llms-full.txt from ${DIST}`);
  const parts = [];
  parts.push('# ostk — full text mirror');
  parts.push('');
  parts.push('> Concatenated full text of every documented page on https://ostk.ai/.');
  parts.push('> Curated index lives at https://ostk.ai/llms.txt (per https://llmstxt.org spec).');
  parts.push('');
  parts.push('---');
  parts.push('');

  let included = 0;
  let skipped = 0;
  for (const page of PAGES) {
    const body = processPage(page);
    if (body === null) { skipped++; continue; }
    parts.push(`# ${page.title}`);
    parts.push('');
    parts.push(`URL: ${SITE}${page.path}`);
    parts.push('');
    parts.push(body);
    parts.push('');
    parts.push('---');
    parts.push('');
    included++;
  }

  const out = parts.join('\n');
  writeFileSync(OUT_DIST, out);
  writeFileSync(OUT_PUBLIC, out);
  const bytes = Buffer.byteLength(out, 'utf8');
  console.log(`Wrote ${OUT_DIST}`);
  console.log(`Wrote ${OUT_PUBLIC}`);
  console.log(`  ${included} pages included, ${skipped} skipped`);
  console.log(`  ${(bytes / 1024).toFixed(1)} KB`);
}

main();
