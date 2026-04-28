# Demo recording playbook

How to render, re-render, and add new live-typing demos for the homepage.

## What's in here

`assets/demo/*.tape` — VHS tape sources (one per demo).
`v2/public/assets/demo/*.{gif,mp4}` — built artifacts (committed; that's
how Pages serves them).
`scripts/render-tui-demo.sh` — wrapper for tapes that need a live kernel
daemon + warm session.
`scripts/build-llms-full.mjs`, `sync-version.mjs`, `indexnow-ping.mjs` —
unrelated build scripts; ignore.

## Tools

```sh
brew install vhs gifsicle ffmpeg
```

VHS does the recording, gifsicle compresses GIFs, ffmpeg post-processes
(decimate static frames, trim trailing dead time).

## Two render paths

### 1. CLI demos — render directly with VHS

For tapes that just type a non-interactive shell command (no daemon, no
TUI). Examples: `clock.tape`, `tack.tape`, `journal.tape`, `model.tape`,
`first-run.tape`.

The tape has its own `Output "/abs/path/to/...gif"` directives, so it
writes to the right place regardless of cwd.

```sh
# CLI demos that need an ostk-init'd dir as cwd:
rm -rf /tmp/ostk-day-one && mkdir /tmp/ostk-day-one && cd /tmp/ostk-day-one
ostk init >/dev/null 2>&1
vhs ~/projects/ostk-site/assets/demo/clock.tape

# model.tape additionally needs preferred_model staged:
mkdir -p .ostk/staging
printf 'mlx/ternary-bonsai-8b' > .ostk/staging/preferred_model
vhs ~/projects/ostk-site/assets/demo/model.tape
```

### 2. TUI demos — use the wrapper

For tapes that drive `ostk tui`, use `scripts/render-tui-demo.sh`. The
wrapper handles: pkill stale daemons, fresh `/tmp/ostk-tui-demo`,
`ostk init`, daemon spawn, socket-bind wait, then `vhs <tape>`, then
mpdecimate post-process to drop static frames, then trail-trim.

```sh
# Honest cold boot — no pre-warm:
scripts/render-tui-demo.sh assets/demo/peek-context.tape

# Warm session — pre-compiles .language, pre-warms mlx, seeds turns:
scripts/render-tui-demo.sh --warm assets/demo/tui-converse.tape
```

The `--warm` flag does five extra things before VHS runs:
- `ostk shutdown` to seed `.ostk/.language` (without it the TUI warns
  about a missing language file)
- starts `ostk daemon` detached and waits for the socket
- pins `mlx/ternary-bonsai-8b` as preferred model
- seeds two `ostk decide` rows + two `ostk tack` resolutions so the
  context peek has substance
- pre-warms `mlx_lm.server` with a tiny throwaway prompt so the TUI's
  first inference doesn't pay the cold-spawn cost

### Hide / Show — boot off-camera

TUI session bootstrap is genuinely slow (~10–18s) even with full
pre-warm. Don't fight it. Wrap the `ostk tui` boot in `Hide` / `Show`:

```vhs
Hide
Type `ostk tui`
Enter
Sleep 18s        # wait for full attach off-camera
Show

# only the post-boot interaction gets recorded
Sleep 600ms
Type `Explain ostk in one sentence.`
Enter
Sleep 25s        # generous; post-process trims it
```

### Post-process: kill static frames

The wrapper runs ffmpeg `mpdecimate` on the rendered MP4 (drops
near-duplicate frames so inference-thinking gaps and cursor-only
frames disappear) followed by a trail-trim that detects the last
motion frame and clips a small dwell after it. The GIF is then
regenerated from the cleaned MP4 and gifsicle-compressed.

If you change the tape, just re-run the wrapper — the post-process
is automatic.

## Sizing tapes properly

Set `Width` and `Height` in the tape close to actual content height.
Empty terminal background renders as dead space. Reference for
existing tapes:

