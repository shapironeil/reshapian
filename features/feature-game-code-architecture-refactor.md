# Feature: Game Code Architecture Refactor (game.js)

Status: in progress
Owner:
Created: 2025-12-13
Last Updated: 2025-12-13
Version: v1
Related Areas: scripts/game.js, scripts/menu.js, index.html, styles/main.css

## 1) Summary (what & why)

This feature refactors `scripts/game.js` into a clean, maintainable architecture by introducing clear abstractions (runtime + state + systems + UI) while keeping the project constraints: **no bundlers**, **no ESM imports**, and **100% offline**.

Goals:

- Improve developer velocity and prevent regression risk.
- **Shrink `game.js` footprint** by moving systems into dedicated modules.
- Keep player-facing behavior unchanged.

Out-of-scope: changing gameplay behavior, adding new 3D models/assets, or rewriting the UI design.

## 2) Player experience (behavior & controls)

No player-visible change is intended.

- Entry point: unchanged (`MENU` → start game)
- Controls: unchanged (WASD move, Space jump, E interact, Q shoot, R reload, Tab inventory, Esc close overlays)
- Feedback: unchanged (crosshair, interact prompt, shoot prompt, reload bar, inventory overlay, PC screen, dialogue)
- Failure states: unchanged (missing model logs warnings; UI elements missing should not hard-crash)

## 3) Acceptance criteria (definition of done)

- [ ] AC1: `window.startGame()` and `window.stopGame()` still work and are the only required entry points for `scripts/menu.js`.
- [ ] AC2: The refactor produces a multi-file structure where each system owns its state and exposes a small API; `scripts/game.js` becomes a thin orchestrator (< ~200 lines target, flexible).
- [ ] AC3: No new runtime dependencies; Three.js and GLTFLoader remain vendored in `assets/libs/`.
- [ ] AC4: Core gameplay works as before: movement, collisions, model loading, interact prompt, PC overlay, dialogue overlay, inventory + equip weapon, shoot, reload, bullets hitting animals/characters.
- [ ] AC5: Game stop/exit cleans up correctly (no duplicate event listeners on restart; renderer removed from `#game-canvas`).

## 4) UX / UI changes

No UI changes required.

Notes:

- Keep existing DOM ids/classes (e.g. `#interact-prompt`, `#shoot-prompt`, `#inventory-overlay`, `#pc-screen`, `#dialogue-ui`, `#health-fill`).
- Keep existing z-index layering rules (canvas < prompts < overlays).

## 5) Technical design (how)

### Proposed approach

Implement as _classic browser-safe JS files_ loaded via `<script src="...">` (no `import`, no bundler).

Introduce a single global namespace to avoid random globals:

- `window.RSG = window.RSG || {};`
- Recommended modules:
  - `RSG.core` (runtime/three setup)
  - `RSG.state` (single state tree)
  - `RSG.systems` (input/movement/collision/loader/interactions/projectiles/ai)
  - `RSG.ui` (DOM-only UI logic)
  - `RSG.gameplay` (inventory/weapons rules & data)
  - `RSG.content` (data-driven model lists)

Keep the existing public API (menu integration):

- `window.startGame = function() { ... }`
- `window.stopGame = function() { ... }`
- `window.updateMouseSensitivity = function(value) { ... }`

### Data & state

Replace ad-hoc globals with one state tree created per run:

- `state.mode`: `'gameplay' | 'pc' | 'dialogue' | 'inventory'`
- `state.player`: movement/jump/velocity/health
- `state.input`: key states, pointer lock status
- `state.world`: models arrays, interactables, colliders, staticTargets
- `state.combat`: bullets, reload state
- `state.inventory`: items + equipped slots
- `state.npc`: animals + robot data + characters
- `state.settings`: mouse sensitivity, etc.

Important split (critical structural improvement):

- Weapon definitions vs runtime state
  - `weaponDefs`: static fields (damage, capacity, ammoType)
  - `weaponState`: mutable (ammo in mag)

### Systems

Define a simple system interface:

- `init(ctx)` optional
- `update(ctx, dt)` optional
- `dispose(ctx)` optional

Where `ctx` is a shared context object:

- `ctx.scene`, `ctx.camera`, `ctx.renderer`
- `ctx.state` (single state tree)

Update order (single loop):

1. input
2. player motor (movement + collisions)
3. AI (animals + robot)
4. interactions (nearest interactable routing)
5. combat/projectiles (bullets)
6. UI (prompts, overlays)
7. render

### File/module breakdown (target)

Minimal, readable structure (exact names flexible):

- `scripts/game.js` (thin wiring + window APIs)
- `scripts/core/runtime.js` (loop start/stop, dt clamp)
- `scripts/core/three-setup.js` (scene/camera/renderer creation + resize)
- `scripts/state/state.js` (createInitialState)
- `scripts/content/models.js` (just the furniture list)
- `scripts/systems/input.js`
- `scripts/systems/player-motor.js`
- `scripts/systems/collision.js`
- `scripts/systems/model-loader.js`
- `scripts/systems/interactions.js`
- `scripts/systems/projectiles.js`
- `scripts/systems/ai.js`
- `scripts/gameplay/inventory.js`
- `scripts/gameplay/weapons.js`
- `scripts/ui/hud.js` (interact/shoot/health/reload)
- `scripts/ui/inventory-ui.js`
- `scripts/ui/pc-ui.js`
- `scripts/ui/dialogue-ui.js`

