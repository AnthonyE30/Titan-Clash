# Titan Clash — Project Context

## Purpose

Titan Clash is a dependency-free local arena fighter with versus, PvE boss, and sequential Boss Rush modes, using Canvas 2D and vanilla JavaScript ES modules. Open `index.html` directly or serve the directory with a static file server. The root `README.md` is the user/developer guide for controls and content authoring.

## Core architecture

- `js/game.js` coordinates match rules, combat, projectiles, arena events, and UI updates.
- `js/entities/fighter.js` models a controllable fighter. All human and AI movement uses the same `Fighter.move` and input APIs.
- `js/input.js` merges keyboard input with named virtual input sources.
- `js/physics.js` owns shared movement integration, platforms, knockback, and hitstun.
- `js/renderer.js`, `js/camera.js`, and `js/particleEngine.js` own scene drawing, camera behavior, and combat effects.
- `data/mechFactory.js` composes reusable mech modules. `data/mechs/` contains registered mech definitions; `data/components/` contains chassis, mobility, weapon, shield, thruster, and ability components.
- `data/arenaData.js`, `data/mechData.js`, and `data/bosses/` are the arena, mech, and boss registries. Five new non-boss-only arenas use registered event types and are available to PvP and Training through registry-derived selection.
- `data/mechs/` contains the selectable composed mech definitions. Current roster additions (Lancer, Bulwark, Nomad, Helios) reuse the registered passive and ultimate behavior catalogs.
- `data/mechPresentation.js` supplies selection-only difficulty, strengths, and weaknesses; roster visuals/stat bars otherwise derive from the registered mech definitions.
- `js/entities/boss.js` implements the non-fighter boss entity. `js/boss/` contains command-driven boss AI, phase transitions, and telegraph/cooldown-managed action execution.
- `js/arena/` contains the reusable arena-event lifecycle/manager and registered event types; legacy periodic arena hazards are adapted by the manager.
- Arena gameplay is entirely data-driven through dimensions, spawn points, platforms, hazards, and registered event definitions. Arena selection is shared by PvP and Training; bosses can reference an arena through their existing `arenaId`. `docs/ARENA_DESIGN_GUIDE.md` records layouts, event intent/tuning, balance, readability, and validation expectations.
- `js/ultimate/` owns data-selected ultimate behaviors, targeting, telegraphs, and active effect lifecycles.
- `js/training/trainingManager.js` emits practice-dummy semantic inputs, records combo/DPS telemetry, and schedules the six dummy behavior patterns. Training remains a normal `Game.startMatch` mode and uses the shared fighter and combat pipeline.
- `js/profile/profileManager.js` owns the versioned local Player 1 profile, localStorage persistence, and aggregate statistics including Boss Rush records. `Game` reports completed matches and authoritative damage/KO/boss/training/Rush events through its profile manager reference.
- `ui/uiManager.js` handles HUD and match overlays.
- `index.html` and `menu.css` define the menu screens; `js/main.js` owns front-end navigation and setup handoff. `UIManager` remains responsible for in-match HUD, pause, and victory overlays.

## Passive subsystem

Passive definitions are assigned through `mech.passive` as `{ id, description, parameters? }` data, or as an array for future combinations. `data/passives/passiveManager.js` maps IDs to `PassiveBase` subclasses in `data/passives/types/`; every fighter owns a manager. The manager dispatches hooks, while generic effect/result state is consumed by `Fighter` and shared physics. Do not add mech/passive ID branches to game, fighter, or physics code.

Current implementations:

- Atlas / `adaptive-shield`: one-hit shield after four seconds out of combat.
- Vanguard / `siege-core`: damage-scaled reduction to incoming damage and knockback.
- Phantom / `shadow-thrusters`: cloak and one-hit absorption after air dash.
- Tempest / `storm-drive`: stronger air control and faster airborne hitstun recovery.
- Lancer / `adaptive-shield`: out-of-combat shield recharge.
- Bulwark / `siege-core`: damage-scaled armor.
- Nomad / `shadow-thrusters`: brief cloak after air dash.
- Helios / `storm-drive`: improved air control and recovery acceleration.

See [`docs/PASSIVE_SYSTEM.md`](docs/PASSIVE_SYSTEM.md) for full hook contracts, event order, tuning and extension guidance. See [`docs/AI_NOTES.md`](docs/AI_NOTES.md) for CPU architecture.

