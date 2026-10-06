# Training Mode

Training Mode is a local practice match launched through the same `Game.startMatch` lifecycle as Battle. Select an arena, a player mech, a dummy mech, and one of the dummy behaviors: Idle, Walk, Jump, Attack, Block, or Random.

## Architecture

- `js/training/trainingManager.js` owns the practice dummy's behavior schedule, virtual input source, highest-combo record, and rolling damage samples.
- The dummy controller submits semantic keys through `Input.setVirtualKeys('training-dummy', ...)`. `Fighter.move`, `Game.processFighterInput`, shared physics, hit detection, passives, projectiles, and ultimate behaviors remain the normal player systems.
- `Game` creates the manager only for `mode: 'training'`, applies sandbox settings at the match boundary, handles training position resets, and records damage at the ordinary `onHit` callback.
- `UIManager` presents damage, current/highest combo, rolling five-second DPS, each mech's passive state, and special/dash/ultimate readiness. Compact metrics sit in an expandable section of the bottom combat-directive bar, outside the arena view; it owns visibility of the telemetry and paused frame-step controls.
- The Training setup is part of the existing Command Center screen. Arena and mech definitions continue to come from the ordinary registries.

## Decision loop and behavior contract

On each active simulation update, the manager advances a small timed behavior schedule and updates its named virtual-key source. Walk chooses a direction and turns away from arena bounds; Jump and Attack emit short input pulses; Block holds the normal block binding; Random periodically selects one of those behaviors. Idle emits no keys. All choices are requests to the ordinary input and combat path, not alternate physics or attack implementations.

Reset Positions returns both fighters to their arena spawn points and clears transient movement/attack state without clearing practice metrics or accumulated damage. Infinite Stocks converts blast-zone losses into a spawn reset; Infinite Ultimate restores the ordinary ultimate-ready flag; Infinite Cooldowns clears special and dash waits and removes attack cooldown after an active move finishes. Normal attack startup, active, and recovery frames remain intact, so the option does not bypass an attack's authored move timing.

The pause overlay adds one-frame and ten-frame queued simulation stepping in Training Mode. Every stepped frame uses the normal `1/60` update path while the match remains paused; non-training matches retain their existing pause behavior.

## Data hooks and extension points

- Add a dummy behavior by extending the behavior schedule in `TrainingManager`; it should only emit semantic keys from `fighter.controls`.
- Add readouts from existing fighter, passive, or ability state in `UIManager`; avoid adding training-only fields to mech definitions when existing runtime state is sufficient.
- Add sandbox options at the training lifecycle boundary in `Game`, with ordinary combat still owning the resulting actions and hits.
- Arena and mech choices are registry-backed and require no training-specific content registry.
- Damage samples are recorded after a successful, unblocked fighter hit. `getDps` reports damage in the rolling five-second window.

## Debug opportunities

- Compare a dummy's virtual key set with the same keys entered by a human; both should produce identical movement and move selection.
- Use pause stepping to inspect attack startup/recovery, combo expiration, passive hook timing, hit-stop, and cooldown changes one simulation frame at a time.
- Disable sandbox options individually to verify stock loss, ultimate consumption, and cooldowns still follow standard match behavior.
- Check DPS against landed damage events and confirm blocked, absorbed, and missed attacks do not inflate the readout.
- Test all behaviors across arena layouts and verify the Walk dummy turns before leaving the arena.

## Future AI Notes

### Training architecture

Training is a match mode and input producer, not a separate combat simulation. Its controller is intentionally smaller than the competitive AI: it generates practice patterns, while input aggregation, fighter movement, combat resolution, and presentation remain shared.

### Data hooks

The setup uses existing `ARENAS` and `MECHS` registries. Passive and cooldown readouts inspect the fighter's registered passive instances and current runtime state. If a future practice drill needs authored parameters, keep those parameters in match configuration and pass them to `TrainingManager` rather than branching inside generic combat code.

### Debug opportunities

Frame stepping is the primary timing tool. Keep future diagnostics observational where possible; add new practice controls through the Training HUD and route any simulated action through virtual semantic inputs. Practice counters should be tied to authoritative hit callbacks, not inferred from animation or UI events.

### Known limitations and recommended next steps

The dummy currently has deterministic behavior categories with randomized timing/direction and no authored combo scripts, target selection, or platform-route planner. DPS is a rolling five-second approximation. Infinite cooldowns remove special/dash waits and post-move attack cooldown, but preserve the active move's authored recovery. Recommended next steps are automated coverage for virtual input parity, training sandbox toggles, reset behavior, combo/DPS accounting, and queued frame-step timing before adding scripted drills or richer telemetry.
