#!/usr/bin/env node
// indexnow-ping.mjs — notify IndexNow-participating search engines (Bing, Yandex,
// Naver, Seznam) of updated URLs after each build. Zero-deps Node ESM.
//
// Reads URLs from dist/sitemap-0.xml, posts the list to api.indexnow.org.
// Failures (network, 4xx/5xx) warn but do not fail the build. Set
// INDEXNOW_DISABLE=1 to skip entirely.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CONFIG_PATH = resolve(__dirname, 'indexnow.config.json');
const SITEMAP_PATH = resolve(REPO_ROOT, 'dist/sitemap-0.xml');
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const MAX_URLS = 10000;

function warn(msg) {
  console.warn(`[indexnow] ${msg}`);
}

function info(msg) {
  console.log(`[indexnow] ${msg}`);
}

async function main() {
  if (process.env.INDEXNOW_DISABLE === '1') {
    info('INDEXNOW_DISABLE=1 — skipping ping');
    return 0;
  }
  // Default-skip unless explicitly post-deploy. Pinging during build (before
  // deploy-pages uploads the artifact) makes IndexNow verify against the OLD
  // live key file, returns 403 UserForbiddedToAccessSite, and burns the key
  // (cached negative verdict for ~24h). Set INDEXNOW_POST_DEPLOY=1 only in
  // the workflow step that runs AFTER actions/deploy-pages succeeds.
  if (process.env.INDEXNOW_POST_DEPLOY !== '1') {
    info('not post-deploy (set INDEXNOW_POST_DEPLOY=1 to enable) — skipping');
    return 0;
  }

  // Load config
  let config;
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8');
    config = JSON.parse(raw);
  } catch (err) {
    warn(`could not read config at ${CONFIG_PATH}: ${err.message} — skipping`);
    return 0;
  }
  const { key, host } = config;
  if (!key || !host) {
    warn(`config missing key or host — skipping`);
    return 0;
  }

  // Load sitemap
  if (!existsSync(SITEMAP_PATH)) {
    warn(`sitemap not found at ${SITEMAP_PATH} — skipping`);
    return 0;
  }
  let sitemapXml;
  try {
    sitemapXml = await readFile(SITEMAP_PATH, 'utf8');
  } catch (err) {
    warn(`could not read sitemap: ${err.message} — skipping`);
    return 0;
  }

  // Extract <loc>…</loc> URLs
  const urlList = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(sitemapXml)) !== null) {
    urlList.push(m[1].trim());
  }

  if (urlList.length === 0) {
    warn('sitemap contained 0 URLs — skipping');
    return 0;
  }

  if (urlList.length > MAX_URLS) {
    warn(`sitemap has ${urlList.length} URLs; truncating to ${MAX_URLS}`);
    urlList.length = MAX_URLS;
  }

  const body = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList,
  };

  info(`pinging ${ENDPOINT} with ${urlList.length} URLs (host=${host})`);

  let resp;
  try {
    resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    warn(`network error: ${err.message} — continuing`);
    return 0;
  }

  const text = await resp.text().catch(() => '');
  const status = resp.status;

  if (status === 200 || status === 202 || status === 204) {
    info(`status=${status} ok${text ? ` body=${text.slice(0, 200)}` : ''}`);
    return 0;
  }

  warn(`status=${status} body=${text.slice(0, 500)} — continuing build`);
  return 0;
}

main()
  .then((code) => process.exit(code ?? 0))
  .catch((err) => {
    warn(`unexpected error: ${err.stack || err.message} — continuing`);
    process.exit(0);
  });
