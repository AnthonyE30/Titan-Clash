# Titan Clash AI Notes

These notes describe the current local-CPU architecture and the intended extension seams. Read this alongside the root README for controls, game flow, mech definitions, and arena data. AI is an input producer: it must not move fighters directly, bypass `Fighter.move`, or implement separate combat or physics rules.

## Architecture

- `js/ai/aiController.js` owns one CPU pilot's observation, reaction timing, difficulty profile, and behavior tree. It emits semantic actions such as `left`, `up`, `attack`, and `special`.
- `js/ai/behaviorTree.js` provides small composable `Selector`, `Sequence`, `Condition`, and `Action` nodes. Selectors try high-priority behaviors first; sequences require each condition/action to succeed.
- `js/ai/aiProfiles.js` contains data-only reaction, aggression, defense, and capability tuning for Easy, Medium, and Hard.
- `js/input.js` combines physical key states and named virtual key sources. `down`, `justPressed`, and `justReleased` expose the merged state, so the game consumes CPU input exactly like keyboard input. Player 2's virtual block key is scoped separately to avoid an AI block/dash affecting Player 1; a physical Shift press continues to work for both players.
- `js/game.js` creates the selected Player 2 controller at match start and updates it before normal fighter input processing. Match restarts preserve the selected profile via `matchConfig.aiProfile`.
- `index.html` and `js/main.js` expose the optional CPU profile selector. Blank means local two-player keyboard play.

AI actions are resolved against `fighter.controls` before submission. For example, an AI `attack` action for Player 2 becomes the ordinary `k` command. The existing `Game.processFighterInput`, `Fighter.move`, and physics/combat systems make the final movement and attack decisions; never call those actions directly from an AI behavior.

## Decision loop

1. Each active match frame, `Game.update` gives the AI its fighter, opponent, arena, game state, and frame delta.
2. The controller observes the current match state. An eliminated, respawning, or out-of-bounds opponent is treated as unavailable: the AI drops its pursuit inputs and preserves safe footing/recovery instead of chasing stale coordinates. Hard additionally tracks opponent combo growth and predicts opponent horizontal motion for positioning.
3. At its profile's reaction interval, the behavior tree checks in priority order: recovery, active hazard avoidance, defense/block, damage-based retreat, usable ultimate, ordinary attack, a useful primary/secondary special, and default positioning.
4. A successful behavior emits a set of abstract button actions. The controller maps them to the fighter's normal control keys and calls `Input.setVirtualKeys`.
5. The engine processes the merged input with its ordinary frame lifecycle; edge-triggered attacks and abilities use the same `justPressed` path as human commands.

Recovery and navigation choose directions and jump/dash commands only. Immediate platform-edge recovery runs each frame, ahead of ordinary reaction-timed decisions, to avoid a long reaction interval carrying the AI off a ledge. The controller relies on shared movement code for coyote time, jumps, dashes, platforms, hitstun, and knockback. Hazard avoidance checks legacy periodic hazard intervals and current event threat regions exposed by `ArenaEventManager`; it only chooses normal movement inputs.

## Difficulty and behavior extension

Tune `AI_PROFILES` before adding branches: reaction time/jitter, attack range, special range, block probability, retreat threshold, aggression, and capability flags shape the three existing styles. Keep profile values independent of mech names.

To add behavior:

1. Add a small condition/action method to `AIController` using read-only match observations.
2. Add a condition/action sequence in `createBehaviorTree` at the intended priority.
3. Emit only semantic input actions through `act`, using supported names in `fighter.controls`.
4. Extend profile data only when the behavior needs a genuine difficulty distinction.
5. Validate that CPU and human input both still pass through normal `Input`, movement, and combat processing.

Current Hard features are opponent-combo recognition for defensive timing, short-horizon horizontal prediction, and air-dash recovery mixups. The controller chooses primary and equipped secondary abilities through distinct semantic `special` and `secondary` actions, mapped by `fighter.controls` to the same keyboard input path as human commands. Emergency hover use while falling and a useful defensive barrier are not delayed by the optional aggression roll. These features are intentionally profile-gated so the easier profiles remain less reactive and less defensive.

