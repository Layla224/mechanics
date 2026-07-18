# Wearable Logger — Session Log

## Deployment session (last worked)

Got the Bangle.js 2 connected and confirmed working, after a fair bit of connectivity
troubleshooting. Key findings, so future-me doesn't re-learn them the hard way:

- The watch **goes to sleep** before a Bluetooth connection can complete — that was the main
  red herring.
- **Firefox does not support Web Bluetooth or Web Serial.** Chrome and Edge do.
- A **USB hub** was causing unreliable data connections — connect the watch **directly**.
- The Espruino Web IDE console needs **keyboard focus**, which Firefox doesn't grant properly.
- ✅ Connected successfully via **Microsoft Edge + Web Serial + direct USB**.
- ✅ Firmware confirmed current at **v2.29**.

## Design decisions from that session

Rejected the original **2×2 colored grid** — category names were too large and ran off the
176×176 screen. Approved instead:

- **Main screen:** a **5-row vertical list** — icon + full word, full width, one color per
  category.
- **Detail screen:** back arrow top-left, category name at top, **large count centered**,
  "today" label below, **minus / plus circles** flanking the count.
- **Count behavior:** starts at **zero daily**, tracks **current day only**. Minus is a **true
  undo** — it removes the last log entry from the file, not just a display decrement.

## Category change

Added a **5th category: Anchor** — somatic regulation practices (breathwork, chanting, cold
exposure). Chosen over Calm / Breath / Ground / Pause / Tend because it fit on screen and matched
the intent.

Full category set is now:

| Category | Trait target |
|---|---|
| Boundary | Assertiveness |
| Curiosity | Openness |
| Energy | Steadiness |
| Care | Warmth / Agreeableness |
| **Anchor** | Somatic regulation |

## ⚠️ Where I left off

The `rpg-logger.app.js` in this folder is the **OLD 4-category 2×2 grid** version. It does **not**
include Anchor and does **not** use the approved 5-row list / minus-plus detail layout.

**The new code has not been written yet** — the last session ended on "no code until I give the
go-ahead" while still eyeballing the 5-row layout.

**Next step:** write the 5-category, 5-row-list version with the true-undo detail screen. The
"dumb watch" principle still holds — it should only log `{t, k}` per tap; category → trait → XP
resolution stays in Supabase as the single source of truth.
