# Pilot Profile System

The Pilot Profile records local Player 1 career statistics in browser `localStorage`. It is a statistics-only profile system: career values and mech-usage totals are displayed read-only. The callsign is the sole editable profile field. No unlocks, rewards, or gameplay modifiers are stored.

## Data structure

`js/profile/profileManager.js` stores a versioned record under `titan-clash-pilot-profile`:

```js
{
  version: 3,
  callsign: 'PILOT 01',
  favoriteMechId: 'atlas',
  mechUsage: { atlas: 4, phantom: 2 },
  stats: {
    matchesPlayed: 6,
    wins: 4,
    losses: 2,
    damageDealt: 512.5,
    damageTaken: 398,
    kos: 7,
    bossesDefeated: 1,
    trainingSessions: 3,
    bossRush: {
      runs: 4,
      clears: 1,
      deaths: 7,
      damageTaken: 832,
      bossesCleared: 5,
      bestTime: 181.4,
      highestDifficultyCleared: 'hard',
      bestTimes: { normal: 181.4, hard: null, extreme: null }
    }
  }
}
```

Favorite Mech is the most-used mech among completed, non-training matches. Most Played Mechs is the sorted `mechUsage` list. Ties are resolved by mech ID for consistent ordering.

## Save architecture and event flow

- `main.js` creates one `ProfileManager` from the existing `MECHS` registry and passes it to `Game`.
- A training session is counted when a training match is started or restarted. Training damage and results do not change career match statistics.
- Player 1 damage dealt/taken is recorded from successful normal hit callbacks, including boss hits and arena/boss damage callbacks. Only applied damage is counted; blocked/absorbed hits do not add damage.
- Each completed non-training match increments Matches Played and the selected mech usage. Wins and losses update for a decisive result; a draw increments only Matches Played. Abandoned matches are not counted as completed.
- Versus KOs are credited to Player 1 when that player's last successful hit led to the opponent's stock loss. Boss victories update Bosses Defeated at the end of the victory sequence.
- Each completed Boss Rush attempt records a run, deaths (stock losses), applied damage taken, and bosses cleared. Full clears update the overall and per-difficulty best completion times and highest difficulty cleared; failed and abandoned runs do not set clear records.
- Profile writes are local and synchronous. Data is normalized when loaded, and unsupported or malformed stored data reports a console warning before using a new profile. If storage cannot be read or written, the system reports the issue and keeps the current session in memory.

The Pilot Profile screen is part of the main menu. It shows the callsign, favorite mech, all career statistics, and the five most-played mechs. Statistics are text-only display values; there are no reset, edit, or unlock controls.

## Extension points

- Add new statistics as versioned fields in `emptyProfile`, `normalize`, and the appropriate event-recording method.
- Boss Rush aggregates are recorded once at run completion through `recordBossRushResult`; career-wide damage and boss victories continue to update through their standard match events. Version 1 and 2 saves migrate to version 3 while preserving existing counters; prior per-difficulty best times seed the overall best time and highest cleared difficulty.
- Update data at authoritative `Game` lifecycle or combat callbacks, not by inferring results from screen text or animation.
- Keep presentation in the profile screen and `main.js`; profile persistence and validation stay in `ProfileManager`.
- For a future profile migration, introduce an explicit version conversion before replacing older stored records.

## Future AI Notes

### Data structures

The profile has a version, callsign, favorite mech ID, per-mech usage counts, and aggregate career statistics. Mech references use registry IDs rather than duplicated mech objects or display strings. Add fields with defaults and normalize untrusted local storage before use.

### Save architecture

`ProfileManager` is the only owner of the profile storage key. It offers domain methods for callsign changes, damage, KOs, match results, boss victories, Boss Rush aggregates, and training sessions. Keep game code connected through those operations; do not scatter raw `localStorage` reads/writes through menu or combat code. Browser storage is a local convenience, not a secure or authoritative record.

### Future multiplayer considerations

The current profile represents local Player 1 and is not authenticated or tamper-resistant. Online play must move result authority to the server, associate records with authenticated pilot identities, validate match outcomes and mech usage, and define how local/offline records merge with server state. Avoid treating local statistics as proof of rank, rewards, or eligibility.
