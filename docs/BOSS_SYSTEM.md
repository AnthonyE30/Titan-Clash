# Boss Battles

This guide describes the reusable PvE boss framework and its two encounters, Titan Leviathan and Aegis Prime. Bosses are registered data and use shared commands/actions; `Game` does not branch on a boss ID.

## Architecture

- `js/entities/boss.js` owns health, phase/enrage state, telegraph state, velocity, command handling, arena integration, and boss rendering.
- `js/boss/bossController.js` observes the live player, boss state, phase actions, ranges, and cooldowns. It issues `move` and `action` commands; the action executor issues a `charge` movement command where appropriate.
- `js/boss/bossPhases.js` advances monotonically through health-threshold phases and requests presentation/action-lock transitions.
- `js/boss/bossActions.js` owns reusable attack entities and the telegraph/cooldown lifecycle. Generic action kinds create projectiles, beams, a reactive shield, a charge, a sweep hitbox, timed hazards, or a reactor overload.
- `data/bosses/` contains definitions and the `BOSSES` registry. The engine only needs a registry entry, not a boss-specific branch.
- `Game` owns encounter setup/end state, player/boss collision routing, arena hazards, camera tracking, and cinematic transitions. `Renderer` and `UIManager` present the entity, threats, and boss health bar.

## Boss lifecycle

1. `Game.startMatch({ mode: 'boss', bossId, mechIds, arenaId })` validates the selected data, creates one normal `Fighter`, creates the registered `Boss`, clears prior encounter state, and configures the boss HUD.
2. The boss starts in `intro`; the controller and combat simulation wait while the intro timer runs.
3. In `active`, each game update advances phase/enrage, action cooldowns/telegraphs, controller decisions, and velocity-based arena integration. The controller selects an available phase action after checking range and cooldown.
4. Player attacks collide through the existing fighter attack box and overlap helpers. Boss attacks and hazards use attack records accepted by `Fighter.receiveHit`.
5. Boss health reaching zero starts the defeat cinematic. Player stock loss to zero starts the player defeat cinematic. Both finish at the normal victory overlay; rematch reuses `matchConfig`.

Pause and hit stop suspend simulation updates just as they do for versus play.

Boss definitions can select a dedicated arena with `arenaId`. Titan Leviathan uses `leviathanArena` ("Leviathan's Crucible"), a 2,600-unit arena with a 2,300-unit main platform and wider spacing for charge attacks. Two side platforms sit 90 world units above the main platform, just under a single jump. A central platform sits 175 units above the main platform and requires a double jump. Short horizontal gaps connect the sides and center; boss-only arenas are excluded from the versus arena selector.

Aegis Prime uses `aegisCitadel` ("Aegis Prime's Citadel"), a 3,200-unit fortress arena with six platforms and a broad main deck. Its scheduled laser sweep and five-lane energy overload are standard arena events configured in the arena data; their long warnings and offset cooldowns keep pressure legible while boss actions target the player.

If a boss falls below the arena's configured recovery margin, it returns to the main platform with zero velocity, canceled charge/telegraph state, and a brief action lock. `BossController` also turns movement inward near platform edges and declines charges whose travel would cross the platform boundary. Boss camera tracking uses arena-specific vertical center bounds so a falling/recovering entity cannot drag the camera down indefinitely.

## Commands and actions

Commands are explicit intent, not coordinate changes:

| Command | Purpose |
| --- | --- |
| `{ type: 'move', direction, speed? }` | Set a horizontal movement intent; `Boss.integrate` eases velocity and resolves platforms. |
| `{ type: 'action', actionId, target }` | Request a registered action if it is ready and no other telegraph is active. |
| `{ type: 'charge', direction, speed, duration, attack }` | Start an action-driven velocity burst with a once-per-target collision window. |

Each action record has an `id`, `name`, `kind`, `damage`, optional knockback/launch tuning, `telegraph`, `cooldown`, and optional range limits. The reusable kinds are:

- `volley`: horizontal shots with optional vertical spread.
- `swarm`: angled projectiles aimed toward the observed target.
- `missiles`: descending projectiles placed around the target's observed position.
- `beam`: one or more sustained horizontal hitboxes, sized by `range`, `height`, optional `count`, and `verticalSpacing`. The matching `telegraphStyle: 'beam'` previews its direction and range.
- `shield`: a timed damage-reduction field with orbiting drone visuals, tuned by `duration`, `damageReduction`, and `droneCount`. `trigger: 'target-attack'` makes the controller prioritize this action while the target has a committed attack startup/active window.
- `charge`: velocity-based rush with a damage window.
- `sweep`: a short-lived area hitbox to one side.
- `hazards`: timed warning/active fields on the arena's main platform.
- `overload`: delayed radial damage plus timed arena hazards.

`BossAction` owns readiness, telegraph countdown, cancellation, and cooldown timing. `BossActions` executes generic kind payloads; action definitions remain content data.
Optional `recovery` holds the boss from issuing another action and eases its movement command to neutral after an action executes. Telegraph styles `beam`, `area`, and `lanes` add directional, target-centered, or threatened-floor previews to the shared boss rendering. Beam direction and warning-zone target are snapshotted at the start of the telegraph so the activated threat matches its warning.

## Titan Leviathan

`data/bosses/titanLeviathan.js` is the first encounter definition:

