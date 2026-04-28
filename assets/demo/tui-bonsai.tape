# tui-bonsai.tape — two-turn TUI conversation with Ternary-Bonsai-8B
# on the kernel's native MLX driver, on Apple Silicon. Demonstrates
# end-to-end inference latency for a local 2-bit ternary quant: an
# explanatory question about its own runtime substrate, then a small
# Python coding task.
#
# Why no "what model are you" turn: Bonsai is trained on synthetic
# data from Claude-class models and self-identifies as Claude, which
# is a textbook prompt-grounding miss (see decision
# tui_demo_prompt_grounded, 2026-04-28). Both prompts here are
# universally answerable and reproducible.
#
# Render via:
#   OSTK_DEMO_MODEL=mlx/ternary-bonsai-8b \
#     scripts/render-tui-demo.sh --warm assets/demo/tui-bonsai.tape

Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/tui-bonsai.gif"
Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/tui-bonsai.mp4"

Set FontFamily "Monaco"
Set FontSize 14
Set Width 1200
Set Height 700
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 50ms

# Boot the TUI off-camera. Slow first-attach is honest in first-run.gif;
# we don't need to re-record it here.
Hide
Type `ostk tui`
Enter
Sleep 18s
Show

Sleep 600ms

# Turn 1 — runtime context. Apple's mlx framework is well-documented
# in pretraining; this prompt grounds the "running on mlx on Apple
# silicon" claim without asking the model to identify itself.
Type `How does Apple's mlx framework run quantized models on M-series chips?`
Enter
Sleep 8s

# Turn 2 — coding task. Small enough for a 2-bit 8B to nail, gives a
# concrete artifact at the end of the loop.
Type `Write a simple magic 8 ball in Python.`
Enter
Sleep 12s