## Boss subsystem

Boss Battle uses one normal player fighter and one registered boss. Boss Rush chains registered bosses in order, showing an intermission after each defeat; continuing restores damage, combat state, cooldowns, and ultimate charge while preserving stocks and run statistics. Boss definitions provide each encounter's arena and intro/defeat cinematic data. `Game` owns mode lifecycle, intermission, and transient Rush scoring/grades; `BossController` issues movement/action commands and registered reactive triggers. `BossAction` handles telegraph/cooldown/recovery and generic action kinds. `js/boss/bossRush.js` clones boss tuning for Normal/Hard/Extreme without mutating registry definitions and computes the run grade. The version-3 Pilot Profile stores completed Rush aggregates, overall/per-difficulty best times, and highest difficulty cleared. See [`docs/BOSS_SYSTEM.md`](docs/BOSS_SYSTEM.md) and [`docs/BOSS_RUSH.md`](docs/BOSS_RUSH.md) before extending these systems.

## Invariants for future changes

- Preserve the normal input → fighter → shared physics/combat path. AI should emit input; passives should use lifecycle contexts/modifiers.
- Keep mech-specific behavior in data/component/passive definitions, not named branches in shared systems.
- Keep passive hooks small, explicit, deterministic, and inexpensive. Mutate incoming hits through `context.result`; use `fighter.passiveState` for temporary state and `fighter.passiveModifiers` for shared simulation modifiers.
- Run `onSpawn` for initial construction and respawn. Do not execute fighter movement hooks while paused, hit-stopped, or respawning.
- Do not change core controls without an explicit request.
- Human and AI abilities use semantic `special`, `secondary`, and `ultimate` bindings from `PLAYER_CONTROLS`; direct secondary keys must remain separate from movement and attack inputs.
- Preserve the pause, victory, restart, and CPU opponent flows when changing match lifecycle.
- Keep boss controllers on the observation → command boundary. Use velocity and shared platform resolution for movement; never have controller/action code assign boss `x`/`y`.
- Keep boss phase/action IDs and tuning in boss data. Shared engine code should dispatch generic action kinds, not recognize a boss ID.
- Use boss definition `arenaId` to select a boss-only arena. Keep fall recovery in the entity lifecycle and use arena camera bounds where needed.
- Keep boss reactions attached to documented observations and registered action triggers; reactive decisions must not bypass action commands, hit handling, or movement integration.
- Keep event definitions in arena data, event effects in registered event classes, and event damage on the shared fighter receive-hit path.
- Add arenas to the registry with existing geometry and event types; validate selection, event warnings/avoidance, and bounds in PvP, Training, AI, and boss contexts instead of adding arena-specific gameplay branches.
- Keep ultimate mechanics in registered behavior classes and mech ability data; use shared hit callbacks and generic fighter transformation modifiers, never mech-ID branches.
- Input bindings live in `PLAYER_CONTROLS`; semantic `special`, `secondary`, and `ultimate` actions are consumed by the same `Game.processFighterInput` path for people and AI.
- Menu screens must launch matches through the existing `Game.startMatch` flow; do not add parallel match or combat paths to menu navigation.
- Training dummy actions must be submitted through named `Input.setVirtualKeys` sources and must not directly move fighters or invoke combat methods.
- Keep training-only sandbox settings at the match lifecycle boundary. Preserve standard move timing and damage resolution; Infinite Cooldowns clears special/dash waits and post-move cooldown but not the active move's authored recovery.
- Treat local profile statistics as read-only display data; the callsign may be edited, but stats must only change through profile event methods.
- Keep the profile storage key and schema normalization in `ProfileManager`; use registry IDs for mech records and never treat local profile data as secure or authoritative.

## Validation guidance

The project has no package install/build step. Use browser validation for end-to-end match behavior and workspace diagnostics for JS errors. For passive changes, test hook firing, effect duration, respawn reset, blocking/invulnerability interactions, and normal behavior on mechs without that passive. For Training Mode, verify each dummy behavior through virtual input, damage/combo/DPS accounting, the three sandbox toggles, position reset, and paused one-/ten-frame stepping. Also verify ordinary stock, CPU, and boss matches still pause and resume as before.

## Training subsystem

