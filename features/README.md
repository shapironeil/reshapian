# Feature specs & versions

This folder is a **scratchpad for feature work**. Each feature or epic lives in its own file, with optional versioning as the feature evolves.

## Start here: template

Use `feature-sample-game-improvement.md` as the **standard template**. Copy it and rename it to your feature name.

Example:

- Copy `feature-sample-game-improvement.md` → `feature-dialogue-system.md`

## Naming

- One file per feature/epic.
- Recommended pattern:
  - `feature-<short-name>.md` for the main spec.
  - `feature-<short-name>-v2.md`, `feature-<short-name>-v3.md`, etc. for iterations.

Examples:

- `feature-dialogue-system.md`
- `feature-dialogue-system-v2.md`
- `feature-animal-ai.md`

## Recommended structure per file

Use this structure so AI agents (and humans) can understand and implement the feature:

---

Title: FEATURE_NAME
Status: idea | drafting | in-progress | implemented | parked
Owner: YOUR_NAME_OR_EMPTY
Related Areas: game.js, menu.js, index.html, styles/main.css, models/\*, etc.

## Summary

Short, high-level description of what this feature should achieve.

## Player Experience

- Bullet points describing what the player sees/does.
- Include controls, UI changes, and feedback.

## Technical Notes

- High-level notes about Three.js, Electron, DOM structure, or models.
- Any constraints (performance, offline, security, etc.).

## Tasks / Sub-features

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Open Questions

- Question 1
- Question 2

## Notes / Scratchpad

Free-form notes, design sketches, dead-ends, and links to commits or branches.

---

You can keep older versions of the same feature in additional files (e.g. `-v2`) to preserve history while giving the AI the latest target to implement.

## Workflow (AI-friendly)

1. Create the feature file from the template.
2. Fill in **Summary**, **Acceptance criteria**, and **Task breakdown**.
3. Ask the AI to implement from that file (treat it as the source of truth).
4. As work progresses, update:

- `Status`
- `Last Updated`
- task checkboxes
- notes in "Notes / scratchpad"
