import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://ostk.ai";
const defaultDist = fileURLToPath(new URL("../dist", import.meta.url));
const dist = path.resolve(process.argv[2] || defaultDist);

if (!fs.existsSync(dist)) {
  console.error("SEO audit: build directory not found: " + dist);
  console.error("Run the Astro build first.");
  process.exit(1);
}

const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
}

const strip = (value = "") => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&mdash;|&#8212;/g, "—")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/\s+/g, " ")
  .trim();

const parseAttrs = (tag) => Object.fromEntries(
  [...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? ""]),
);

const tags = (html, name) => (
  html.match(new RegExp("<" + name + "\\b[^>]*>", "gi")) || []
).map(parseAttrs);

const pick = (items, predicate, key) => items.find(predicate)?.[key] || "";

function expectedCanonical(relativePath) {
  if (relativePath === "index.html") return SITE + "/";
  return SITE + "/" + relativePath.replace(/index\.html$/, "");
}

walk(dist);

const pages = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(dist, file);
  const metas = tags(html, "meta");
  const links = tags(html, "link");
  const title = strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = pick(metas, (item) => item.name?.toLowerCase() === "description", "content");
  const canonical = pick(
    links,
    (item) => item.rel?.toLowerCase().split(/\s+/).includes("canonical"),
    "href",
  );
  const robots = pick(metas, (item) => item.name?.toLowerCase() === "robots", "content");
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((match) => strip(match[1]));
  const jsonLdMatches = [
    ...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  const jsonLd = [];
  let invalidJsonLd = 0;
  for (const match of jsonLdMatches) {
    try {
      jsonLd.push(JSON.parse(match[1]));
    } catch {
      invalidJsonLd += 1;
    }
  }

  const isRedirect = /^Redirecting to:/.test(title) || /http-equiv=["']refresh["']/i.test(html);
  const is404 = rel === "404.html";
  const noindex = /(?:^|,)\s*noindex\b/i.test(robots);

  pages.push({
    rel,
    title,
    description,
    canonical,
    robots,
    h1s,
    jsonLd,
    invalidJsonLd,
    isRedirect,
    is404,
    noindex,
    lang: html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1] || "",
    ogTitle: pick(metas, (item) => item.property === "og:title", "content"),
    ogDescription: pick(metas, (item) => item.property === "og:description", "content"),
    ogImage: pick(metas, (item) => item.property === "og:image", "content"),
    ogUrl: pick(metas, (item) => item.property === "og:url", "content"),
    twitterCard: pick(metas, (item) => item.name === "twitter:card", "content"),
  });
}

const indexable = pages.filter((page) => !page.noindex && !page.isRedirect && !page.is404);
const errors = [];
const warnings = [];
const error = (page, message) => errors.push(page + ": " + message);
const warn = (page, message) => warnings.push(page + ": " + message);

for (const page of indexable) {
  if (!page.title) error(page.rel, "missing title");
  if (!page.description) error(page.rel, "missing meta description");
  if (!page.canonical) error(page.rel, "missing canonical URL");
  if (page.canonical && page.canonical !== expectedCanonical(page.rel)) {
    error(page.rel, "canonical is " + page.canonical + "; expected " + expectedCanonical(page.rel));
  }
  if (page.h1s.length !== 1) error(page.rel, "expected one h1, found " + page.h1s.length);
  if (!page.lang) error(page.rel, "missing html lang");
  if (page.invalidJsonLd) error(page.rel, page.invalidJsonLd + " invalid JSON-LD block(s)");
  if (!page.ogTitle || !page.ogDescription || !page.ogImage || !page.ogUrl) {
    error(page.rel, "incomplete Open Graph metadata");
  }
  if (!page.twitterCard) error(page.rel, "missing Twitter card metadata");
  if (page.title.length > 65) warn(page.rel, "title is " + page.title.length + " characters");
  if (page.description.length > 165) warn(page.rel, "description is " + page.description.length + " characters");
  if (page.description.length > 0 && page.description.length < 70) {
    warn(page.rel, "description is only " + page.description.length + " characters");
  }
}

for (const page of pages.filter((item) => item.isRedirect)) {
  if (!page.noindex) error(page.rel, "redirect page must be noindex");
  if (!page.canonical) error(page.rel, "redirect page must identify its destination canonical");
}

const notFound = pages.find((page) => page.is404);
if (!notFound) error("404.html", "missing");
else {
  if (!notFound.noindex) error("404.html", "must be noindex");
  if (notFound.h1s.length !== 1) error("404.html", "must contain one h1");
}

for (const key of ["title", "description", "canonical"]) {
  const groups = new Map();
  for (const page of indexable) {
    const value = page[key];
    if (!value) continue;
    groups.set(value, [...(groups.get(value) || []), page.rel]);
  }
  for (const [value, refs] of groups) {
    if (refs.length > 1) error(refs.join(", "), "duplicate " + key + ": " + value);
  }
}

const sitemapFiles = fs.readdirSync(dist)
  .filter((name) => /^sitemap-\d+\.xml$/.test(name))
  .map((name) => path.join(dist, name));
if (sitemapFiles.length === 0) {
  error("sitemap", "no URL sitemap generated");
}

const sitemapUrls = new Set();
for (const file of sitemapFiles) {
  const xml = fs.readFileSync(file, "utf8");
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(match[1]);
}

const indexableCanonicals = new Set(indexable.map((page) => page.canonical).filter(Boolean));
for (const canonical of indexableCanonicals) {
  if (!sitemapUrls.has(canonical)) error("sitemap", "missing indexable canonical " + canonical);
}
for (const url of sitemapUrls) {
  if (!indexableCanonicals.has(url)) error("sitemap", "contains non-indexable or unknown URL " + url);
}

const home = pages.find((page) => page.rel === "index.html");
const homeTypes = new Set();
for (const block of home?.jsonLd || []) {
  const nodes = block["@graph"] || [block];
  for (const node of nodes) {
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
    for (const type of types.filter(Boolean)) homeTypes.add(type);
  }
}
for (const requiredType of ["WebSite", "Organization", "SoftwareApplication"]) {
  if (!homeTypes.has(requiredType)) error("index.html", "missing " + requiredType + " structured data");
}

const robotsPath = path.join(dist, "robots.txt");
if (!fs.existsSync(robotsPath)) error("robots.txt", "missing");
else {
  const robots = fs.readFileSync(robotsPath, "utf8");
  if (!/Sitemap:\s*https:\/\/ostk\.ai\/sitemap-index\.xml/i.test(robots)) {
    error("robots.txt", "missing canonical sitemap declaration");
  }
}

if (!fs.existsSync(path.join(dist, "og-image.png"))) error("og-image.png", "missing social preview image");

console.log(
  "SEO audit: " + indexable.length + " indexable pages, "
    + (pages.length - indexable.length) + " noindex/redirect/404 pages, "
    + sitemapUrls.size + " sitemap URLs.",
);
for (const message of warnings) console.warn("WARN  " + message);
for (const message of errors) console.error("ERROR " + message);

if (errors.length) {
  console.error("SEO audit failed with " + errors.length + " error(s) and " + warnings.length + " warning(s).");
  process.exit(1);
}

console.log("SEO audit passed with " + warnings.length + " warning(s).");