`TrainingManager` is constructed only for `mode: 'training'`. It writes keys under the `training-dummy` virtual-input source; `Fighter.move` and `Game.processFighterInput` continue to own normal movement and actions. Successful unblocked player hits feed the damage window through the shared `Game.onHit` callback. `UIManager` reads current fighter/passive state for telemetry, rendered as compact expandable metrics in the bottom combat-directive bar outside the arena view, and controls pause stepping. Arena/mech selection uses existing registries. See [`docs/TRAINING_MODE.md`](docs/TRAINING_MODE.md) for behavior timing, sandbox semantics, extension contracts, and debug guidance.

## Arena content subsystem

`ARENAS` in `data/arenaData.js` is the source of truth for dimensions, visual palette, spawns, platforms, legacy hazards, and registered event configurations. `main.js` derives PvP/Training arena options and the menu arena count from the registry. `Game` constructs `ArenaEventManager` for the selected definition; `Renderer`, shared fighter physics, boss physics, and `AIController` consume the common arena/event interfaces. Fusion Reactor, Orbital Weapons Platform, Meteor Belt, Gravity Test Facility, and Missile Foundry exercise Energy Overload, Laser Sweep, Meteor Storm, Gravity Shift, and Missile Barrage respectively without adding specialized gameplay code. Existing event damage targets active fighters; bosses are affected by shared arena physics/modifiers but are not damaged by arena events. See [`docs/ARENA_DESIGN_GUIDE.md`](docs/ARENA_DESIGN_GUIDE.md) and [`docs/ARENA_EVENTS.md`](docs/ARENA_EVENTS.md).

## Pilot profile subsystem

`ProfileManager` in `js/profile/profileManager.js` stores local Player 1 data in the versioned `titan-clash-pilot-profile` localStorage record. Match results count when a non-training match completes; training increments its own session counter at launch. Damage uses successful hit callbacks, KOs use the last successful fighter hit when an opponent loses a stock, and boss victories count after the defeat sequence. Mech usage counts completed matches, with favorite derived from the most-used mech. The main-menu profile screen renders read-only statistics and allows callsign edits. See [`docs/PROFILE_SYSTEM.md`](docs/PROFILE_SYSTEM.md) before extending stats, persistence, or multiplayer identity.

## Future AI Notes

### AI 2.0 adaptation, observation memory, and awareness

`AIController` keeps a capped, per-match rolling window of opponent jump, attack, special, and dash transitions. Profile `adaptationLevel` gates response strength: Easy only observes, Medium adjusts defensive reads and spacing, and Hard can favor configured anti-air attacks after repeated jump-then-attack patterns. This memory is transient and never enters the pilot profile or localStorage. Adaptive choices still emit semantic actions through `fighter.controls` and `Input.setVirtualKeys`; `Game.processFighterInput`, `Fighter.move`, and shared combat remain the only execution path.

Threat avoidance combines arena-event threat rectangles with generic boss telegraph, hazard, and attack geometry. It does not branch on arena IDs, boss names, or action names. Press F3 to show the developer-only overlay (behavior, target, threat, decision state, and tendency counts); it is hidden by default and appears only when an AI controller is active. Training dummies currently use `TrainingManager` rather than `AIController`, so this overlay does not appear for the dummy. Transition-based tendency recognition is approximate, and online adaptation must remain local or be defined by an authoritative synchronized model; never persist or trust client-reported observations for rewards. See [`docs/AI_NOTES.md`](docs/AI_NOTES.md) for extension workflow, limits, and invariants.

### Hook architecture

`PassiveBase` supplies the lifecycle contract. `PassiveManager` owns registered instances and dispatches hooks by method name with one context object. Passive definitions carry stable IDs and optional parameters; implementations are normal subclasses, not switches inside the match engine.

### Event flow

Spawn/respawn → `onSpawn`; each active fighter movement update → `onFrame`; accepted attack/jump/dash → matching action hook; incoming hit → `onDamageTaken` before shared damage/knockback; connected hit → `onAttackHit` then `onDamageDealt` only when not absorbed; stock loss/ultimate consumption → corresponding event. Full contexts and ordering details live in `docs/PASSIVE_SYSTEM.md`.

### Arena authoring and validation

