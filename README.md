# Mechanics

A research + design notebook for **game mechanics as a lens on real life** — specifically,
how character-stat systems from tabletop RPGs can model *trainable* personality traits in the
Life RPG project.

The unifying idea is **mechanics**: the rules that reduce a "person" to a set of numbers you
can act on, watch change, and level up. Everything here is either (a) a model worth borrowing
from, or (b) a piece of the system that captures the raw behavioral data those numbers are
built from.

## What's in here

| Folder / file | What it is |
|---|---|
| `dnd-reference/ability-scores.md` | Plain-language reference for the six D&D ability scores and how modifiers work. The starting point — the most familiar attribute model. |
| `attribute-systems/systems-to-research.md` | The umbrella terms and the *other* models to study (GURPS, BRP/Call of Cthulhu, FATE, PbtA, World of Darkness). Includes the crosswalk question: which system maps cleanest onto Big Five. |
| `wearable-logger/hardware-decision.md` | Why the Bangle.js 2 was chosen as the always-on capture device. |
| `wearable-logger/rpg-logger.app.js` | The current Espruino logging app for the watch. |
| `wearable-logger/session-log.md` | Deployment recap + **where I left off** (the important one for picking back up). |

## The through-line

```
D&D ability scores  ──►  attribute-system theory  ──►  a validated trait model (Big Five)
   (familiar model)        (alternative models)          (what I actually want to train)
                                    │
                                    ▼
                        wearable behavior logger
              (the sensor that feeds real taps into the numbers)
```

The interesting design question this repo exists to answer: **which RPG attribute taxonomy
maps most cleanly onto a validated psychological model?** Most game stats were built for
combat, not for growth — so the borrowing has to be deliberate.

## Status / pick up here

- The logger app in this repo is the **4-category 2×2 grid** version (Boundary, Curiosity,
  Energy, Care). During the last deployment session a **5th category — Anchor** (somatic
  regulation: breathwork, chanting, cold exposure) — was approved, and the layout was
  redesigned to a **5-row vertical list** with a minus/plus detail screen. **That code isn't
  written yet.** See `wearable-logger/session-log.md` for the full spec that was approved.
- Next concrete step on the hardware side: write the 5-row + Anchor version of the app.
- Next concrete step on the research side: pick one non-D&D system from
  `attribute-systems/` and map its stats onto the trainable traits.

---
*Captured from conversations on 2026-07-17.*
