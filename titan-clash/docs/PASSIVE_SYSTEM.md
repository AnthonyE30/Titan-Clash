# Passive System

This document is a focused implementation guide for Titan Clash's mech passives. The root README covers game controls and broad project structure; `PROJECT_CONTEXT.md` summarizes the repository and handoff rules for future AI-assisted changes.

## Architecture

- `data/passives/passiveBase.js` defines the common `PassiveBase` metadata and no-op lifecycle hook contract.
- `data/passives/passiveManager.js` resolves data definitions to passive instances and dispatches lifecycle events for a fighter. A definition is `{ id, description?, parameters? }`; passives may also be supplied as an array for future loadouts.
- `data/passives/types/` contains reusable implementations. Each passive inherits from `PassiveBase` and declares tunable defaults in its constructor.
- `MechBase.passive` holds the behavior definition; legacy string descriptions are retained as `passiveDescription` for compatibility.
- `Fighter` owns one `PassiveManager`, initializes passive state/modifiers, and emits spawn, frame, attack-start, jump, dash, and damage-taken events.
- `Game` emits damage-dealt, attack-hit, stock-lost, and ultimate-used events at the corresponding match boundaries.

The game and physics layers dispatch generic events and consume generic result modifiers. They do not inspect mech IDs or passive IDs. Passive-specific rules stay inside passive classes.

## Lifecycle and event flow

Hooks receive one context object. `context.fighter` is the owner; event-specific values are provided alongside it. Hooks that modify incoming damage share `context.result`, whose relevant fields are `damage`, `knockbackMultiplier`, and `blocked`.

| Hook | Fired when | Typical use |
| --- | --- | --- |
| `onSpawn` | Fighter is constructed or respawns | Reset passive state and modifiers |
| `onDamageTaken` | A valid incoming hit is checked, before damage/knockback is applied | Reduce damage, reduce knockback, or consume a defensive charge |
| `onDamageDealt` | A hit successfully damages another fighter | Reset out-of-combat timers or build resources |
| `onAttackStart` | `Fighter.attack` accepts a move | Start attack-triggered effects |
| `onAttackHit` | A move or grab connects, including a hit absorbed by a passive shield | Record successful contacts |
| `onStockLost` | `Game.loseStock` removes a stock | Reset per-stock resources |
| `onUltimateUsed` | An available ultimate is consumed | Trigger an ultimate-linked bonus |
| `onFrame` | Every active fighter movement update, before shared movement integration | Update timers and temporary movement modifiers |
| `onDash` | A dash input is accepted; context includes `isAirDash` | Trigger air-dash reactions |
| `onJump` | A normal jump, double jump, or wall jump is accepted | Trigger jump reactions |

Normal blocking/invulnerability rejects a hit before passive damage hooks run. A passive shield sets `result.blocked = true`; `Fighter.receiveHit` reports a successful contact so the attacker cannot repeatedly hit through an active swing, while damage and knockback are skipped. On blocked passive hits, `onAttackHit` fires but `onDamageDealt` does not.

## Built-in passives

### Atlas — Adaptive Shield

After four seconds without dealing or taking damage, grants a visible shield for 2.5 seconds. The shield absorbs the next valid hit (damage and knockback), then returns to its inactive state. Combat resets its quiet timer. Both durations are configurable with `parameters.rechargeDelay` and `parameters.shieldDuration`.

### Vanguard — Siege Core

Armor scales with the Vanguard's current damage and caps at 30% at 180 damage. For each incoming hit, the passive reduces both applied damage and knockback by the computed armor fraction. `parameters.maxArmor` and `parameters.damageForMaxArmor` tune its curve.

### Phantom — Shadow Thrusters

An accepted air dash grants 0.45 seconds of cloak. The mech is drawn partially transparent, and the cloak absorbs the next valid hit before expiring. Ground dashes do not trigger it. Tune with `parameters.cloakDuration`.

### Tempest — Storm Drive

While airborne, horizontal acceleration is multiplied by 1.45 and hitstun decays 30% faster. Both modifiers return to 1 while grounded. Tune with `parameters.airControlMultiplier` and `parameters.recoveryAcceleration`.

## Adding a passive