Add a normal arena to `ARENAS`; standard PvP and Training selection is registry-generated. Use only the existing `platforms`, `spawnPoints`, `hazards`, and `events` contracts unless a shared architecture limitation is demonstrated. Choose a registered event class, tune warning/duration/cooldown for readable counterplay, and keep movement routes open. Check AI threat avoidance against its generic event threat boxes. Boss arena selection uses the boss definition's `arenaId`; event geometry and gravity modifiers use the same manager, but current damaging event types target fighters only. Arena layouts, balancing notes, readability guidelines, and the five new example arenas are in `docs/ARENA_DESIGN_GUIDE.md`.

### Extension patterns

Add a subclass under `data/passives/types/`, register it in `PASSIVE_TYPES`, configure it as `{ id, description, parameters }` in mech data, and use existing context/result/state/modifier contracts. New generic modifier effects should be applied once in shared simulation. Multiple passives can be composed with a definition array; define interaction/stacking semantics if they modify the same field.

### Performance considerations

The manager dispatches a small passive list directly. Keep per-frame hooks O(1); avoid arena/fighter scans, allocations, DOM work, logging, or event-bus expansion from `onFrame`. Reuse passive state, clamp timers, and profile before introducing caching or abstractions.

### Known limitations and recommended next steps

The framework currently supports one-hit absorption, basic result modifiers, and per-fighter runtime state; it has no layered shield health, passive UI/selection screen, persistence, or configurable stacking policy. Recommended next steps are automated hook/respawn tests, HUD indicators for active passive states, and explicit stacking rules only if composite passive loadouts become player-facing.

### Architecture limits discovered

Mechs compose existing chassis, mobility, weapon, shield, thruster, and special-ability components. Passive IDs must exist in `PassiveManager`; special `kind` values are limited to handlers in `Game.useSpecial`; ultimate `behavior` values must be registered in `js/ultimate/behaviors/index.js`. The current behavior catalogs cover the content needs of the eight-mech roster; do not add engine branches for an individual mech unless a reusable-system limitation is demonstrated.

### Input and ability bindings

Player 1 uses left/right mouse click for attack/primary special, E for an equipped secondary, and R for ultimate. Mouse input is received on the game canvas; the right-click context menu is suppressed there. Player 2 retains K/L/; for attack, primary special, and ultimate, with O for an equipped secondary. Controls are configured in `PLAYER_CONTROLS`; AI continues to use semantic actions mapped through the same controls and `Input.setVirtualKeys`.

### Future AI Notes — input extension

The system keeps AI and human input on the same `Input` and game-processing path. Mouse actions are normalized to semantic `mouse-left` and `mouse-right` keys and registered only on the game canvas; R remains Player 1's ultimate, and restart remains on its toolbar button. Extend with semantic actions and `PLAYER_CONTROLS` mappings rather than input-specific gameplay branches. Bindings are fixed and there is no remapping UI. If remapping is introduced, generate setup hints and HUD ability tooltips from control data and test simultaneous human/AI inputs. See [`docs/INPUT_SYSTEM.md`](docs/INPUT_SYSTEM.md) for the full control contract and extension notes.

### Future AI Notes — menu presentation

`main.js` owns menu navigation/setup state, `index.html` owns screen structure, `menu.css` owns transitions/responsive presentation, and `UIManager` owns match HUD/pause/victory. Main Menu routes into battle, boss, Boss Rush, or training setup; deployment calls `Game.startMatch`. Boss Rush collects a mech/difficulty and delegates its registered-boss sequence to `Game`. Add future screens with `menu-screen` and route via `showScreen`; preserve Escape/back navigation, aria-hidden state, reduced-motion support, and the established ownership boundaries. Current Options cover camera shake and menu motion; persistent settings and controller navigation are future work. See [`docs/UI_FLOW.md`](docs/UI_FLOW.md) before extending the front end.

### Future AI Notes — mech command center

The Battle setup screen is a registry-generated roster and dossier. `MECHS` supplies identities, abilities, passives, colors, and simulation stats; `MECH_PRESENTATION` supplies selection-only difficulty and authored strengths/weaknesses. P1/P2/CPU ownership, pilot switching, lock confirmation, and deploy readiness are UI state in `main.js`; they do not alter combat mechanics. Every active pilot must lock before deployment (only P1 locks in boss mode). The preview's bars are comparative UI values computed from the roster, not balance ratings. When extending, add presentation data for every new mech, preserve CPU/P2 visual distinction, keep hover/focus preview and keyboard-accessible lock-in, and continue launching through `Game.startMatch`. See [`docs/UI_IDENTITY.md`](docs/UI_IDENTITY.md) for visual language, hierarchy, and authoring workflow.

