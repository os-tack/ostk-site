#!/usr/bin/env node
// sync-version.mjs — fetch latest release from github.com/os-tack/ostk.ai
// at build time and write into v2/src/site-version.ts. Also dumps the last
// 10 releases to v2/src/data/releases.json for the changelog page.
//
// Falls back silently to the existing site-version.ts if the GitHub API is
// unreachable or rate-limited. Set SKIP_VERSION_SYNC=1 to skip entirely
// (e.g. for offline local builds).
//
// Wired into v2/package.json build: runs BEFORE `astro build` so Astro
// picks up the fresh constants.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const VERSION_PATH = resolve(REPO_ROOT, 'v2/src/site-version.ts');
const RELEASES_DIR = resolve(REPO_ROOT, 'v2/src/data');
const RELEASES_PATH = resolve(RELEASES_DIR, 'releases.json');
const API_URL = 'https://api.github.com/repos/os-tack/ostk.ai/releases?per_page=10';

const HEADER = `// AUTO-GENERATED at build time by scripts/sync-version.mjs.
// Source of truth: https://github.com/os-tack/ostk.ai/releases (latest published).
// Manual edits to this file will be overwritten on the next build.
//
// To force-pin a version (e.g. roll back if a release is bad):
//   SKIP_VERSION_SYNC=1 npm run build
// or remove sync-version.mjs from the build chain in v2/package.json.
`;

function info(msg) {
  console.log(`[sync-version] ${msg}`);
}

function warn(msg) {
  console.warn(`[sync-version] ${msg}`);
}

async function fetchReleases() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'ostk-site-build',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    warn(`fetch failed: ${err.message} — keeping existing site-version.ts`);
    return null;
  }
}

async function main() {
  if (process.env.SKIP_VERSION_SYNC === '1') {
    info('SKIP_VERSION_SYNC=1 — skipping');
    return 0;
  }

  const releases = await fetchReleases();
  if (!releases || !Array.isArray(releases) || releases.length === 0) {
    return 0;
  }

  const latest = releases[0];
  const tag = latest.tag_name;
  const version = tag.replace(/^v/, '');
  const releaseUrl = latest.html_url;

  const content = `${HEADER}
export const LATEST_VERSION = ${JSON.stringify(version)};
export const LATEST_TAG = ${JSON.stringify(tag)};
export const RELEASE_URL = ${JSON.stringify(releaseUrl)};
`;
  await writeFile(VERSION_PATH, content, 'utf8');
  info(`wrote LATEST_VERSION=${version} to site-version.ts`);

  if (!existsSync(RELEASES_DIR)) {
    await mkdir(RELEASES_DIR, { recursive: true });
  }
  const compact = releases.slice(0, 10).map(r => ({
    tag: r.tag_name,
    name: r.name || r.tag_name,
    date: r.published_at,
    url: r.html_url,
    body: r.body || '',
    prerelease: !!r.prerelease,
    assetCount: Array.isArray(r.assets) ? r.assets.length : 0,
  }));
  await writeFile(RELEASES_PATH, JSON.stringify(compact, null, 2) + '\n', 'utf8');
  info(`wrote ${compact.length} releases to data/releases.json`);

  return 0;
}

main()
  .then(code => process.exit(code ?? 0))
  .catch(err => {
    warn(`error: ${err.message} — continuing build without sync`);
    process.exit(0); // never fail the build
  });