## AI Adaptation System

Each controller uses its profile's `adaptationLevel` to govern how short-term observations affect decisions. Easy observes without adapting, Medium uses repeated special and dash habits for modest defensive reads and spacing changes, and Hard can favor a configured upward attack after repeatedly observing jump-then-attack behavior. These adjustments only change the controller's semantic action choice; configured move data, fighter combat, and shared input processing remain authoritative. If an adaptive move is not configured, the ordinary attack/positioning behavior remains available.

## Observation Memory

`AIController` samples public opponent state for jump starts, attack starts, special-cooldown refreshes, and dash starts. Observations are held in a controller-local rolling time window (profile-defined, 8–12 seconds) and capped at 64 events. They are recreated for each match/controller, never written to `ProfileManager` or localStorage, and are discarded when the match restarts. The debug view reports counts within that window, not persistent engagement statistics.

Detection is based on state transitions, so changes to fighter cooldown, dash, jump, or attack lifecycle fields should be reflected in `observeOpponent`. Do not infer player identity from a mech or persist opponent behavior.

## Arena Awareness

The shared threat query combines `ArenaEventManager.getThreats()` with geometric boss information: active/delayed `BossAttack` rectangles, warning/active boss hazard rectangles, and the boss's generic area/beam/lane telegraph. Threats are judged by their geometry and timing state, without arena IDs, boss names, or action-name branches. AI avoidance still issues ordinary movement actions and is not a damage/collision implementation.

Current training dummies are controlled by `TrainingManager`, not `AIController`; the optional CPU selector is not enabled in Training Mode. The same generic geometry helper is ready for future CPU fighters in training or boss arenas when those modes register an AI controller. Bosses themselves continue to use `BossController`, not fighter AI.

## Debug Tools

Press **F3** to toggle the developer AI overlay. It remains hidden unless explicitly enabled and a CPU controller is active; it displays behavior, target, threat level/source, decision state, and recent tendency counts. The overlay is presentation-only and reads `getDebugSnapshot()`; it does not change AI choices. No AI debug data is saved.

## Adaptation limits and multiplayer

Observation is heuristic and detects transitions rather than intent; short matches, dropped frames, interrupted attacks, and similar cooldown/state changes can make counts approximate. Only generic directional anti-air preference, spacing, and defensive probability are adapted today. Future online play should keep observations local to each controller unless the authoritative simulation defines a synchronized observation model; do not trust client-reported tendencies for ranking or rewards.

## Boss AI integration

The PvE boss is a non-fighter entity, so it does not inject synthetic player buttons. `BossController` follows the same observe → decide → issue-command boundary: it reads player/arena/phase state, then sends typed movement/action commands to `Boss`. Boss movement is velocity-integrated against arena platforms; neither controller nor action selection writes its coordinates.

Boss actions have IDs, telegraphs, cooldowns, and data-driven payloads. Their damage still enters the common fighter hit-receive path; player attacks use shared fighter hitboxes and overlap tests against the boss. See `docs/BOSS_SYSTEM.md` for phases, action kinds, and data extension steps. Future boss controllers can reuse the behavior-tree nodes when branching behavior benefits from tree composition, while retaining the explicit boss command API for non-fighter actions.

## Notes for future AI-assisted changes

- Begin with this note and the root README; trace `Game.update`, `Game.processFighterInput`, `Fighter.move`, and `Input` before changing AI behavior.
- Treat the no-direct-control rule as an invariant: AI observes state, chooses buttons, and lets the shared game code act.
- Use arena and mech data rather than hard-coded stage/mech identifiers.
- Keep new tactical logic in controller/tree code and tuning in profiles; avoid expanding combat branches solely for AI.
- Preserve simultaneous keyboard and CPU input semantics, especially shared Shift and edge-triggered actions.
- Test all three profiles, restart with a profile selected, a no-AI local match, platform recovery, event and boss telegraph avoidance, observation decay/reset, and the F3 overlay's hidden/default behavior.
