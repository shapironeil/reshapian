# Feature: FEATURE_NAME

Status: idea | drafting | in-progress | implemented | parked
Owner: YOUR_NAME_OR_EMPTY
Created: YYYY-MM-DD
Last Updated: YYYY-MM-DD
Version: v1
Related Areas: scripts/game.js, scripts/menu.js, index.html, styles/main.css, models/\*

## 1) Summary (what & why)

Write 2–5 sentences:

- What’s the feature?
- Why are we doing it (player value / dev value)?
- What’s explicitly out-of-scope (one sentence).

## 2) Player experience (behavior & controls)

Describe the intended behavior from the player’s perspective.

- Entry point (how does the player trigger it?)
- Controls (keys/mouse/UI)
- Feedback (UI prompts, sounds, camera, animations)
- Failure states (what happens if you can’t do it?)

## 3) Acceptance criteria (definition of done)

Make this testable.

- [ ] AC1: …
- [ ] AC2: …
- [ ] AC3: …

## 4) UX / UI changes

If any DOM/CSS changes are needed:

- New UI elements (ids/classes)
- Where they live (`index.html` containers)
- Styling notes (reuse existing classes like `.menu-btn`, overlays z-index rules, etc.)

## 5) Technical design (how)

### Proposed approach

- Core logic location (e.g. `scripts/game.js`): …
- Menu/settings wiring (e.g. `scripts/menu.js`): …
- If you need to expose a new global API: `window.someFunctionName = function (...) { ... }`

### Data & state

- New globals/variables (if any): …
- Persistence scope: session-only | saved (if saved, where?)

### Constraints (project rules)

- 100% offline (no remote assets / no HTTP)
- Renderer JS must be browser-safe (no Node APIs)
- Don’t modify vendored libs in `assets/libs/` unless unavoidable

## 6) Task breakdown (implementation checklist)

Small, ordered steps that an AI can execute.

- [ ] Task 1: …
- [ ] Task 2: …
- [ ] Task 3: …

## 7) Edge cases & risks

- Edge cases: … (e.g., feature used while paused, UI open, no weapon equipped)
- Perf risks: … (avoid heavy work in animation loop)
- Security / Electron risks: …

## 8) Test / verification plan

How will we confirm it works?

- Manual test steps (repro steps)
- Any automated checks (if applicable)
- Expected visual result

## 9) Open questions

- Q1: …
- Q2: …

## 10) Notes / scratchpad (AI iteration log)

Use this free-form section to collaborate with the AI while implementing.

- Decisions made:
- Tradeoffs:
- Follow-ups / future v2 ideas:
