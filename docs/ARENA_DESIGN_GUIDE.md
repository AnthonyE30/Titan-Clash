# Arena Design Guide

Titan Clash arenas are data records in `data/arenaData.js`. The same registry powers PvP, Training, boss encounters, background rendering, platform collision, AI event avoidance, and arena-event scheduling. The five arenas below use only the existing `platforms`, `spawnPoints`, `background`, and `events` fields plus descriptive metadata; none introduces arena-specific gameplay code or a new event type.

## Arena lineup

| Arena | Description and visual theme | Size | Danger |
| --- | --- | ---: | --- |
| Fusion Reactor | Unstable power plant; molten amber conduits, reactor glow, industrial steel. | 1800 × 760 | High |
| Orbital Weapons Platform | Planetary defense installation; cold orbital blues, targeting lights, luminous weapon rails. | 1900 × 760 | High |
| Meteor Belt | Asteroid mining operation; violet-black space, mineral glints, meteor trails. | 2100 × 860 | High |
| Gravity Test Facility | Experimental physics laboratory; graphite chambers, white test lights, cyan field markers. | 1800 × 820 | Medium |
| Missile Foundry | Automated weapons production; hazard-striped assembly lines, furnace orange, missile guidance red. | 1900 × 780 | High |

## Platform layouts and event intent

| Arena | Platform layout (x, y, width, height; world units) | Primary event and design goal |
| --- | --- | --- |
| Fusion Reactor | Main `(380,470,1040,34)`; upper `(510,385,230,20)`, `(1060,385,230,20)`; center `(810,300,180,18)`. | Energy Overload: four warned strike lanes force continuous position changes between safe gaps. |
| Orbital Weapons Platform | Main `(340,470,1220,34)`; upper `(490,385,230,20)`, `(1180,385,230,20)`. | Laser Sweep: a broad horizontal rail crosses the main deck, prompting jumps, drops, and lateral repositioning. |
| Meteor Belt | Main `(230,520,1640,36)`; upper `(470,435,250,20)`, `(1380,435,250,20)`; center `(890,350,320,18)`. | Meteor Storm: frequent, individually marked falling meteors deny predictable air and landing lanes. |
| Gravity Test Facility | Main `(380,500,1040,34)`; upper `(560,415,210,20)`, `(1030,415,210,20)`; center `(820,330,160,18)`. | Gravity Shift: a long high-gravity window changes jump arcs and recovery timing. |
| Missile Foundry | Main `(340,480,1220,34)`; upper `(500,395,220,20)`, `(1180,395,220,20)`; center `(850,310,200,18)`. | Missile Barrage: staggered target locks and guided shots pressure stationary cover and control space. |

Each arena has two mirrored ground-level spawn points near the center, no legacy periodic hazard, and exactly one recurring primary event. Boss-only arenas remain separate and unchanged. For a boss encounter to use one of these stages, author its existing `arenaId` to the arena registry ID; `Game` resolves arena, event manager, and boss lifecycle through the same generic path.

## Event configurations

Every event uses a type already registered in `js/arena/events/index.js`.

| Arena | Event tuning |
| --- | --- |
| Fusion Reactor | `energy-overload`: critical, 2.2 s warning, 2.8 s active, 20 s cooldown, 8 s initial delay; 4 lanes, 104 px wide, 12 damage. |
| Orbital Weapons Platform | `laser-sweep`: high, 1.8 s warning, 4.6 s active, 18 s cooldown, 7 s initial delay; 112 px beam, 32 px high, 9 damage. |
| Meteor Belt | `meteor-storm`: high, 2 s warning, 6 s active, 21 s cooldown, 8 s initial delay; 10 lanes, 0.72 s spawn interval, 0.9 s impact warning, 470 speed, 9 damage. |
| Gravity Test Facility | `gravity-shift`: medium, 2.4 s warning, 6 s active, 19 s cooldown, 8 s initial delay; gravity scale 1.45. |
| Missile Foundry | `missile-barrage`: high, 1.8 s warning, 5 s active, 19 s cooldown, 7 s initial delay; 1 s fire interval, 0.8 s impact warning, 390 speed, 10 damage. |

Event schedules begin after their arena's `initialDelay`; event `cooldown` is the downtime after an activation. These schedules are intended as authoring baselines and may need tuning against actual match duration and player skill.

## Validation matrix

