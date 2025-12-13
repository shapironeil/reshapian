# Feature: Environment Profiles & Switching

Status: drafting
Owner: TBD
Created: 2025-12-13
Last Updated: 2025-12-13
Version: v1
Related Areas: scripts/game.js, scripts/systems/environment.js, scripts/systems/model-loader.js, scripts/systems/interactions.js, scripts/menu.js, scripts/content/, index.html, styles/main.css, models/\*

## 1) Summary (what & why)

- Introduce a first-class environment abstraction so the game can load distinct scenes (lighting, layout, props, ambience) from a reusable registry instead of a single hardcoded setup.
- Enable multiple themed maps (warehouse, forest, shooting range, indoor house, etc.) that players/devs can switch between without rewriting core logic or forking `createEnvironment()`.
- Reduce coupling between scene content and core systems, speeding iteration: designers add/modify environments via config + local assets with predictable teardown/apply steps.
- Out of scope: online downloads/streaming of assets, full physics overhaul, or dynamic terrain generation.

## 2) Player experience (behavior & controls)

- Entry: From the hub/settings, the player chooses an environment before starting the 3D session. Default stays the current warehouse if nothing is selected.
- Optional dev toggle: allow switching to another environment from a developer-only dropdown/button while paused/in-menu (not during active combat to avoid jarring swaps). Hot switches are gated behind a “dev mode” flag to avoid confusing players.
- Controls/UI: menu select (dropdown or list) labeled “Environment”; confirmation toast/text showing the selected environment when starting; dev toggle may use a small dropdown and “Apply” button.
- Controls/UI (current impl): selector placed in Settings; applies selection before start; dev toggle TBD.
- Feedback: scene reload uses a quick fade-to-black and back; prompts update based on available interactables in the chosen environment. If an environment fails to load, fall back to default and show a brief error banner.
- Failure states: invalid environment id or missing assets gracefully fall back to default; when switching mid-session, player respawns at the new environment’s spawn point with state reset (position, interactables, bullets cleared) and HUD label updates.

## 3) Acceptance criteria (definition of done)

- [ ] AC1: Environment definitions live in a dedicated registry (single source of truth) with id, label, description, spawn, lighting/setup hooks, and model lists/placements.
- [ ] AC2: Game boot picks the selected environment from state/UI; falling back to the default environment if selection is absent or invalid, with a visible fallback notice.
- [ ] AC3: Switching environments triggers teardown/disposal of current scene content (interactables, models, lights, projectiles) and loads the new environment without JS errors or orphaned objects.
- [ ] AC4: Menu exposes an environment selector (currently in Settings); selection is reflected when entering the game and survives leaving/returning to the hub within a session (session memory or localStorage if allowed).
- [ ] AC5: Missing asset or load failure shows a user-facing message and reverts to the default environment, keeping the app responsive.
- [ ] AC6: Player is repositioned to the target environment’s spawn with movement state cleared; HUD/environment label matches the active environment after any switch.

## 4) UX / UI changes

- Add an “Environment” selector to the hub or settings panel (currently in `#settings-menu`) using existing styles (`.menu-btn`, `.game-item-btn`, or a styled `<select>` consistent with dark theme).
- Optional dev-only control in the in-game overlay (small dropdown/button near `#game-container` header) gated behind a “dev mode” flag and disabled while a switch is in progress.
- Use fade overlay (reuse `.pc-screen` style layering or add a minimal `.fade-overlay`) to mask scene swaps; ensure z-index keeps prompts above canvas but below modal overlays.
- Add a small text label in-game showing current environment name (reuse `.hud` text style if present); label updates after switch and hides during fade.

## 5) Technical design (how)

### Proposed approach

- Create an environment registry module (e.g., `scripts/content/environments.js`) exporting a list/map of environment configs and helpers: `getEnvironments()`, `getEnvironment(id)`, `getDefaultEnvironmentId()`.
- Environment schema: `id`, `label`, `description`, `spawn` (pos + yaw), `lighting` (ambient, directional intensities/colors), `skybox/fog` (optional), `models` (array compatible with `loadModels`), `layoutHook(scene, helpers)` for bespoke tweaks, `devOnly` flag for prototypes.
- Update `scripts/game.js` to reference the registry when initializing the scene: `setActiveEnvironment(id)`, `applyEnvironment(scene, registryEntry)`, and integrate with existing `createEnvironment()` so the environment content is driven by the selected config (legacy defaults become one registry entry).
- Add a lightweight `EnvironmentManager` wrapper (could live in `game.js` or `scripts/systems/environment.js`) to handle: current id, selected config, teardown (`clearSceneObjects` leveraging existing arrays), and application of new configs. Manager orchestrates fade overlay and player respawn.
- Expose global APIs for UI wiring: `window.setEnvironment(id)` / `window.listEnvironments()` / `window.getActiveEnvironment()`; ensure menu calls guard with `typeof window.setEnvironment === 'function'`. Consider `window.reloadEnvironment()` in dev mode for hot reload (not yet implemented).
- Menu wiring (`scripts/menu.js`): read registry to populate the selector, store selection in session state (in-memory or `localStorage` if pattern is acceptable), and pass the chosen id to `startGame` / environment setter prior to game init. Disable selector while a switch is in progress.
- Keep loaders offline: use existing `GLTFLoader` via `assets/libs/GLTFLoader.js` and ensure all model paths are local under `models/`.

