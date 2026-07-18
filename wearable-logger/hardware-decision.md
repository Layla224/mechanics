# Life RPG Wearable Hardware Decision

## Wearable Goal

Low-friction, always-on capture device for logging daily behavioral moments that map to
trainable personality traits (Assertiveness, Openness, Agreeableness, Low Neuroticism) as part
of the Life RPG character-development system. Device must be wrist-mounted, mentally distinct
from health tracking, and support single-tap logging with optional voice notes.

## Options Evaluated

- **Phone** — Rejected. Too much friction (unlock, navigate app, type). Confirmed not viable for
  in-the-moment capture.
- **Garmin S2** — Rejected. Associated with health tracking; conflating RPG and fitness data
  would kill adoption.
- **Voice memo / notebook** — Rejected. Already tested both; friction too high despite low tech
  barrier.
- **M5StickC** — Rejected. Board-like form factor doesn't look like a watch; firmware from
  scratch in C++.
- **PineTime** — Rejected. Open-source and hackable, but needs C++. Explicitly don't want to
  learn new languages; prefer AI-generated code.
- **Open-SmartWatch** — Rejected. 3D-printable and modular, but overkill for Phase 1.

## Bangle.js 2 — Selected

### Rationale

- **Language match**: JavaScript-based. React experience transfers; Claude can generate code
  without learning new syntax.
- **Frictionless development**: Web IDE accepts pasted code directly; no build pipeline.
- **Form factor**: Actual smartwatch appearance (not a dev board).
- **Connectivity**: Bluetooth built-in for hub sync.
- **Polish**: Good screen, multi-day battery, existing app ecosystem to reference.
- **Cost**: ~$100, acceptable for Phase 1 validation.

## Next Steps

1. Order Bangle.js 2 ✅ (deployed — see session-log.md)
2. Spec minimal logging app (single-tap capture, optional voice note, Bluetooth sync)
3. Generate app code via Claude
4. Deploy to device and validate Phase 1 (3–4 weeks of live logging)
