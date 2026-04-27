# SEO Deployment Notes

This site builds a static bundle in `dist/` and is served by GitHub Pages
behind Cloudflare. GitHub Pages does not honor `_headers` files, so caching
and security headers are configured at Cloudflare instead.

## Cache-Control on hashed assets

The `_astro/` directory contains content-hashed assets (filename changes
when content changes), so they are safe to cache for one year.

Cache Rule (Cloudflare → Caching → Cache Rules):

  - Match: URI Path starts with "/_astro/"
  - Action:
      - Edge Cache TTL = 1 year (Override Origin)
      - Browser Cache TTL = 1 year

HTML pages should keep their default short TTL so deploys propagate.

## HTTPS

"Always Use HTTPS" is enabled in Cloudflare → SSL/TLS → Edge Certificates.

## HSTS

Add via Cloudflare → Rules → Transform Rules → Modify Response Header on
all paths:

  - Header name: `Strict-Transport-Security`
  - Value: `max-age=31536000; includeSubDomains; preload`

Only enable `preload` once you intend to submit the domain to the HSTS
preload list — the directive is sticky once browsers cache it.

## Sitemap

`@astrojs/sitemap` emits `sitemap-0.xml` and `sitemap-index.xml` at build
time. The `lastmod` timestamp is wired in `v2/astro.config.mjs` via
`sitemap({ lastmod: new Date() })`, so every URL carries a build-time
`<lastmod>`. This is sufficient for crawler heuristics; per-page mtime via
git-log can be added later if needed.

## Robots / canonical

`Base.astro` emits `<link rel="canonical">` per page from `Astro.url` and
`Astro.site`. `robots.txt` lives in `v2/public/`.
