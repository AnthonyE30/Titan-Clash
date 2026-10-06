# Titan Clash UI Identity

## Visual language

The Command Center treats mech selection like a tactical deployment briefing. Hard-edged cards, clipped silhouettes, telemetry labels, thin gridlines, frame IDs, and lock-state indicators connect the menu to the arena HUD without imitating any game's exact screen. High-contrast names and action labels stay readable above decorative circuitry.

The roster card is a compact unit readout: frame name, combat role, difficulty, and P1/P2/CPU ownership markers. Selecting or hovering a card updates the dossier with an abstract portrait silhouette and battlefield summary. The dossier separates abilities, five comparative stat bars, strengths, and weaknesses so players can scan identity before deployment.

Lock-in is a clear two-step interaction: assign a frame to the active pilot slot, then confirm that pilot. A short pulse/scale animation, changed border, and persistent Locked label give confirmation. Deployment becomes available only when each participating pilot is locked.

## Color themes

- **Base system:** deep navy/graphite surfaces with cool gray telemetry and restrained cyan highlights.
- **P1:** cyan (`#59e2dc`) edge, lock state, and ownership tag.
- **P2:** orange (`#ff8958`) edge, lock state, and ownership tag.
- **CPU:** orange team treatment with a distinct `CPU // difficulty` label and `CPU` roster badge.
- **Mech identity:** each dossier and card consumes `mech.visual.color` and `mech.visual.accent` from the registered mech definition.
- **Status:** gold is reserved for ready/ultimate emphasis; amber/red identifies warnings or weaknesses.

Keep text contrast high; use mech colors as edges, portrait lighting, and accents rather than as low-contrast paragraph colors.

## UI hierarchy

1. **Action:** deployment status and lock-in controls.
2. **Choice:** all roster cards presented together with name, role, difficulty, and pilot ownership.
3. **Inspection:** portrait, passive, special, ultimate, stats, strengths, and weaknesses for the focused frame.
4. **Configuration:** arena, match format, CPU difficulty, or boss target.
5. **Controls and telemetry:** concise control reminder, active frame count, and ownership state.

The main menu, battle/boss/training setup, options, and Boss Rush placeholder are HTML screens above the canvas. `main.js` owns navigation and match handoff. `uiManager.js` owns in-match HUD/pause/victory, including training telemetry and frame-step visibility. Keep command-center markup in `index.html`, visual rules in `menu.css`, and data-derived roster presentation in `data/mechPresentation.js` plus registry values.

## Data and stat presentation

The eight playable mechs remain the source of truth for name, role, abilities, passive, visual colors, attacks, movement, weight, and resistance. `data/mechPresentation.js` contains UI-only difficulty ratings and concise authored strengths/weaknesses. Stat bars are derived from the actual registered roster: damage from attack/special payloads, mobility from movement stats, defense from weight/resistance, range from ability geometry/projectile reach, and technical difficulty from the authored rating. These bars are comparative guides, not a balance score.

Adding a mech to `MECHS` requires a presentation record before the selection screen can render it; a missing record throws explicitly instead of silently leaving a partial card. The roster itself is generated from the registry, so counts and selection cards do not need hand-maintained lists.

## Expansion workflow

1. Register the composed mech in `data/mechData.js`.
2. Add `difficulty`, `difficultyValue`, two strengths, and two weaknesses to `data/mechPresentation.js`.
3. Ensure the mech has a non-empty name, role, `visual.color`, `visual.accent`, passive description (or no passive), and special/ultimate names.
4. Check comparative bar calculations against the complete roster; update normalization only if a new stat dimension is introduced.
5. Confirm roster card ownership tags, hover/focus preview, P1/P2 assignment, lock/unlock pulse, CPU designation, and boss-mode single-pilot layout in the browser.
6. Preserve keyboard focus, reduced-motion behavior, responsive card dimensions, and the existing `Game.startMatch` match handoff.

For a new display-only stat or ability field, extend the dossier renderer without changing fighter/combat data. For new gameplay stats, use the established mech/component architecture first; do not create character-select-only copies of combat values.
