# Arena Events

Arena events are reusable, data-configured stage mechanics. The event manager adapts existing periodic `hazards` and runs them alongside optional event definitions without requiring arena-specific branches in `Game`.

## Architecture and lifecycle

- `js/arena/arenaEvent.js` defines the shared lifecycle and event contract: `severity`, `warningTime`, `duration`, `cooldown`, `onStart(context)`, `onUpdate(dt, context)`, and `onComplete(context)`.
- `js/arena/arenaEventManager.js` constructs registered event types from arena data, advances their lifecycle during active simulation, draws their warnings/effects, and exposes active gravity modifiers.
- `js/arena/events/` contains implementations and shared attack/visual helpers. Event damage uses `Fighter.receiveHit`; accepted hits use the match's normal hit stop, camera shake, and impact particles.
- `Renderer` draws warnings and active event geometry in world space below the fighters. Starting an event also announces its warning through the existing UI toast.

An event waits for `initialDelay`, enters `warning`, and calls `onStart`. `onUpdate` runs during the warning and active states. When the warning timer expires, the event becomes active for `duration`; completion calls `onComplete` and starts `cooldown`. Events repeat by default. Set `repeat: false` for one-shot events.

Paused matches, hit stop, boss intros, and match-end states do not advance arena event timers. The event manager updates once per simulation frame, after fighter movement. Events and legacy hazards therefore use the same lifecycle and collision path.

## Built-in types

Event types are registered in `js/arena/events/index.js`:

| Type | Behavior | Useful data fields |
| --- | --- | --- |
| `laser-sweep` | A damaging beam sweeps horizontally across the main platform. | `y`, `height`, `beamWidth`, `direction`, `damage`, `hitCooldown` |
| `meteor-storm` | Repeated meteors fall with ground impact telegraphs. | `spawnInterval`, `laneCount`, `impactWarning`, `speed`, `damage` |
| `gravity-shift` | Temporarily scales gravity for fighters and the boss. | `gravityScale` (less than `1` is lighter gravity) |
| `missile-barrage` | Repeated missiles telegraph and home toward a fighter's observed position. | `fireInterval`, `impactWarning`, `speed`, `targetOffset`, `damage` |
| `energy-overload` | Telegraphs dangerous vertical energy lanes across the arena. | `laneCount`, `laneWidth`, `height`, `damage` |

Shared fields:

| Field | Meaning |
| --- | --- |
| `id` | Stable unique ID within the arena. |
| `type` | Registered event type. |
| `name` | Name used in warning UI. |
| `severity` | `low`, `medium`, `high`, or `critical`; controls warning color and impact shake. |
| `warningTime` | Seconds of visible advance warning before the active period. |
| `duration` | Active period in seconds. |
| `cooldown` | Delay after completion before the next warning. |
| `initialDelay` | Optional delay before the first warning. |
| `repeat` | Optional boolean, defaults to `true`. |
| `damage`, `knockback`, `scale`, `launch`, `launchRatio`, `hitstun` | Optional shared hit tuning for damaging event types. |

## Arena authoring

Add an `events` array to an arena in `data/arenaData.js`. Definitions contain type-specific tuning alongside the shared lifecycle fields. Orbital Shipyard demonstrates Laser Sweep and Gravity Shift; Volcanic Forge combines Meteor Storm with a legacy hazard; Sky Fortress combines Missile Barrage and Energy Overload. The Fusion Reactor, Orbital Weapons Platform, Meteor Belt, Gravity Test Facility, and Missile Foundry each focus on one of those existing event types. Their event tuning and platform layouts are documented in [`ARENA_DESIGN_GUIDE.md`](ARENA_DESIGN_GUIDE.md).

```js
events: [
  {
    id: 'hangar-laser',
    type: 'laser-sweep',
    name: 'Hangar Laser',
    severity: 'high',
    warningTime: 1.4,
    duration: 3.5,
    cooldown: 16,
    initialDelay: 5,
    damage: 10,
    y: 436,
    height: 34,
    beamWidth: 110
  }
]
```

Keep IDs unique in each arena. Place the event config in data rather than special-casing an arena ID in the manager or renderer. Existing `hazards` records continue to use `x`, `y`, `width`, `height`, `damage`, `period`, and `activeTime`; the manager adapts each record as a repeating `legacy-hazard` event.

## Extension points and limitations

To add a type, subclass `ArenaEvent`, implement its lifecycle/drawing behavior in `js/arena/events/`, then register the stable type name in `ARENA_EVENT_TYPES`. Use context `{ game, arena }` for shared simulation data, and use `this.hit(...)` for fighter damage so per-event hit cooldowns and combat feedback stay consistent. Add the new type and data fields to this document.

Events currently run independently and can overlap; arena authors should use initial delays and cooldowns to avoid unfair combinations. Missile targeting uses the fighter's position when each missile launches, not continuous lock-on. Gravity changes affect airborne gravity, not jump strength or grounded movement. Damaging events target active fighters; they do not damage boss entities. There is no event selection UI or multiplayer synchronization.

## Arena content lessons

- Arena choice is registry-driven for both PvP and Training; adding a normal arena to `ARENAS` automatically adds it to the shared selector.
- AI avoidance reads generic event threat geometry from `ArenaEventManager`, so the existing built-in types work without arena- or mode-specific AI behavior.
- Boss matches use the same arena event manager and arena physics. Boss `arenaId` remains the data extension point; do not add boss-name checks for arena content.
- Make the event identity readable through its built-in warning labels, severity styling, and telegraphed geometry. Leave enough platform routes and recovery windows for counterplay.
- See [`ARENA_DESIGN_GUIDE.md`](ARENA_DESIGN_GUIDE.md) for event readability, danger ratings, balance guidance, and the repeatable arena validation workflow.

## Future AI Notes

- **Event lifecycle:** Treat warning, active, completion, and cooldown as explicit event states. `onStart` begins the warning period, `onUpdate` runs through warning and active periods, and `onComplete` is called once per activation.
- **Arena authoring workflow:** Add event definitions to an arena's `events` array, tune shared lifecycle fields and type-specific parameters, and keep legacy `hazards` records intact where compatibility is needed.
- **Content validation:** Verify each new arena in PvP, Training, AI-controlled matches, and boss encounters; check registry-derived selection, spawn/platform bounds, warnings, event cadence, and event threat avoidance. Existing damaging event classes only target fighters.
- **Event execution flow:** `Game` creates the manager for the selected arena and advances it only during active simulation; event instances handle collision and geometry; the manager provides drawing and global modifiers; `Renderer` draws warning/active visuals in world space.
- **Extension points:** Implement a subclass and register its type in `events/index.js`. Use shared helpers and `ArenaEvent.hit` for combat effects; add generic physics modifiers only at the common simulation boundary.
- **Known limitations:** Events currently overlap independently, target selection is basic, and editor/UI tooling is absent. A future scheduler could sequence severity-weighted event sets after combination/fairness rules and automated lifecycle tests are established.
- **Performance considerations:** Keep per-frame work bounded by active event count, reuse event-local projectile/telegraph arrays where possible, and avoid DOM updates or unbounded allocations from `onUpdate`.
- **Recommended next steps:** Add automated tests for lifecycle transitions, pause/hit-stop behavior, legacy hazard equivalence, warning readability, and each damaging event's hit/cooldown behavior before expanding the event registry.