### Reusable mech design patterns

Express identity through paired stat tradeoffs, attack hitbox/startup/recovery data, existing special kinds, registered passive IDs, and registered ultimate behavior payloads. Use faster movement with lower weight for skirmishers, range and narrow hitboxes for precision roles, and slower movement with defense/resistance for fortresses. Configure color/accent/scale/width/height on chassis visuals. See `docs/MECH_DESIGN_GUIDE.md` for the four new roster entries and their counterplay guidance.

### Mech balance concerns

Role labels do not enforce match rules. AI ultimate decisions use the configured `radius`, so every ultimate definition should retain a meaningful radius even if its behavior uses a beam/zone-specific range. Validate special handler constraints, target elevation, startup/recovery, landing safety, and upper-platform access alongside damage. Transformation damage modifiers apply to fighter attacks, while abilities with their own attack payloads use their configured damage. Retest extreme stats and damage scaling across the roster before adding more passives or bespoke mechanics.

### Boss lifecycle

Boss mode creates the player's normal `Fighter` and a registered `Boss`, starts an intro state, then advances the controller/actions and shared arena simulation. Player attacks/hitboxes and boss attacks/projectiles/hazards resolve through overlap checks and `Fighter.receiveHit`. Boss defeat and player elimination enter timed cinematic states before the common victory overlay.

### Action architecture

`BossController` observes player position, boss phase, action readiness, and arena context, then submits `move`, `action`, or `charge` commands. Actions own telegraph and cooldown state; action payloads select generic effects. Keep attack definitions declarative and send damage through the existing fighter receive-hit path.

### Phase transitions

`BossPhaseManager` advances monotonically through configured health thresholds. A transition updates the active action set, cancels telegraphs, applies a short action lock, and triggers presentation feedback. Enrage is a separate health-threshold state that adjusts movement/cooldown pacing without replacing the phase.

### Extension patterns

Add a boss definition to `data/bosses/`, register it in `data/bosses/index.js`, and choose a spawn, size, movement tuning, phase thresholds/action IDs, and shared action payloads. Add a new generic action kind only when existing payload kinds cannot express the behavior; implement it in `js/boss/bossActions.js` and document its fields. Controllers may reuse behavior-tree principles/nodes but must continue emitting boss commands rather than writing coordinates.

### Boss known limitations

The first boss uses simple horizontal approach/retreat navigation with edge recovery and platform integration; it does not pathfind across disconnected platforms. If it falls, it recovers to the main platform. Phase actions are selected cyclically from ready actions, and timed hazard fields hit each fighter once. Boss attacks use normal fighter blocking and invincibility checks; there is no boss-specific guard-break mechanic, multiplayer aggro, persistent boss progress, or boss roster selection beyond the registry.

### Arena event lifecycle

`ArenaEventManager` constructs event subclasses from the selected arena definition and adapts the existing periodic `hazards` array into `legacy-hazard` events. Each event waits for its initial delay, shows a warning, becomes active for its duration, completes, and repeats after its cooldown unless configured as one-shot. The manager and event timers only advance in active gameplay; pause, hit stop, boss intro, and end states suspend them. See [`docs/ARENA_EVENTS.md`](docs/ARENA_EVENTS.md) for complete hooks and contracts.

### Arena authoring workflow

Keep static geometry and event tuning together in `data/arenaData.js`. Preserve old `hazards` records (`period`/`activeTime`) or add an `events` array of `{ id, type, name, severity, warningTime, duration, cooldown, initialDelay, ...typeFields }`. The renderer presents warning and active event visuals; `Game` advances the manager and routes event damage through normal fighter hit reception. Boss attack hazards remain a separate boss-action subsystem.

### Event execution flow

`Game.startMatch` constructs the manager for the chosen arena. Each active frame updates event state and event-local effects, then the renderer draws warning telegraphs and active geometry. Damage uses `ArenaEvent.hit` for per-event hit cooldowns and invokes the common arena-event combat feedback callback. `gravity-shift` contributes a manager gravity scale consumed by shared fighter physics and boss integration.

