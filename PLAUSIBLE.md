# Plausible Analytics — ostk.ai

Privacy-first, cookie-free analytics. Dashboard: <https://plausible.io/ostk.ai>.

The script is loaded once in `v2/src/layouts/Base.astro` (variant: `tagged-events.outbound-links.file-downloads.js`) and applies to every page rendered through that layout. Conversion events fire from elements tagged with `class="plausible-event-name=<Event+Name>"`.

## Custom events emitted by the site

| Event name        | Where it fires                                                | Custom props                              |
|-------------------|---------------------------------------------------------------|-------------------------------------------|
| `Hero View`       | Fires once per pageload after hero-variant assignment         | `variant` ∈ `A` / `B`                     |
| `Persona CTA`     | Homepage three-up persona cards                               | `persona` ∈ `mcp` / `local` / `server`    |
| `Install Copied`  | Any install command click (homepage hero, `/start`)           | `source` ∈ `hero` / `start`, `variant` ∈ `A` / `B` (hero only) |
| `Architecture View` | Homepage hero "read the architecture" / "tear it apart" CTA | `variant` ∈ `A` / `B`                     |
| `Where Fits CTA`  | Homepage `WHERE_OSTK_FITS` two-CTA pair                       | `target` ∈ `mcp` / `architecture`         |
| `Path Picked`     | `/start` branch cards                                         | `path` ∈ `mcp` / `local` / `server`       |
| `Start Here`      | Homepage footer CTA                                           | `source=footer-cta`                       |
| `Source View`     | Homepage `VIEW_SOURCE` button (also auto-tracked as outbound) | —                                         |
| `Releases View`   | Homepage releases link                                        | —                                         |
| `Why to Start`    | `/why` → `/start` CTA                                         | —                                         |
| `Docs Deep Dive`  | `/why` → `/docs/architecture` CTA                             | `page=architecture`                       |
| `Outbound Link: Click` | Any external link (auto, by Plausible)                   | `url`                                     |
| `File Download`   | install.sh and other downloadable files (auto, by Plausible)  | `url`                                     |
| `404`             | 404 hits (auto, by Plausible)                                 | —                                         |

## Goals to enable in the dashboard

Settings → Goals → Add goal. For each event name above, add a **Custom event** goal with that exact name. The auto-tracked goals (`Outbound Link: Click`, `File Download`, `404`) are added once globally.

Recommended priority:
1. `Install Copied` — primary conversion (someone reached for the install line).
2. `Path Picked` — secondary conversion (someone committed to a route on `/start`).
3. `Persona CTA` — top-of-funnel intent signal from the homepage.
4. `Outbound Link: Click` filtered to `url contains github.com/os-tack` — proxy for "they went to look at the source."
5. `File Download` filtered to `url contains install.sh` — actual `curl | sh` execution by the install script user-agent.

## Funnels to define

Settings → Funnels → Create funnel. ostk has three adoption funnels worth tracking:

**Adoption (the canonical path)**
1. Pageview · `/`
2. Pageview · `/why`
3. Pageview · `/start`
4. Custom event · `Install Copied`

**MCP path (existing-agent users)**
1. Pageview · `/`
2. Pageview · `/docs/mcp`
3. Custom event · `Install Copied`

**Local-model path**
1. Pageview · `/`
2. Pageview · `/start/local`
3. Custom event · `Install Copied`

Filter all three to **completed steps in order** and **30-day window** (default).

## Adding a new tagged event

```astro
<a href="/some/page" class="plausible-event-name=Some+Event plausible-event-prop1=value1 ..." />
```

- Spaces in event names → `+` (becomes a real space client-side).
- Custom props use `plausible-event-<key>=<value>` and surface as filterable dimensions in Plausible.
- Don't tag every link — pages already get pageviews. Tag only conversion intent, branch points, and CTAs.

## Privacy posture (do not break)

- No cookies, no fingerprinting, no cross-site tracking. The script is the public Plausible CDN build; nothing custom.
- IPs are hashed and discarded. Plausible's data is GDPR/CCPA compliant by default.
- See `v2/src/pages/legal/privacy.astro` for the user-facing statement (already references Plausible).

## Hero A/B test (active until further notice)

The homepage hero ships two variants in the same HTML:

- **Variant A** — declarative prose: `SYSTEM_MANIFEST // OSTK` label, `<h1>ostk</h1>`, "A kernel for AI coding agents." subhead, two CTAs (install copy + architecture link).
- **Variant B** — terminal envelope: a fake `ostk init` output rendering the same pitch as a syscall return envelope. **Default for SSR/SSG, no-JS, and bots.**

Assignment: an `is:inline` script in `v2/src/layouts/Base.astro` runs before paint, reads `ostk_hero_variant` from `localStorage` (falls back to a 50/50 random pick on first visit, then sticky), sets `data-hero-variant` on `<html>`, and CSS hides the unselected variant. The script also fires `Hero View` with `variant=A|B` on `DOMContentLoaded`.

CTAs in both variants are tagged with `plausible-event-variant=A` or `=B` at HTML-emit time so the prop fires correctly even though Plausible reads class strings statically.

**Reading the test in Plausible**:

1. Open the dashboard, scroll to **Goal Conversions**.
2. Pick `Install Copied` (or `Architecture View`, or `Hero View`).
3. Click the goal → click the **`variant`** custom property in the property breakdown.
4. The split shows visitors and conversions per variant. Compare conversion rates.

Sample queries:
- **Install conversion by variant**: filter `Install Copied` → group by `variant` (A vs B). Limit to `source=hero` to exclude `/start` page installs.
- **Architecture deep-dive by variant**: filter `Architecture View` → group by `variant`.
- **Hero impressions baseline**: `Hero View` grouped by `variant` should be ~50/50 across enough traffic; deviation flags the assignment script.
- **Funnel by variant**: in the Adoption funnel, add a filter for `Hero View: variant=A` (or B) and compare end-to-end conversion.

End the test by deleting both `data-hero` blocks in `v2/src/pages/index.astro`, the inline script + CSS in `v2/src/layouts/Base.astro`, and removing the `Hero View` / `Architecture View` rows from the table above.

## Removing analytics

If a release ever needs to ship without analytics, delete the two `<script>` lines in `v2/src/layouts/Base.astro`. Tagged class names on elements are inert without the script — no need to walk back through the pages.
