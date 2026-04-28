#!/usr/bin/env bash
# render-tui-demo.sh — reproducibly render a TUI .tape against a live daemon.
#
# VHS spawns a fresh ttyd per tape, and any daemon backgrounded inside the
# tape dies when ttyd exits its step. So we start the daemon OUTSIDE vhs
# (parent process), wait for the socket to bind, run the tape, then kill
# the daemon. The tape itself does only `ostk tui` + key chords.
#
# Usage:
#   scripts/render-tui-demo.sh <tape-file>          # honest first-boot
#   scripts/render-tui-demo.sh --warm <tape-file>   # pre-warm session
#                                                     (language seeded,
#                                                      seeded turns,
#                                                      ready for Alt+c)
set -euo pipefail

WARM=0
if [[ "${1:-}" == "--warm" ]]; then
  WARM=1
  shift
fi

TAPE="${1:?missing tape path}"
SITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_ROOT="/tmp/ostk-tui-demo"
DAEMON_LOG="/tmp/ostk-daemon-$$.log"

# Reap any stragglers from prior aborted runs.
pkill -f 'ostk daemon' 2>/dev/null || true
sleep 1

# Fresh playground.
rm -rf "$DEMO_ROOT"
mkdir -p "$DEMO_ROOT"
cd "$DEMO_ROOT"
ostk init >/dev/null 2>&1

if [[ "$WARM" == "1" ]]; then
  # Compile .language so the TUI doesn't warn about a stale/missing one.
  # ostk shutdown is the canonical compile trigger (no daemon yet, just
  # invokes the post-shutdown language compile path).
  ostk shutdown >/dev/null 2>&1 || true

  # Start the daemon detached.
  ( ostk daemon > "$DAEMON_LOG" 2>&1 ) &
  DAEMON_PID=$!

  # Wait for the socket to bind.
  for i in {1..30}; do
    [[ -S "$DEMO_ROOT/.ostk/ostk.sock" ]] && break
    sleep 1
  done

  # Default to Anthropic Claude Opus for the hero capture (local model
  # responses on a small 8B can hallucinate the project framing).
  # Override via OSTK_DEMO_MODEL env to pin a specific model:
  #   OSTK_DEMO_MODEL=mlx/ternary-bonsai-8b scripts/render-tui-demo.sh ...
  if [[ -n "${OSTK_DEMO_MODEL:-}" ]]; then
    mkdir -p .ostk/staging
    printf '%s' "$OSTK_DEMO_MODEL" > .ostk/staging/preferred_model
  fi

  # Seed a few session turns so the [ctx] peek shows something interesting.
  ostk decide "demo: project initialized" >/dev/null 2>&1 || true
  ostk decide "demo: kernel boot validated" >/dev/null 2>&1 || true
  ostk tack ':needle 1' --json >/dev/null 2>&1 || true
  ostk tack ':status' --json >/dev/null 2>&1 || true

  # Pre-warm the model provider (mlx_lm.server cold-spawn or
  # Anthropic auth handshake). Tiny prompt; throw response away.
  ostk tack --llm 'hi' --max-tokens 8 >/dev/null 2>&1 || true

  echo "[render-tui-demo] warm session ready (PID $DAEMON_PID)"
else
  # Honest first-boot: only daemon, no language compile, no seeded turns.
  ( ostk daemon > "$DAEMON_LOG" 2>&1 ) &
  DAEMON_PID=$!
  for i in {1..30}; do
    [[ -S "$DEMO_ROOT/.ostk/ostk.sock" ]] && break
    sleep 1
  done
  echo "[render-tui-demo] cold session ready (PID $DAEMON_PID)"
fi

# Render the tape.
vhs "$SITE_ROOT/$TAPE"
VHS_EXIT=$?

# Post-process: collapse static frames throughout (mpdecimate) AND trim
# trailing dead time. This keeps Sleep generous in the .tape so we
# always capture the full response/interaction, but the published
# artifact only contains the active region — no waiting on inference,
# no idle terminal at the end.
base_name=$(grep -oE 'Output "[^"]*\.mp4"' "$SITE_ROOT/$TAPE" | head -1 | sed 's/Output "//; s/\.mp4"//')
if [[ -n "$base_name" && -f "$base_name.mp4" ]]; then
  # mpdecimate over-decimated text-heavy demos (the response itself is
  # stable text after it lands, so decimate drops the very frames we
  # want to show). Skip decimate; trail-trim does the dead-tail
  # removal, with a generous DWELL_BUFFER so the final state holds
  # long enough to read.
  LAST_T=$(
    ffmpeg -i "$base_name.mp4" \
      -vf "select='gt(scene,0.005)',showinfo" \
      -f null - 2>&1 \
    | grep -oE 'pts_time:[0-9.]+' \
    | tail -1 \
    | cut -d: -f2
  )
  if [[ -n "$LAST_T" ]]; then
    # 3s dwell on the final frame — the published artifact ends with
    # a held read-the-response beat before looping.
    DWELL_BUFFER=3.0
    TRIM_T=$(awk -v a="$LAST_T" -v b="$DWELL_BUFFER" 'BEGIN { printf "%.2f", a + b }')
    echo "[render-tui-demo] last motion at ${LAST_T}s; trimming to ${TRIM_T}s (3s dwell)"
    ffmpeg -y -i "$base_name.mp4" -t "$TRIM_T" \
      -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
      -movflags +faststart \
      "$base_name.trimmed.mp4" 2>/dev/null
    mv "$base_name.trimmed.mp4" "$base_name.mp4"
  fi

  # Step 3: regenerate the GIF from the cleaned MP4.
  ffmpeg -y -i "$base_name.mp4" \
    -vf "fps=15,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
    "$base_name.gif" 2>/dev/null

  if command -v gifsicle >/dev/null 2>&1; then
    gifsicle -O3 --colors 64 "$base_name.gif" -o "$base_name.gif"
  fi
fi

# Cleanup.
kill "$DAEMON_PID" 2>/dev/null || true
wait "$DAEMON_PID" 2>/dev/null || true
rm -f "$DAEMON_LOG"

exit "$VHS_EXIT"