### Constraints (project rules)

- 100% offline (no remote assets / no HTTP)
- Renderer JS must be browser-safe (no Node APIs)
- Don’t modify vendored libs in `assets/libs/` unless unavoidable
- Preserve `window.startGame` / `window.stopGame` contract used by `scripts/menu.js`

## 6) Task breakdown (implementation checklist)

Milestones are ordered to minimize breakage and keep the game runnable throughout.

- [x] Task 1: Introduce `window.RSG` namespace + `createInitialState()` and move current globals into `state.*` (no file split yet).
- [x] Task 2: Add `state.mode` and replace `isUsingPC/isInDialogue/isInventoryOpen` checks with a single mode gate (keep behavior identical).
- [x] Task 3: Extract UI-only functions into `scripts/ui/*` and have them read/write through `state` + gameplay APIs.
- [x] Task 4: Extract input listeners into `scripts/systems/input.js`; ensure listeners are registered once and removed on stop.
- [x] Task 5: Extract movement/collision into `player-motor` + `collision` systems.
- [x] Task 6: Split inventory + weapons + projectiles into `scripts/gameplay/*` + `scripts/systems/projectiles.js`.
- [x] Task 6b: Extract inventory runtime (UI wiring stays) into `scripts/gameplay/inventory.js`, keeping data in state.
- [x] Task 7: Move model list into `scripts/content/models.js` and loader into `scripts/systems/model-loader.js`.
- [x] Task 8: Wire script tags in `index.html` in dependency order (no bundler).
- [ ] Task 9: Add a short smoke-test checklist in this feature file’s verification section and perform it after each milestone.

## 7) Edge cases & risks

- Restarting the game multiple times can accumulate event listeners if not cleaned up.
- UI mode gating: avoid allowing movement/shoot while PC/dialogue is open.
- Weapon data split: ensure reload logic uses the correct ammo key consistently (`ammoType` vs `ammotype` typo risk).
- Model loading errors: keep running even if some models are missing.

## 8) Test / verification plan

Manual smoke test (run after each milestone):

1. Start game from menu.
2. Pointer lock works on click; mouse look works.
3. WASD + Space works; collisions prevent walking through models.
4. Walk to laptop → prompt shows “E - Usa PC” → PC overlay opens → Esc closes.
5. Walk to robot → start dialogue → choose options → Esc closes.
6. Pick up a pistol → open inventory → open item detail → equip right hand.
7. Q shoots (ammo decreases); bullets collide with static targets.
8. Shoot an animal: it falls and stays.
9. Press R reload: reload bar fills, ammo transfers from inventory.
10. Stop game → return to menu → start again → controls behave normally (no doubled inputs).

## 9) Open questions

- Should `models` be separated into `world.renderTargets` vs `world.collisionTargets` to reduce raycast target size?
- Do we want to keep the current “bullet stops and becomes permanent” behavior long-term, or cap bullet decals?
- Should inventory items be “instances” (support duplicates) vs “one per weapon id”?

## 10) Notes / scratchpad (AI iteration log)

- Current `game.js` mixes ~10 systems (runtime, three setup, input, motor, collisions, loader, interactions, combat, AI, UI). This refactor aims to separate concerns without introducing new dependencies or changing gameplay.
- Key structural improvement: unify mode flags into `state.mode` and split weapon defs vs weapon state.
- Keep `window.startGame/stopGame` stable for menu integration.
- Movement system extracted: `scripts/systems/movement.js` with init({ state, getCamera, resolveCollisions, isGameplayMode, constants }) and update(delta); wired in `initThreeJS()` and the main animate loop, fallback to legacy `updateMovement` remains for safety.
- Weapons/projectiles extracted: `scripts/gameplay/weapons.js` holds static defs (with ammoType alias), `scripts/systems/projectiles.js` handles shoot/update/reload using state + UI hooks; legacy wrappers in `game.js` delegate and fall back to old logic if module missing. Inventory runtime is still in `game.js` (split later if needed).
- Inventory runtime extracted: `scripts/gameplay/inventory.js` now owns toggle/render/detail/equip logic using state + UI; `game.js` delegates and updates player/weapon flags via callbacks. Remaining chunks: model list + loader, interactions/AI glue.
- Model content/loader extracted: `scripts/content/models.js` holds the furniture/props/NPC list; `scripts/systems/model-loader.js` loads GLBs, registers collisions/interactables/animals/characters/robotData; `game.js` delegates `loadModels()` to it. Remaining chunks: interactions/AI glue.
- Interactions + AI systems extracted: `scripts/systems/interactions.js` routes prompts, PC/dialogue, and item pickup; `scripts/systems/ai.js` updates animals and robot follow; `game.js` delegates animate loop + input actions; `index.html` loads the new scripts before `game.js`.