| Mode/surface | Validation |
| --- | --- |
| PvP | All five non-boss-only arenas are added automatically to Battle's arena selector. Both fighters use the shared platform collision, event hit, and event-warning paths. |
| Training | The same registry feeds Training's arena selector; dummy behavior remains independent and uses the standard arena-event threat queries. |
| AI | `AIController` reads `ArenaEventManager.getThreats()` and applies its existing avoidance behavior; the new events introduce no AI-specific branches. |
| Boss compatibility | Boss definitions continue to select arenas through `arenaId`. The shared boss lifecycle constructs the same arena event manager; gravity modifiers also apply through the existing boss physics integration. Damage events retain the established fighter targeting semantics. |

Boss compatibility means the stage and event manager load in a boss match without special cases. Existing damaging arena-event implementations target active fighters; they do not damage boss entities. Changing that targeting rule would be an event-system feature, not part of authoring these arenas.

## Lessons Learned

- Event behavior is determined by generic event data and the existing event class, so arena identity should stay descriptive rather than becoming a gameplay condition.
- A single primary event per new arena makes its positioning lesson legible and avoids unfair overlap. Existing multi-event arenas remain valid examples where cooldowns and initial delays are coordinated.
- Platform geometry must offer more than one viable route through each event; event-specific safe lanes alone should not be the only meaningful movement choice.
- Training and AI consume the same event manager, so registry additions require no mode-specific selection wiring.

## Arena Balancing Notes

- Keep the main platform wide enough for two-player engagement and event evasion; avoid making a primary event's danger zone cover every escape route at once.
- Spawn both pilots on the main platform with comparable access to elevated routes. Keep upper-platform gaps and heights within the existing jump/double-jump envelope.
- The new maps place side platforms about 85 world units above the deck (within a standard single jump); center platforms, where present, are about 170 units above it to reward a double jump or other recovery option.
- Larger arenas make slow hazards less dense but lengthen pursuit and laser traversal. Tune event dimensions/intervals to stage width rather than assuming one standard size.
- Treat warning time as reaction time: lower it only when the geometry and event speed still allow a reasonable dodge. Use severity for consequence, not merely visual emphasis.
- Danger rating is editorial metadata for players and designers; it does not alter damage or event frequency.
- Validate with several mechs: mobility, jump count, weight, and air control change how safely a route can be crossed.

## Event Readability Guidelines

- Give each arena one recognizable visual motif and each event one clear primary color/silhouette distinct from its background.
- Preserve the event's built-in warning label and spatial telegraph. Event severity colors and warning phase communicate urgency before activation.
- Keep telegraphed lanes, impact marks, and target rings visible against both platforms and mech effects; avoid placing critical warnings behind dense decoration.
- Use clear start delay and cooldown windows between repeated activations. A high damage event should have enough warning and downtime to create a decision rather than unavoidable chip damage.
- Test at gameplay zoom and while the camera follows fighters; verify the entire relevant danger area can be interpreted from the player's view.

## Future Arena Authoring Workflow

1. Add an arena record to `ARENAS` with a unique registry key and matching `id`.
2. Provide `name`, `description`, `visualTheme`, `dangerRating`, background palette, stars, dimensions, two spawn points, platform layout, hazards, and event configuration.
3. Select an existing registered event type and author unique event IDs, severity, warning time, duration, cooldown, initial delay, and type-specific tuning. Do not add a new event class unless the requested behavior cannot be expressed by the existing catalog.
4. Confirm the record is not marked `bossOnly` unless it is intentionally reserved; Battle and Training selectors derive their choices from the registry automatically.
5. Smoke-test PvP and Training startup, AI threat avoidance, and a boss match using the arena's `arenaId`. Inspect warnings, platform coverage, repeated event timing, fighter recovery, and performance.
6. Document the arena's visual language, layout, signature event, and difficulty tradeoffs here and add it to the architecture/event overview when relevant.

## Future AI Notes

- **Registration:** `data/arenaData.js` is the source of truth. Standard arena selectors, menu arena counts, match setup, and `ArenaEventManager` consume registered definitions; there is no parallel roster.
- **Data contract:** `Game` expects a valid arena ID, dimensions, spawn points, platforms, hazards, and optional registered `events`. Boss definitions reference the arena through their existing `arenaId`.
- **Validation opportunities:** Add automated checks for registry key/ID consistency, unique event IDs, known event types, valid dimensions/spawns/platform bounds, and event values. Keep these checks in content validation rather than runtime arena-specific branches.
- **Expansion:** Reuse registered event types and keep all visual/gameplay tuning in data. Add a type to the generic event registry only when an arena concept cannot be represented through current event behaviors.
