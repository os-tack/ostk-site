# tui-converse.tape — type a prompt in the TUI, get a real response
# from a local mlx model (Ternary-Bonsai-8B). This is the load-bearing
# claim made visible: an LLM you can talk to lives inside the kernel,
# on-device, no API key, no cloud.
#
# Render via:
#   scripts/render-tui-demo.sh --warm assets/demo/tui-converse.tape
#
# The wrapper pre-stages mlx/ternary-bonsai-8b as preferred_model and
# warms the daemon. Boot is hidden off-camera; the demo only records
# the steady-state interaction.

Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/tui-converse.gif"
Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/tui-converse.mp4"

Set FontFamily "Monaco"
Set FontSize 14
Set Width 1200
Set Height 700
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 50ms

# Boot the TUI off-camera (~18s, slow first-attach is honest in first-run.gif).
Hide
Type `ostk tui`
Enter
Sleep 18s
Show

Sleep 600ms

# Type a prompt in the TUI's tack input box.
# Prompt the model can actually answer correctly (asking a model to
# explain a private project it has never seen produces hallucination
# from both Opus and local Ternary-Bonsai). This prompt demonstrates
# the conversation surface itself — typing in the TUI, real model
# response landing — without making a knowledge claim the model
# cannot back.
Type `Write a unix one-liner that tails a log and only shows ERROR lines.`
Enter

# Generous Sleep so we definitely capture the full response. The
# wrapper post-trims trailing static frames so the published GIF
# only contains the active region.
Sleep 25s