### Event extension patterns

Add a subclass under `js/arena/events/`, implement `onStart`, `onUpdate`, `onComplete`, and `draw` as needed, then register its data `type` in `events/index.js`. Use `{ game, arena }` lifecycle context and shared collision/combat helpers. Keep event-specific values in the arena data definition and avoid arena-ID branches in generic systems.

### Event known limitations and recommended next steps

Events run independently and may overlap; use delays/cooldowns to tune combinations. Missile targeting is sampled at launch, gravity scaling changes airborne gravity but not jump strength, and no event editor or synchronized multiplayer exists. Recommended next steps: add lifecycle/pause/legacy-compatibility tests, measure warning readability in each arena, and only add event scheduling/stacking rules when authored combinations need them.

### Ultimate behavior architecture

`UltimateManager` creates registered behavior instances from the mech's ultimate data. `UltimateBehavior` defines telegraph, active, completion, and hit de-duplication. `Game` consumes the per-stock charge and routes accepted hits through normal fighter or boss combat feedback; shared fighter fields consume generic transformation modifiers. Preserve this boundary: no ultimate behavior should be selected using a mech ID in `Game`.

### Ultimate targeting models

Targeting is owned by the behavior and configured through data. Current models include target-position AoE locks, facing-lane beams, owner-centered summon/persistent ranges, and repeated target-position selection for arena control. Future behaviors may add predictive, nearest-threat, or platform-aware target models while using the existing hit adapter.

### Ultimate visual effect hooks

Each behavior draws its own warning and active geometry through `draw(ctx)` in the renderer's world-space pass. Behavior classes can emit particles through `game.effects`; successful hits use `Game.applyUltimateHit` and thereby keep hit stop, shake, passives, and damage logic consistent. Give every damaging ultimate a readable warning before its active hit window.

### Ultimate expansion workflow

Implement a reusable subclass under `js/ultimate/behaviors/`, register its stable type key in `behaviors/index.js`, document its data contract in `docs/ULTIMATE_SYSTEM.md`, and configure it on a mech's `abilities.ultimate`. Use `this.hit` rather than direct health mutation. Legacy `kind: 'ultimate'` records without a behavior resolve to AoE and must remain supported.

### Ultimate known limitations and recommended next steps

Summons are currently visual behavior instances rather than independent entities; transformation modifiers cover damage, speed, and knockback resistance; target selection does not account for teams or network play. Add automated coverage for lifecycle timing, each built-in behavior, boss targets, cancellation on elimination/respawn, modifier cleanup, and AI's ordinary ultimate input before adding more tuning layers.

### Future AI Notes — Training Mode architecture

`TrainingManager` is constructed only for training matches. It schedules idle/walk/jump/attack/block/random patterns and writes named virtual keys into the existing `Input` aggregator; it must never set fighter coordinates or call combat actions directly. Human and dummy fighters still use `Fighter.move`, `Game.processFighterInput`, shared physics, and shared hit resolution. `Game` owns lifecycle-scoped sandbox options, reset positions, and damage sampling through `onHit`; `UIManager` reads live fighter/passive/cooldown state and owns telemetry presentation.

### Training data hooks

Training setup selects from `ARENAS` and `MECHS`; do not add parallel training-only content registries. Extend dummy behavior through semantic key schedules mapped from `fighter.controls`. Author new drill parameters in match configuration and pass them to the manager. Combo and DPS metrics should continue to derive from fighter combo state and successful, unblocked hit callbacks.

### Training debug opportunities

Paused one-frame and ten-frame stepping use the ordinary fixed simulation delta and are visible only during training pause. Use these tools to inspect move timing, hit-stop, cooldowns, passive state, and combo timeout. Validate sandbox toggles independently and compare dummy virtual keys with human inputs to verify parity.

### Training known limitations and recommended next steps

Dummy behavior is a lightweight timed pattern scheduler with bounded horizontal wandering, not a behavior tree, combo script, or platform route planner. DPS is a rolling five-second approximation. Infinite cooldowns clear special/dash waits and post-move attack cooldown while preserving active authored attack recovery. Add automated tests for input parity, damage/combo/DPS accounting, reset semantics, sandbox toggles, and frame-step queuing before introducing authored drills or more complex dummy decision-making.

