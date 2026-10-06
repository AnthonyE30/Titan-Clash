# Titan Clash UI Flow

## Overview

The menu overlay in `index.html` contains independently owned screens. `js/main.js` owns navigation, menu state, setup handoff, and control wiring. `ui/uiManager.js` continues to own only in-match HUD, pause, and victory presentation. Menu visuals and transition rules live in `menu.css`; this keeps front-end presentation out of game/combat systems.

## Navigation flow

```text
Main Menu
├── Battle → Battle Setup → Deploy → Match → Victory
├── Boss Battle → Boss Setup → Deploy → Boss Match → Victory
├── Boss Rush → Mech/Difficulty Setup → Boss Sequence ⇄ Intermission → Graded Results
├── Training → Training Setup → Practice Match → Main Menu
├── Pilot Profile → Read-Only Career Statistics → Main Menu
└── Options → Main Menu

Match → Pause → Resume
              └── Change Mechs / Arena → Setup → Deploy
Setup → Main Menu → Resume Match (when the prior match is paused)
Victory → Play Again
        ├── Change Mech (Boss Rush)
        └── Main Menu
```

The Battle flow selects Stock, Timed, or Last Mech Standing. Boss Battle configures the player's mech and registered boss independently. Boss Rush configures a mech and Normal, Hard, or Extreme difficulty, then uses the registered boss order and each boss's dedicated arena. Its intermission reports the cleared boss and current run totals; continuing restores the fighter while retaining remaining stocks. Results show grade and run totals with retry, mech-change, and main-menu actions. Training selects an arena, two mechs, and a dummy behavior before launching a regular match in training mode.

Escape returns from a secondary menu screen to the Main Menu. When setup was opened from a paused match, the Main Menu also exposes Resume Match so backing out cannot strand the paused game. During an active match, Escape retains its existing pause behavior. Setup remains frozen behind the overlay until deployment starts the selected match.

## Screen ownership

- `main-menu-screen`: primary Battle, Boss Battle, Boss Rush, Training, and Options destinations.
- `setup-screen`: local/CPU match, boss, Boss Rush, or training configuration; `openSetup` switches which fields are available based on the selected mode.
- `placeholder-screen`: shared presentation for unimplemented modes; its title and summary are populated from the selected destination.
- `options-screen`: visual screen-shake and reduced-menu-motion settings.
- `profile-screen`: local callsign editing plus read-only career statistics and mech usage, populated by `ProfileManager`.
- `pause-overlay` and `victory-overlay`: existing match-state dialogs managed through `UIManager`.
- `rush-intermission`: Boss Rush recovery/report dialog; `Game` freezes run time until the pilot continues.
- `rush-result-details`: grade and final run statistics within the victory overlay; Change Mech returns to Boss Rush setup.
- Training telemetry and sandbox controls live in the in-match arena UI; frame-step controls are shown in the pause overlay only for training matches.
- `menu.css`: screen transitions, responsive layout, and mech-color-inspired art treatment.
- `js/main.js`: screen changes, setup, match launch, and overlay coordination.

`showScreen` owns active-screen state and transition timing. Each screen has an `aria-hidden` state; transitions can be shortened by Reduced Menu Motion. Screen Shake calls the existing camera presentation setting, without altering hit/combat outcomes.

## Extension patterns

1. Add a new screen section in `index.html` with a unique ID and `menu-screen` class.
2. Register it in `main.js` through `showScreen`; avoid direct visibility changes in multiple click handlers.
3. Give every new screen a clear back route and keyboard-accessible buttons.
4. Keep match configuration in `Game.startMatch`; menu screens only collect options and initiate the existing flow.
5. Keep HUD, pause, and victory ownership in `UIManager`; do not put navigation state in gameplay entities.
6. Add presentation styles to `menu.css`, respecting the reduced-motion option and narrow viewports.

## Future AI Notes

### Menu architecture

The menu is an HTML/CSS overlay above the canvas, not a canvas scene. It has one active menu screen at a time; the match remains in the existing game lifecycle underneath. Boss Rush uses the existing setup screen and game lifecycle, with progression and recovery owned by `Game`, difficulty selection collected by `main.js`, and intermission/results presentation owned by `UIManager`. Training shares Battle setup and match handoff, with its dummy/system details owned by `js/training/` and `docs/TRAINING_MODE.md`.

### Navigation flow

Primary menu choices route to battle, boss, Boss Rush, training setup, the Pilot Profile, or options. Deployment passes selected data to `Game.startMatch`. Boss Rush intermission continuation advances its registered boss sequence; result actions retry the same setup, change the mech, or return to the complete main menu. Pause setup and victory return preserve their distinct purposes.

### Screen ownership

`main.js` owns navigation and setup; `UIManager` owns in-game HUD/pause/victory overlays; `index.html` owns screen structure; `menu.css` owns screen appearance and transitions; `Game` and `Camera` remain responsible for match and camera behavior. Keep these boundaries when adding a screen.

### Future menu expansion

Add content select/draft, mech inspection, accessibility, audio, and remapping screens as separate menu screens. Route with `showScreen`, keep deployment data-driven, preserve overlay and keyboard behavior, and provide an explicit return path. Avoid introducing a second match-start path for new modes.

### Known limitations and next steps

Options currently cover screen shake and menu motion only. Boss Rush setup selects the player mech and difficulty, while the ordered bosses are displayed from the registry. Training's match flow, dummy behaviors, sandbox controls, and practice telemetry are implemented and documented in `docs/TRAINING_MODE.md`. Future work could add persistent option storage, richer mech previews using registered mech colors, controller/gamepad navigation, and focus restoration after transitions.
