# first-run.tape — the day-one experience.
# Pre-condition: caller has cd'd into a fresh ostk-init-able directory.
# The tape itself only types ostk commands — no setup noise.
#
# Render via:
#   rm -rf /tmp/ostk-day-one && mkdir /tmp/ostk-day-one && \
#   cd /tmp/ostk-day-one && \
#   vhs /Users/scottmeyer/projects/ostk-site/assets/demo/first-run.tape

Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/first-run.gif"
Output "/Users/scottmeyer/projects/ostk-site/v2/public/assets/demo/first-run.mp4"

Set FontFamily "Monaco"
Set FontSize 16
Set Width 1100
Set Height 650
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 60ms

Sleep 500ms

Type `ostk init`
Enter
Sleep 2500ms

Type `ostk boot`
Enter
Sleep 4500ms