1. Create a class under `data/passives/types/` that extends `PassiveBase`.
2. Supply a stable kebab-case `id`, a player-facing `name` and `description`, plus default `parameters`.
3. Implement only relevant lifecycle methods; inherited methods are no-ops.
4. Register the class in `PASSIVE_TYPES` in `data/passives/passiveManager.js`.
5. Add a `{ id, description, parameters }` definition to a mech, or an array of definitions for a future composite loadout.
6. Consume or mutate generic fighter state/result fields through hook context. If shared simulation behavior must use a modifier, add a generic modifier field and apply it once in the shared movement/combat path.
7. Validate spawn and respawn, the specific trigger, expiration/reset behavior, interactions with standard blocking/invulnerability, and at least one different mech without the passive.

Avoid per-frame allocations and expensive scans in `onFrame`: cache references or derive static data during construction. Timers should clamp to zero and state should reset in `onSpawn`. Apply damage/knockback changes through `context.result` rather than directly applying combat effects; this preserves common combat feedback and hit processing.

## Future AI Notes

### Architectural decisions introduced

- Passive behavior is a class instance derived from `PassiveBase`, while each mech selects its passive through plain data (`id` and optional `parameters`).
- A single `PassiveManager` owns dispatch per fighter and supports multiple passive definitions, avoiding passive checks scattered throughout the game.
- Hooks receive a single context object; incoming damage changes use a shared result object, and movement passives use generic modifiers consumed by existing shared systems.
- Spawn hooks also run on respawn so state naturally follows the fighter lifecycle.

### Why those decisions were made

They separate content selection from behavior, make one implementation reusable across mech definitions, and preserve the invariant that `Game` and shared physics do not branch on a mech or passive name. Context objects make event-specific data explicit and allow future hook fields without positional-argument churn.

### Extension points

- Add class implementations and register them in `PASSIVE_TYPES`.
- Add multiple definitions to a mech's `passive` array for composable loadouts.
- Add lifecycle events only at authoritative gameplay boundaries; document the event context here before consumers rely on it.
- Add generic `passiveModifiers` for shared movement/combat tuning rather than special-case conditionals.
- Implement UI indicators through generic passive state/metadata, not mech-name checks.

### Known limitations

- Current hit interception supports one-hit absorption through `result.blocked`; there is no layered shield health, stacking, or damage-type system.
- Active passive state is runtime fighter state and is not serialized between matches.
- Passives are currently assigned in mech definitions; there is no player-facing passive selection screen.
- `onFrame` runs once per fighter movement update, not during pause, hit stop, or stock respawn delay.
- The built-in armor curve is based on damage before the incoming hit is applied.

### Recommended next steps

- Add focused tests for all lifecycle hooks and passive state expiration.
- Add HUD icons/timers for active shields, cloak, and Siege Core armor.
- If multiple-passive loadouts become user-selectable, define stacking/ordering rules for hooks that mutate the same result fields.
- Consider explicit passive save/load hooks only if match persistence is introduced.

### Event flow

`Game` creates `Fighter` → `Fighter` constructs its `PassiveManager` and dispatches `onSpawn` → each active `Fighter.move` dispatches `onFrame` before movement → accepted actions dispatch `onAttackStart`, `onJump`, or `onDash` → `Fighter.receiveHit` dispatches `onDamageTaken` before shared damage/knockback → `Game.onHit` dispatches `onAttackHit` and, unless blocked, `onDamageDealt` → stock loss and ultimate use dispatch their hooks at consumption.

### Extension patterns

Make passive implementations deterministic with respect to their context and parameters. Store temporal state on `fighter.passiveState`, shared tuning values on `fighter.passiveModifiers`, and incoming-hit decisions on `context.result`. Keep public defaults in constructor parameters so designers can tune instances without duplicating behavior. Use a new reusable base/helper only when multiple passives share real logic.

### Performance considerations

The manager uses a short registered list and direct method dispatch; hook lookup occurs only at gameplay event boundaries. Per-frame hooks should remain constant-time and avoid creating collections, scanning fighters/arenas, DOM access, or logging. Reuse state objects and reset them on spawn. Profile before adding caching or generic event-bus infrastructure.
