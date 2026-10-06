# Boss Rush

Boss Rush is a repeatable single-pilot progression challenge through every registered boss. The current registry order is Titan Leviathan followed by Aegis Prime. Each encounter uses its registered arena and the existing boss controller, phases, action telegraphs, and combat pipeline.

## Player flow

1. Choose **Boss Rush** from the main menu.
2. Select a mech and one of Normal, Hard, or Extreme difficulty, then lock in.
3. Fight each registered boss in registry order. Boss-only arena selection is automatic.
4. Defeat each boss before losing all three stocks. Stock losses count as deaths; normal respawn rules apply.
5. Between bosses, review the defeated boss, elapsed time, damage taken, deaths, and clear count. Continue when ready.
6. The run ends after the final boss's data-defined defeat cinematic or after the pilot's defeat cinematic. The results show grade, score, bosses cleared, total time, damage taken, and deaths, with Retry, Change Mech, and Main Menu actions.

The intermission pauses the run clock. On continuing, the pilot is relocated to the next boss's registered arena, damage is cleared, movement/combat state and cooldowns are reset, and ultimate charge is restored. Remaining stocks and accumulated deaths persist; intermission does not grant extra lives. The pilot receives brief spawn invulnerability.

## Registration and progression

`data/bosses/index.js` remains the boss source of truth. Boss Rush derives its order from `Object.keys(BOSSES)`, so registering a boss adds it to the end of the rush automatically. Do not maintain a separate boss-rush roster. A definition must reference a valid arena and provide the normal boss lifecycle/action data. The front-end order preview and each run use the same registry order.

`Game.startMatch({ mode: 'boss-rush', mechIds, difficulty, bossIds })` creates run state and starts the first boss. The default `bossIds` is the registered order; the optional list supports deterministic tests or future authored challenges but must contain unique registered IDs. Each boss supplies its arena and intro/defeat cinematic durations through its existing definition. A clear only opens intermission after the standard defeat sequence finishes. Continuing replaces the boss and arena systems without resetting run statistics or remaining stocks.

## Difficulty modifiers

`js/boss/bossRush.js` applies modifiers to cloned boss definitions. Registered definitions remain immutable and ordinary Boss Battle behavior is unchanged.

| Difficulty | Decision aggression | Action cooldown | Telegraph duration | Post-action recovery |
| --- | ---: | ---: | ---: | ---: |
| Normal | 1.00× | 1.00× | 1.00× | 1.00× |
| Hard | 1.25× | 0.86× | 0.82× | 0.78× |
| Extreme | 1.55× | 0.72× | 0.62× | 0.55× |

Decision intervals are divided by aggression. Telegraphs and authored action recovery windows are multiplied by their respective factors; actions without an authored telegraph/recovery use the shared Boss Rush baselines (0.6 seconds and 0.35 seconds). Cooldowns scale so bosses can act more frequently at higher difficulties. Extreme is intended to test reaction and punish openings rather than inflate boss health or damage.

## Run statistics and scoring

Run-local state tracks:

- **Completion time:** active simulation seconds from run start through the last boss's defeat cinematic. Paused time and hit-stop frames do not advance it.
- **Deaths:** Player 1 stock losses, including the final loss.
- **Damage taken:** applied, unblocked damage from bosses and arena events during this run.
- **Bosses cleared:** registered boss defeat sequences completed while the pilot remains alive.

A full clear is a win; a failed run is a loss. A completed attempt updates normal career match and mech-usage statistics once. Each defeated boss updates the existing career Bosses Defeated counter. Abandoned runs do not submit a Rush result.

The run score starts at `100 * (bosses cleared / registered bosses)`, then subtracts up to 30 points for deaths (10 each), up to 30 for damage taken (1 per 20 damage), and up to 20 for time (1 point per 12 seconds per registered boss). Scores are clamped to zero. Grades are S (90+), A (75-89), B (60-74), C (40-59), and D (below 40). The same formula ranks failed attempts by partial progression and performance.

`ProfileManager.recordBossRushResult` stores aggregate runs, full clears, deaths, damage taken, and bosses cleared. Successful full clears update overall and per-difficulty best completion times and the highest difficulty cleared. Failed runs do not update clear records. This is a transparent local score record, not a ranked or anti-cheat result.

## Extension workflow

1. Add a valid boss definition and arena as described in `docs/BOSS_SYSTEM.md`.
2. Register its ID in `data/bosses/index.js`; registry order is the Boss Rush order.
3. Verify the menu's displayed order and launch the Rush. No Rush-specific boss list or engine branch should be needed.
4. Check the encounter under all three Rush difficulties, including telegraph readability, action frequency, recovery openings, death/respawn, and defeat-to-next-boss transition.
5. Validate intermission recovery, aggregate and per-difficulty profile scoring, grades, full clears, failures, and abandoned/restarted attempts.

Boss definitions added to the registry automatically receive the current Rush difficulty multipliers. If a future boss has special telegraph timing or recovery semantics, express them in its regular action data; extend shared difficulty policy only for a reusable need, never by boss ID.

## Future AI Notes

### Boss registration flow

`BOSSES` in `data/bosses/index.js` is authoritative. The Rush order preview, default `bossIds`, encounter lookup, and progression all derive from its insertion order. New registered bosses join the run automatically. Boss definitions choose their own arena through `arenaId`; `Game` uses normal boss validation and lifecycle.

### Difficulty modifiers

`createBossRushBossDefinition` clones boss controller/action data and applies Normal/Hard/Extreme tuning without mutating the frozen source catalog. Aggression changes decision cadence; cooldown, telegraph, and recovery multipliers tune action pressure/openings. Future modifiers should operate on shared fields and retain the ordinary Boss Battle baseline.

### Scoring architecture

`Game` owns transient run state and counts authoritative gameplay events: successful boss clears, actual applied damage, and stock losses. `calculateBossRushGrade` derives the final rank from progression, deaths, damage, and active simulation time. It commits one summary through `ProfileManager` when the run ends. The profile owns persistence and normalization; the UI only displays values. Best times and highest difficulty are updated only by full clears.

### Expansion workflow

Register content instead of editing a separate Rush list. Keep progression at the `Game` match lifecycle boundary and preserve run statistics and remaining stocks between arenas, while applying the shared intermission recovery. Add score fields through the profile schema/defaults, migration/normalization, a domain recording method, and read-only presentation. Verify that deaths, counters, best times, career match results, and retries update exactly once.

### Future rewards and co-op

Rewards should be added as a separate, data-driven result after a successful clear. Keep unlock/economy state out of the current statistics-only profile until a progression design is requested; apply rewards through a profile domain method only after validating the completed run.

For co-op, evolve run state from one fighter's counters to a participant roster with explicit shared or per-player scoring rules. Keep boss registration, arena transitions, difficulty tuning, and intermission/results independent of player count. Route rewards and profile writes to authenticated participant identities if networked.

## Known limitations

- Boss order is registry insertion order; there is no branching route or boss selection within Rush.
- Difficulty is local to Boss Rush and does not persist between attempts or change standalone Boss Battle.
- Completion time is a local simulation-time score; it is not a server-verified leaderboard.
- Boss-specific adaptive AI remains limited to the shared controller observations and action triggers.