### Data & state

- New state: `currentEnvironmentId`, `pendingEnvironmentId`, `environmentRegistry` (array/map), `activeEnvironmentConfig`, `envSelectionSource` (menu/session), `isSwitching` flag for UI gating.
- Persistence: session-only for now (reset on app restart). Optionally store last selection in `localStorage` if allowed by existing patterns.
- Scene data: reuse existing globals (`interactables`, `staticTargets`, `movingAnimals`, `bullets`) and clear them on switch; no duplicate arrays. Track disposable scene objects to ensure cleanup (`disposables` list).

### Constraints (project rules)

- 100% offline (no remote assets).
- Renderer JS must stay browser-safe (no Node APIs in renderer); keep using `<script src>` includes.
- Do not modify vendored libs in `assets/libs/`.

## 6) Task breakdown (implementation checklist)

- [x] Create `scripts/content/environments.js` registry with at least 2 example environments (current warehouse as default + a minimal test range) referencing existing models/assets.
- [x] Refactor `scripts/game.js` to load environment via registry, adding `EnvironmentManager` helpers (apply, teardown, respawn, fade) and reusing `createEnvironment` defaults as a registry entry.
- [x] Implement teardown that disposes meshes/materials/geometries/lights and clears global arrays before applying a new environment.
- [x] Wire menu UI (`scripts/menu.js`, `index.html`, `styles/main.css`) with an environment selector that updates session selection and calls the global setter; gate dev-only hot switch UI (dev UI pending).
- [x] Add user feedback: fade overlay during switch and a small HUD label for current environment.
- [ ] Handle errors/fallback: catch model load failures, show message, revert to default environment; surface failures in console for debugging (basic console warnings exist, user-facing banner TBD).
- [ ] Add manual test notes to README or feature docs (this file) once implemented.

## 7) Edge cases & risks

- Switching while bullets, animals, or interact prompts are active—must clear arrays and remove objects from the scene to avoid ghosts; also clear raycast targets.
- Player standing inside geometry after switch—respawn to environment spawn point and reset velocities; consider camera clipping on spawn.
- Missing model files or malformed config—should not crash; log and fallback gracefully with a toast/banner.
- Performance: repeated switches could leak Three.js objects if dispose isn’t called; must dispose geometries/materials/lights/textures.
- UI desync: menu selection not applied if game already running; need clear UX gating (disable selector while in active session or allow hot reload with fade).
- Partial load failure: if some models fail, either rollback entire switch or mark environment invalid and fall back.

## 8) Test / verification plan

- Manual: select default environment, start game, confirm warehouse loads as before (no regressions).
- Manual: pick alternate environment, start game, observe different layout/lighting and correct spawn location; HUD label matches selection.
- Manual: switch environments via dev control (if enabled) and confirm fade, teardown, no console errors; player and interactables reset; prompts still work.
- Manual: intentionally set an invalid environment id -> app falls back to default and shows error banner/toast; app remains responsive.
- Manual: rapid switches (2–3 times) to check for memory growth/console warnings; verify no lingering meshes in scene graph and arrays are empty between switches.
- Manual: simulate missing asset (rename a model temporarily) to confirm failure path and fallback notice.

## 9) Open questions

- Should environment selection be allowed mid-combat, or only when paused/in menu?
- Do we need smooth transitions (cross-fade/hold) or is a simple fade-to-black sufficient?
- Should last-used environment persist across app restarts (localStorage) or stay session-only?
- Do different environments need different AI/movement settings (e.g., navmesh), and how do we attach those to the registry?

## 10) Notes / scratchpad (AI iteration log)

- Decisions made: treat environment content as data-driven configs; single registry source of truth.
- Tradeoffs: registry-driven design adds upfront structure but simplifies adding future maps; fade-and-respawn approach is simplest for now.
- Follow-ups / future v2 ideas: async preloading of next environment; theme-based audio/ambience layers; per-environment difficulty modifiers; per-env AI/navigation data; dev-mode in-game selector that calls `applySelectedEnvironment`.
