# model.tape — local LLM response from Ternary Bonsai (mlx, on-device).
# Shows: pinning a local model via staging/preferred_model, then a single
# tack --llm call. The kernel lazy-spawns mlx_lm.server, the model
# (Ternary-Bonsai-8B-mlx-2bit, prism-ml/) produces a real response
# entirely on-device — no API key, no cloud, no telemetry.
#
# Render via:
#   rm -rf /tmp/ostk-llm-demo && mkdir /tmp/ostk-llm-demo && \
#   cd /tmp/ostk-llm-demo && ostk init >/dev/null 2>&1 && \
#   mkdir -p .ostk/staging && \
#   printf 'mlx/ternary-bonsai-8b' > .ostk/staging/preferred_model && \
#   vhs /Users/scottmeyer/projects/ostk-site/assets/demo/model.tape

Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/model.gif"
Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/model.mp4"

Set FontFamily "Monaco"
Set FontSize 16
Set Width 1100
Set Height 700
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 60ms

Sleep 500ms

# Show the model pin so the viewer sees the kernel's model-routing surface
Type `cat .ostk/staging/preferred_model`
Enter
Sleep 1s

# Ask the local model
Type `ostk tack --llm "Explain ostk in two sentences."`
Enter

# Allow time for: mlx_lm.server spawn (~6s on first call) + inference (~3-5s)
Sleep 14s