| Phase | Health threshold | Actions |
| --- | ---: | --- |
| Siege Protocol | Initial | Plasma Barrage, Charge Attack |
| Hunter Protocol | 68% | Drone Swarm, Tail Sweep, Missile Storm |
| Reactor Protocol | 34% | Reactor Overload plus the phase 2 action set |

At 18% health the Leviathan enrages: its configured speed multiplier applies and cooldowns elapse faster. Phase 3's extra action and accelerated decision cadence create attack chaining. Each attack displays its name and a filling warning bar before execution.

## Aegis Prime

`data/bosses/aegisPrime.js` exercises the same registry with a slower, longer-range controller and a more deliberate phase cadence:

| Phase | Health threshold | Actions |
| --- | ---: | --- |
| Sentinel Lattice | Initial | Shield Drones (reactive defense), Drone Screen |
| Artillery Array | 76% | Artillery Lasers, Crossfire Grid |
| Core Overload | 39% | Core Overload, Artillery Lasers, Crossfire Grid |

The shield action is prioritized when the player commits to an attack, reduces incoming damage for a short period, and presents orbiting drones. Artillery Lasers use paired, sustained beams with a directional preview; Crossfire Grid and Core Overload mark threatened floor regions before activation. Longer action recovery windows, lower movement speed, slower decision timing, and a 1.45-second fall recovery make Aegis feel like a fortress rather than a chasing attacker. At 16% health, its modest enrage speed/cooldown boost preserves that identity. The Citadel adds a sweeping laser and staggered multi-lane arena event pressure.

### Lessons Learned

- Registry-driven definitions and dedicated `arenaId` selection were sufficient to add the second boss without a `Game` boss-ID branch.
- Leviathan's action catalog covered projectile, charge, sweep, and hazard patterns, but not sustained line attacks, a timed defensive response, or explicit post-action recovery. Two shared action kinds and an optional recovery window filled those gaps.
- A reactive action needs a controller path that runs independently of the ordinary decision interval; otherwise its response latency depends on where the action cycle happens to be.
- Dedicated arena event schedules can add pressure independently of boss actions while reusing existing event warning, lifecycle, and damage code.

### Framework Strengths

- Boss identity is primarily authored through phase, movement, controller, action, enrage, and arena data.
- Action telegraphs/cooldowns, health presentation, hit routing, and cinematic outcomes remain shared.
- Reactive actions can inspect a limited, explicit combat observation and still issue the normal boss action command.
- Boss-only arena registrations automatically bypass versus arena selection while remaining selectable through the boss's data reference.

### Framework Weaknesses

- The controller still approaches/retreats along the main platform; it does not plan routes to elevated platforms or reason over arena event schedules.
- Reactive conditions currently cover the target's committed attack window, not broader behavior history, feints, or predictive trajectory models.
- Beam geometry is horizontal and fixed during its short active period; there is no rotating, curved, or multi-segment laser primitive.
- Shield reduction and action recovery are simple timers, not layered shield health, explicit animation states, or player-facing boss-break mechanics.
- Boss and arena pressure can overlap; there is no encounter-level director coordinating their timing.

### Future Expansion Notes

Prefer adding generic action kinds only when a second encounter demonstrates a reusable gap, as the shield and beam actions did. Keep per-boss tuning in `data/bosses/`, use arena event data for independent stage hazards, and keep movement under commands plus `Boss.integrate`. Before adding route planning, multi-target aggro, complex reactive triggers, or synchronized boss/event scripts, define their shared observation and lifecycle contracts and validate them with multiple encounters.

## Adding a boss

1. Add a data definition under `data/bosses/` with a stable `id`, name/role, health/size/spawn, movement/controller tuning, visual colors, cinematic durations, enrage tuning, phase records, and action records.
2. List each action ID in the phases that can use it. Set phase thresholds from highest to lowest; phase 1 is the initial phase and later thresholds trigger transitions.
3. Reuse a generic `kind` and tune its payload. If a truly different action is required, add a generic executor branch in `js/boss/bossActions.js` and document its schema here. Optional `trigger`, `recovery`, and telegraph styles should describe reusable action behavior, not a boss identity.
4. Register the definition in `data/bosses/index.js`. It becomes selectable in Boss Battle mode without an engine change.
5. Validate each phase boundary, telegraph/cooldown, boss and player damage paths, hazard timing, pause/restart, arena boundaries, fall recovery/camera bounds, and both cinematic outcomes.

Boss movement/decision code may read player and arena coordinates to choose intent but must not assign boss coordinates. Put movement in commands and let `Boss.integrate` update velocity and resolve the arena. Keep all attack damage in attack payloads and collision/hit-receive paths.

## AI compatibility

The controller follows the same observation → decision → action boundary documented in `docs/AI_NOTES.md`. It does not synthesize keyboard input because this boss is a non-fighter with telegraphed actions. For branching tactical behavior, the controller can compose the generic behavior-tree nodes, then submit the same documented boss commands. Never let a behavior-tree node directly move the entity, alter player health, or bypass collision.

## Known limitations

- Navigation is horizontal approach/retreat with shared platform collision and edge recovery; there is no route planning between separated platforms.
- Outside registered reactive triggers, the controller cycles through available, in-range actions rather than reasoning about player history or optimizing a combo.
- Boss attacks use standard fighter block/invincibility checks; there is no boss-specific guard-break mechanic or shield-break health pool.
- Arena hazards target the main platform (or first platform fallback), and each spawned field damages a given fighter only once.
- Boss progress, multiplayer aggro, selectable boss rosters beyond the registry, and persistent campaign state are not implemented.
