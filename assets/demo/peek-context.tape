# peek-context.tape — Alt+c overlays the Context peek against a warm session.
#
# Pre-condition: --warm wrapper has already run ostk init + shutdown
# (language compile) + daemon spawn + a few seed turns. The TUI can
# attach immediately and the [ctx] overlay has real content.
#
# Render via:
#   scripts/render-tui-demo.sh --warm assets/demo/peek-context.tape

Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/peek-context.gif"
Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/peek-context.mp4"

Set FontFamily "Monaco"
Set FontSize 14
Set Width 1200
Set Height 600
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 60ms

# Boot the TUI off-camera. Session bootstrap is genuinely slow (~10-15s
# even with pre-warmed daemon + compiled .language + seeded turns); the
# user already sees the honest cold-boot story in first-run.gif. This
# demo's job is to show the steady-state chord interaction, not the
# boot. Hide brackets the slow part; Show resumes recording.
Hide
Type `ostk tui`
Enter
Sleep 18s
Show

# At this point the TUI is fully attached to the warm daemon, POST 9/9
# clean, session connected, [ctx] populated by the seeded turns.
Sleep 800ms

# Alt+c → Context peek overlay.
# VHS's Alt+c chord and Escape→Type c both lose the Meta bit through
# ttyd. Embedding the literal ESC byte (0x1b) inside a Type string
# sends ESC+c as a single 2-byte packet with zero inter-byte gap,
# which crossterm reliably decodes as Alt+c.
Type "\x1bc"
Sleep 4s

Escape
Sleep 800ms
