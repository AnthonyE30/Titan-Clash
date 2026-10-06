# Ultimate System 2.0

Ultimates are behavior instances selected by data on each mech ability. `Game` still owns the input boundary and consumes the once-per-stock charge, but no longer chooses an ultimate mechanic by mech identity. The framework includes AoE, beam, transformation, summon, persistent, and arena-control behaviors.

## Architecture

- `js/ultimate/ultimateBehavior.js` provides shared telegraph/active/completion lifecycle, per-hit identity tracking, and the common hit adapter.
- `js/ultimate/ultimateManager.js` resolves the behavior type, activates it, updates active effects, and provides their draw pass.
- `js/ultimate/behaviors/` implements reusable mechanic archetypes and shared targeting/attack/visual helpers.
- A mech's `abilities.ultimate` is data: `name`, `kind: 'ultimate'`, `behavior`, targeting and effect parameters, attack tuning, and optional color.
- `Game.useUltimate` spends the charge and triggers the passive hook, then hands the definition to the manager. `Game.applyUltimateHit` routes successful contacts through `Fighter.receiveHit` and the existing fighter/boss combat feedback.
- `Fighter` consumes generic active transformation modifiers for attack damage, movement speed, and incoming knockback. No mech IDs are inspected by `Game`, `Fighter`, or the manager.
- `Renderer` draws active behavior telegraphs and effects in world space. Behaviors can also emit reusable particles through the game's particle engine.

An ultimate enters its telegraph state on activation, begins its active effect after `telegraph` seconds, and completes after its configured `duration`. When the owner is eliminated or respawns, its active behavior is canceled. Pausing and hit stop naturally suspend behavior timers because the manager only updates with active game simulation.

## Supported behaviors

| `behavior` | Strategy | Useful data |
| --- | --- | --- |
| `aoe` | Locks a target location, warns, and detonates once in a radius. | `targeting` (`target` or `self`), `telegraph`, `radius`, attack fields |
| `beam` | Warns along the owner's facing direction, then strikes a long rectangular lane. | `range`, `beamHeight`, attack fields |
| `transformation` | Grants temporary generic combat modifiers and optional repeating proximity pulses. | `duration`, `damageMultiplier`, `knockbackResistance`, `speedMultiplier`, `pulseRadius`, `pulseDamage`, `pulseInterval` |
| `summon` | Orbits summoned units around the owner; each unit strikes an available target on a cadence. | `duration`, `count`, `orbitRadius`, `orbitSpeed`, `strikeInterval`, `range`, attack fields |
| `persistent` | Maintains an active field around the owner, damaging targets at a repeat interval. | `duration`, `radius`, `hitInterval`, attack fields |
| `arena-control` | Places marked storm zones and repeatedly telegraphs strikes at target positions. | `duration`, `zoneCount`, `zoneRadius`, `strikeInterval`, `strikeTelegraph`, attack fields |

Damaging behaviors use the common attack fields `damage`, `knockback`, `scale`, `launch`, `launchRatio`, and `hitstun`. `color` selects the telegraph/effect palette; when omitted, the mech's accent color is used.

## Starter ultimates

- **Atlas — Orbital Strike (`aoe`)**: locks the opponent's current position, gives a clear ground marker, then detonates. Best used to punish a committed position.
- **Vanguard — Siege Protocol (`transformation`)**: activates a seven-second siege stance with increased attack damage, reduced incoming knockback, slower movement, and close-range pulses. It favors controlling space over a single burst.
- **Phantom — Shadow Frenzy (`persistent`)**: sustains a damaging close-range field for 3.8 seconds with repeat hits, rewarding the Phantom for staying on the opponent.
- **Tempest — Thunderstorm Genesis (`arena-control`)**: calls repeated marked lightning strikes into three arena zones, forcing opponents to keep repositioning.

## Legacy compatibility

Definitions with the prior `kind: 'ultimate'` and a `radius` still activate through the AoE behavior when no `behavior` is specified. Existing attack payload fields are retained. New definitions should specify a registered behavior so the mechanic and its targeting are explicit.

## Adding a behavior or ultimate

1. Add or reuse a subclass of `UltimateBehavior` under `js/ultimate/behaviors/`.
2. Use behavior-local state for target locks, timers, hit tracking, and effect geometry. Resolve damage with `this.hit(target, sourceX, context, hitIndex)` rather than changing health directly.
3. Implement a readable warning in `draw` before applying damage. Use attack/damage callbacks and particles for impact feedback; avoid renderer or mech-name branches in `Game`.
4. Register the behavior by stable key in `behaviors/index.js`.
5. Configure `behavior` and tuning in the mech's data definition. `Game` and shared systems should need no edit for a new definition using an existing archetype.
6. Validate all lifecycle states, pause/hit-stop behavior, elimination/respawn cleanup, target types, hit cooldowns, and visual readability.

## Future AI Notes

### Behavior architecture

The ultimate ability data selects a registered behavior class. `UltimateManager` owns runtime instances; classes own targeting snapshots, telegraphing, active duration, per-target hit identity, and cleanup. `Game` handles only generic activation, charge consumption, passive notification, and shared combat callbacks.

### Targeting models

Targeting belongs to the behavior and its definition, not to a mech ID branch. Current models include target-location lock for AoE, facing-lane selection for beams, owner-centered range for persistent/summon effects, and repeated target-position selection for arena control. Future models can sample predicted positions, select the most threatening target, or use arena/platform context while still resolving hits with the shared adapter.

### Visual effect hooks

`draw(ctx)` owns world-space telegraphs and sustained geometry. Behaviors may emit particles through `context.game.effects`; successful hits flow through `Game.applyUltimateHit`, reusing hit stop, shake, critical feedback, and passive events. Keep warnings visible for their full lead time and ensure they distinguish safe and dangerous regions.

### Expansion workflow

Add a behavior implementation, register it in `js/ultimate/behaviors/index.js`, define its data contract in this document, and assign it in a mech's `ultimate` record. Prefer a generic reusable behavior over a new mech class or `Game` conditional. Existing `kind: 'ultimate'` radius records retain AoE fallback compatibility.

### Known limitations and next steps

Summons are currently visual behavior instances rather than independent fighter entities; target selection is local and does not consider team/network ownership. Transformation modifiers currently affect attack damage, movement speed, and knockback resistance. Add automated tests for behavior timing, boss targets, modifier stacking/cleanup, AI activation thresholds, and each mech's complete ultimate loop before extending competitive tuning.
