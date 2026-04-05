# ostk.ai Tone Guide

## Voice

Direct, technical, evidence-first. Written by developers for developers.

State what ostk does. Show how it works. Link to proof. Stop.

---

## Banned Words and Phrases

Do not use any of the following. If they appear in a draft, rewrite the sentence.

**Marketing superlatives:**
revolutionize, game-changing, cutting-edge, next-generation, best-in-class, transform, elevate

**Hype formulas:**
harness the power, unlock the potential, empower your, supercharge your

**"Seamless" family:**
seamlessly integrate, seamless experience, seamlessly (use "invisible" instead)

**Throat-clearing openers:**
in today's rapidly evolving, in an era of, as we navigate

**Buzzword nouns:**
robust solution, comprehensive platform, holistic approach, synergy, paradigm shift

**Filler hedges:**
delve into, it's important to note, it's worth mentioning

**Misused verbs:**
leverage (as a verb)

---

## Structural Rules

1. No sentences over 40 words.
2. No paragraphs starting with gerund phrases ("Leveraging the...", "Building on...").
3. No 3+ adjectives modifying one noun. Pick the one that matters.
4. No claims without evidence links.
5. No rhetorical questions as section openers.
6. No third-person product voice ("ostk provides users with..."). Use second-person: "you get...".
7. No marketing superlatives without data to back them.

---

## Preferred Terms

| Use this | Not this |
|---|---|
| local-first | privacy-focused |
| invisible | seamless |
| coordinates | orchestrates |
| agents | AI assistants |
| filesystem | file system |

Use present tense. Use active voice.

---

## Before/After Rewrites

### 1. Feature introduction

**Before:**
> In today's rapidly evolving AI landscape, ostk revolutionizes the way developers harness the power of coding agents. Our comprehensive platform seamlessly orchestrates multiple AI assistants, providing a robust solution that empowers your development workflow.

**After:**
> ostk coordinates your coding agents through the filesystem. You run agents in parallel. ostk keeps them from colliding. No server, no daemon -- it works through files your OS already knows how to handle.

### 2. Explaining local-first architecture

**Before:**
> We believe in putting privacy first. That's why ostk leverages a cutting-edge, next-generation approach to ensure your sensitive code never leaves your machine. It's worth mentioning that our holistic approach to security sets us apart from the competition.

**After:**
> ostk is local-first. Your code stays on your machine. Agent coordination happens through local files -- no API calls, no cloud sync, no telemetry. Run `ostk status` and see exactly what's on disk.

### 3. Multi-agent coordination

**Before:**
> Supercharge your productivity by unlocking the potential of multiple AI assistants working in seamless synergy! ostk's game-changing orchestration engine provides best-in-class agent management that will transform and elevate your entire development experience.

**After:**
> You can run Claude, Cursor, and Copilot on the same repo at the same time. ostk assigns each agent a workspace boundary and coordinates file access through lock files. Conflicts drop to near zero. See the [benchmarks](/docs/benchmarks).

---

## IP Boundary Rule

All content describes what features do for the operator. Never describe how the kernel implements them internally.

**Yes:** "You get atomic file locking across agents."

**No:** "The kernel uses inotify watchers to detect concurrent writes and applies a CRDT merge strategy."

Explain the *what* and the *why*. Keep the *how* behind the API boundary.