| tape          | content lines | Height |
|---------------|---------------|--------|
| clock         | ~10           | 320    |
| tack          | ~10           | 320    |
| journal       | ~8            | 320    |
| model         | ~14           | 380    |
| first-run     | ~30           | 650    |
| peek-context  | TUI overlay   | 600    |
| tui-converse  | TUI + reply   | 700    |

## Embedding on the homepage

`v2/src/components/LiveDemos.astro` holds the array of demo metadata
(name, command label, caption, alt text, width, height). The component
emits `<video autoplay loop muted playsinline preload="metadata">`
with `<img>` GIF fallback inside, lazy-loaded.

Adding a new demo:
1. Render the .tape per above. Output goes to `v2/public/assets/demo/`.
2. Append a new entry to the `demos` array in `LiveDemos.astro` with
   matching width/height (zero-CLS layout reservation depends on it).
3. Optionally set the `command` label that displays above the video.

## Known issues

- **VHS Alt key bug** (charmbracelet/vhs#442): VHS cannot deliver Alt
  modifier to ttyd on macOS. Alt+letter chords arrive as bare letters.
  This blocks automated capture of the TUI peek overlays
  (Alt+c context, Alt+f fleet, Alt+w work, Alt+h help, Alt+d debug).
  See needle →071 for the kernel-side workaround (Ctrl+letter or
  `:command` aliases). Until then, peek-overlay demos require manual
  recording via asciinema (real keyboard).

- **`Type "\\x1b..."` doesn't decode escapes** in VHS. Embedded ESC
  bytes are typed literally. The 7-bit Meta workaround for Alt+key
  doesn't work either; see needle →071.

- **TUI session bootstrap latency**. Fresh-init + first attach is ~10–18s
  even with the daemon pre-bound. This is real; don't try to speed it
  up in the tape. Use Hide/Show to bracket the boot off-camera.

## Adding a new tape (checklist)

1. Pick a name. Save as `assets/demo/<name>.tape`.
2. Header: `Output` for both .gif and .mp4 with absolute paths under
   `v2/public/assets/demo/<name>.{gif,mp4}`.
3. `Set FontFamily "Monaco"`, `Set FontSize 16`, `Set TypingSpeed 60ms`,
   `Set Theme "Dracula"`, `Set Padding 20`. These match the existing
   demos' look.
4. Pick `Width` and `Height` close to the content's actual lines × line-
   height. Don't oversize.
5. Decide if it needs the wrapper (TUI / daemon) or runs directly.
6. Render. The wrapper post-processes; direct runs don't, so for direct
   runs you may want to add the same mpdecimate + trail-trim manually
   (or update the tape to time itself tightly).
7. gifsicle compress: `gifsicle -O3 --colors 64 file.gif -o file.gif`.
8. Wire into `LiveDemos.astro` — add an entry to the `demos` array.
9. Build: `cd v2 && npm run build` should be clean. The new GIF/MP4 ship
   in `dist/assets/demo/`.

## Re-rendering everything (full pass)

```sh
# from ostk-site root
DEMO=/tmp/ostk-day-one
rm -rf $DEMO && mkdir $DEMO && cd $DEMO
ostk init >/dev/null 2>&1
mkdir -p .ostk/staging
printf 'mlx/ternary-bonsai-8b' > .ostk/staging/preferred_model

vhs ~/projects/ostk-site/assets/demo/first-run.tape
vhs ~/projects/ostk-site/assets/demo/clock.tape
vhs ~/projects/ostk-site/assets/demo/tack.tape
vhs ~/projects/ostk-site/assets/demo/journal.tape
vhs ~/projects/ostk-site/assets/demo/model.tape

# TUI demos via wrapper (from ostk-site root):
cd ~/projects/ostk-site
scripts/render-tui-demo.sh --warm assets/demo/tui-converse.tape

# Compress all GIFs:
for f in v2/public/assets/demo/*.gif; do
  gifsicle -O3 --colors 64 "$f" -o "$f"
done

# Verify build:
cd v2 && npm run build
```