### Future AI Notes — profile data structures

Profile storage is a versioned object with a callsign, favorite mech registry ID, per-mech completed-match counts, aggregate career counters, and Boss Rush totals, best times, and highest difficulty cleared. `ProfileManager.normalize` constrains stored values and filters mech IDs against `MECHS`; schemas v1 and v2 migrate while preserving existing counters and adding v3 defaults. Add statistic fields with defaults and normalization, and derive them from authoritative lifecycle callbacks. Callsign is editable; statistics are read-only in the UI.

### Future AI Notes — save architecture

`ProfileManager` is the sole owner of the localStorage key and write operations. `main.js` creates it and assigns it to `Game`; gameplay informs it through domain methods. Local persistence is synchronous and best-effort when browser storage is unavailable, with warnings/errors surfaced in the console. Do not distribute storage access across combat and menu code.

### Future AI Notes — multiplayer considerations

This local profile represents Player 1 and is user-editable through browser storage, so it is not a trusted record. Online profiles require authenticated identity and server-validated match outcomes, damage, and mech usage; define offline/online merge behavior before syncing. Never use local statistics as proof of rank, rewards, or anti-cheat state.

### Boss Rush — registration flow

`BOSSES` in `data/bosses/index.js` is authoritative. The Rush preview, default run order, and progression use its registry order; each boss selects its own arena through `arenaId`. A new valid registration automatically joins new Rush attempts without a separate Rush list.

### Boss Rush — difficulty modifiers

`js/boss/bossRush.js` clones source boss definitions and applies shared Normal/Hard/Extreme scaling to controller cadence, cooldowns, telegraphs, and recovery windows. Ordinary Boss Battle remains unmodified. Do not add boss-ID difficulty branches.

### Boss Rush — scoring architecture

`Game.bossRush` keeps transient simulation time, applied damage taken, stock-loss deaths, and clear count. Between boss encounters, intermission freezes the run clock and reports progress; continuing restores fighter damage/state and ultimate charge but preserves stocks. `calculateBossRushGrade` ranks progress with capped death, damage, and time penalties. At run end, Game commits exactly once through `ProfileManager`; profile normalization/persistence owns aggregate counters, best clear times, and highest difficulty cleared. Abandoned attempts do not save a Rush result, and local scores are not trusted leaderboard records.

### Boss Rush — expansion workflow

Register new bosses normally; verify registry order, their data-defined arenas/cinematics, and all three difficulty tiers. Test intermission recovery, deaths/damage/grades, career results, best times, and highest difficulty updates. Future rewards should be a separate validated post-clear result, not mixed into read-only statistics. Co-op should add a participant roster and explicit shared/per-player scoring without coupling progression to specific boss implementations. See [`docs/BOSS_RUSH.md`](docs/BOSS_RUSH.md).

### Lessons Learned — boss framework validation

The second boss reused registry selection, dedicated arena lookup, phase thresholds, standard cinematics, health UI, and most action lifecycles. Content validation found that the initial action catalog had no reusable sustained beam, timed defensive response, or post-action recovery window; those are now generic shared action capabilities rather than Aegis-only conditionals. Reactive actions also need to be evaluated outside the normal decision timer to respond consistently to a committed player attack.

### Framework Strengths — boss encounters

Boss definition data now composes movement/controller profiles, phase pacing, action payloads, recovery tuning, telegraph style, enrage, and arena selection. Boss-only arenas can independently schedule the existing arena events. This enables substantial encounter contrast while keeping `Game` boss-agnostic.

### Framework Weaknesses — boss encounters

The controller remains horizontal approach/retreat and action cycling except for explicit triggers. It does not route across platforms, model player history/trajectory, coordinate boss actions with arena events, or support moving/curved beam geometry. Shield strength and recovery are timed scalar states, not breakable shield layers or full animation/state graphs.

### Future Expansion Notes — boss encounters

Extend shared actions only for capabilities reusable by multiple encounters. Keep combat actions and arena pressure independently data-authored until a demonstrated need exists for an encounter director; then define timing, cancellation, pause, telegraph, and warning-priority rules before implementation. Test each new behavior against both existing bosses to prevent content-specific shared-system regressions. See [`docs/BOSS_SYSTEM.md`](docs/BOSS_SYSTEM.md) for action schemas and findings.
