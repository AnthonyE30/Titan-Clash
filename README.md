# Titan Clash

A self-contained, local two-player arena fighter built with HTML5 Canvas, CSS, and vanilla JavaScript ES modules. Open `index.html` in a modern browser (or serve this directory with any static HTTP server). No dependencies or build step are required.

## Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | A / D | Left / Right arrows |
| Jump / double jump | W | Up arrow |
| Fast fall / drop through | S | Down arrow |
| Attack | Left mouse click | K |
| Special | Right mouse click | L |
| Secondary ability (if equipped) | E | O |
| Ultimate (unchanged) | R | ; |
| Block | Hold Shift without a direction | Hold Shift without a direction |
| Dash / air dash | Shift + direction | Shift + direction |
| Pause / resume | Escape or Pause button | Escape or Pause button |

Player 1 attacks and uses primary special by clicking the game canvas with the left and right mouse buttons. Player 2 continues to use keyboard controls. Attack plus a direction selects a directional ground or aerial attack. A dash attack is selected while dashing or running. Press attack while holding Shift to grab; press attack again to throw. Damage increases launch force. Fighters lose one stock after leaving the blast zone; a respawning pilot returns with zero damage and brief invulnerability. Timed rounds compare remaining stocks, then damage.

The pause menu provides Resume and Change Mechs / Arena actions. Opening setup from pause keeps the match frozen until a new match is deployed. Escape pauses or resumes; use the on-screen Restart button to restart a match.

See [`docs/INPUT_SYSTEM.md`](docs/INPUT_SYSTEM.md) for the binding and input architecture details.

The front-end menu separates Battle, Boss Battle, Boss Rush, Training, Pilot Profile, and Options into animated screens. Battle setup is a Command Center roster with mech dossiers and pilot lock-in. Boss Rush chains registered bosses in order at Normal/Hard/Extreme difficulty, shows an intermission between encounters, restores fighter damage/combat state and ultimate charge while preserving remaining stocks, and reports a scored grade with run time, deaths, damage taken, and bosses cleared. Training Mode lets you choose an arena, player and dummy mechs, and dummy behavior; compact damage/combo/DPS metrics live in an expandable strip in the bottom combat-directive bar, with passive state, cooldowns, sandbox toggles, and position reset inside. The pause overlay adds one- and ten-frame stepping. See [`docs/BOSS_RUSH.md`](docs/BOSS_RUSH.md) for progression and scoring. See [`docs/TRAINING_MODE.md`](docs/TRAINING_MODE.md) for the shared-input architecture and practice tools. Pilot Profile stores local Player 1 match, damage, KO, boss, training-session, Boss Rush, and mech-usage statistics in browser localStorage; Boss Rush records best time and highest difficulty cleared, career statistics are read-only, and the callsign is editable. See [`docs/PROFILE_SYSTEM.md`](docs/PROFILE_SYSTEM.md) for tracking and save behavior. Options currently include screen shake and reduced menu motion. See [`docs/UI_FLOW.md`](docs/UI_FLOW.md) for navigation and [`docs/UI_IDENTITY.md`](docs/UI_IDENTITY.md) for the mech-selection UI and roster authoring.

## Project layout

```text
index.html
style.css menu.css
js/
  main.js game.js engine.js physics.js collision.js renderer.js input.js camera.js animation.js particleEngine.js
  entities/ entity.js fighter.js projectile.js effect.js
  ai/ aiController.js behaviorTree.js aiProfiles.js
  boss/ bossController.js bossPhases.js bossActions.js bossRush.js
  arena/ arenaEvent.js arenaEventManager.js events/
  ultimate/ ultimateBehavior.js ultimateManager.js behaviors/
  training/ trainingManager.js
  profile/ profileManager.js
mechs/mechBase.js
ui/uiManager.js
data/mechData.js mechPresentation.js mechFactory.js arenaData.js
data/bosses/ index.js titanLeviathan.js aegisPrime.js
data/components/ chassis.js mobility.js weapons.js shields.js thrusters.js specialAbilities.js
data/passives/ passiveBase.js passiveManager.js types/
data/mechs/ atlas.js vanguard.js phantom.js tempest.js lancer.js bulwark.js nomad.js helios.js
docs/AI_NOTES.md
docs/TRAINING_MODE.md
docs/PROFILE_SYSTEM.md
docs/PASSIVE_SYSTEM.md
docs/BOSS_SYSTEM.md
docs/BOSS_RUSH.md
docs/ARENA_EVENTS.md
docs/ARENA_DESIGN_GUIDE.md
docs/ULTIMATE_SYSTEM.md
docs/MECH_DESIGN_GUIDE.md
docs/UI_FLOW.md docs/UI_IDENTITY.md
PROJECT_CONTEXT.md
```

`game.js` coordinates the match and systems, including strength-scaled hit stop and combat feedback; `physics.js` owns shared fighter movement/knockback; `collision.js` supplies reusable hitbox and platform helpers; `renderer.js` draws the world; entities model fighters, bosses, and projectiles; `particleEngine.js` provides reusable impact, energy, exhaust, dust, and explosion particles. The camera dynamically tracks versus fighters or the PvE fighter/boss pair, zooms with their spacing, and adds layered screen shake. `mechData.js`, `arenaData.js`, and `data/bosses/` are the content registries.

The selectable roster includes Atlas, Vanguard, Phantom, Tempest, Lancer, Bulwark, Nomad, and Helios. The new mechs exercise existing passive, projectile, beam, barrier, blink, transformation, summon, and persistent-ultimate behaviors. Their roles, strengths, weaknesses, counterplay, and difficulty ratings are documented in [`docs/MECH_DESIGN_GUIDE.md`](docs/MECH_DESIGN_GUIDE.md).

## Boss battles

Choose **Boss Battle** in the mode selector, then choose a player mech and registered boss. Titan Leviathan's Crucible is a wide charge-fighting arena; Aegis Prime's Citadel adds a slow fortress boss, reactive shield drones, paired artillery lasers, and warned arena-wide strike events. Bosses use command-driven controllers, phase-specific action lists, telegraphed/cooldown-managed attacks, an independent health bar, enrage states, and intro/defeat cinematics. Each boss uses its own movement, recovery, and arena configuration. Boss definitions live in `data/bosses/`; the shared controller, phase manager, and action executor are in `js/boss/`. The engine does not contain boss-specific ID behavior. See [`docs/BOSS_SYSTEM.md`](docs/BOSS_SYSTEM.md) for action contracts, lifecycle, and extension guidance.

## Arenas

Battle and Training share the registry-driven arena selector. In addition to Orbital Shipyard, Volcanic Forge World, and Sky Fortress, the roster includes Fusion Reactor (Energy Overload), Orbital Weapons Platform (Laser Sweep), Meteor Belt (Meteor Storm), Gravity Test Facility (Gravity Shift), and Missile Foundry (Missile Barrage). Each new arena reuses existing platform physics and registered event behavior; no arena-specific gameplay path is required. Boss definitions can use an arena through their existing `arenaId` field. See [`docs/ARENA_DESIGN_GUIDE.md`](docs/ARENA_DESIGN_GUIDE.md) for layout, event tuning, danger ratings, and validation guidance, and [`docs/ARENA_EVENTS.md`](docs/ARENA_EVENTS.md) for the event lifecycle and authoring contract.

## Add a mech from components

Build a mech by composing reusable components; combat systems receive the same flattened stats, movement, attacks, abilities, and visual config as before. Component classes inherit from `MechComponent`, so specialized module variants can extend a component type without adding a mech-specific class. Reuse a component instance/configuration across different mechs, and only define the modules that vary. Mech passive definitions are data objects with a registered passive `id` and optional tuning `parameters`, rather than behavior branches in combat systems.

```js
import { composeMech } from '../mechFactory.js';
import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { WeaponComponent } from '../components/weapons.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';

export const prototype = composeMech({
  id: 'prototype',
  name: 'Prototype',
  role: 'Precision striker',
  chassis: new ChassisComponent({
    stats: { weight: 1 },
    visual: { color: '#34a7d5', accent: '#70f4ff' }
  }),
  mobility: new MobilityComponent({ stats: { speed: 300, dashSpeed: 650 } }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 590 } }),
  weapons: new WeaponComponent({
    attacks: { neutral: { damage: 9, width: 70, height: 44, startup: .12, active: .16, recovery: .24, knockback: 200, scale: 2.8, launch: 150, launchRatio: .4, hitstun: .18 } }
  }),
  specialAbilities: new SpecialAbilityComponent({
    special: { name: 'Weapon', kind: 'projectile', cooldown: .7,
      projectile: { width: 24, height: 13, speed: 710, life: 1.7 },
      attack: { damage: 8, knockback: 170, scale: 2.5, launch: 140, launchRatio: .34, hitstun: .17 } },
    ultimate: { name: 'Finisher', kind: 'ultimate', radius: 180,
      damage: 24, knockback: 370, scale: 4, launch: 340, launchRatio: .62, hitstun: .42 }
  }),
  passive: {
    id: 'storm-drive',
    description: 'Storm Drive: improves air control and recovery acceleration.'
  }
});

// Add to data/mechData.js: import { prototype } from './mechs/prototype.js';
// Include `prototype` in the MECHS registry.
```

Chassis provides weight and visuals; mobility provides ground speed and movement handling; weapons supply attack overrides; shields provide knockback resistance; thrusters provide jumps, air dashes, and gravity modifiers; special-ability modules provide special, secondary, and ultimate moves. Shields and thrusters are optional; chassis, mobility, weapons, and special abilities are required. `standardAttacks` supplies neutral, side, up, down, neutral/forward/back/up/down air, dash attack, grab, and throw defaults. Replace individual weapon records to tune a mech; records define `damage`, hitbox `width`/`height`, optional offsets, `startup`/`active`/`recovery`, and knockback. The legacy `createMechDefinition` helper remains available as a compatibility adapter. Passive IDs must be registered in `data/passives/passiveManager.js`; omit `passive` for no passive. Legacy string values are retained as display-only descriptions.

Built-in special kinds are `projectile`, `spread`, `melee`, `blink`, `barrier`, `hover`, and `beam`. Their parameters are read from the mech definition. To add a new ability behavior, add a `kind` branch in `Game.useSpecial` and document its data shape in this guide. Primary and equipped secondary abilities have separate direct key bindings, defined per player in `js/input.js`; AI uses the same semantic input actions. Add a new behavior kind in `Game.useSpecial` and document its parameters here.

## Add attacks, projectiles, and ultimates

Add or override attack records under the mech's `attacks`; no attack is keyed to a named mech. `Fighter.attack` applies the shared startup/active/recovery timing, `hitboxAt` creates the facing-relative hitbox, and `applyKnockback` applies damage scaling. A projectile special defines `projectile` dimensions, speed, and lifetime plus an `attack` payload; `Game.updateProjectiles` handles collision and hit effects. Ultimates use a registered data-selected behavior (`aoe`, `beam`, `transformation`, `summon`, `persistent`, or `arena-control`) and shared attack tuning; the manager handles telegraph/active/completion lifecycle and the existing one-use-per-stock charge. Legacy `kind: 'ultimate'` radius definitions continue to use AoE behavior. See [`docs/ULTIMATE_SYSTEM.md`](docs/ULTIMATE_SYSTEM.md) for behavior contracts and extension workflow.

## Add an arena

Add a definition to `data/arenaData.js` with a unique `id`, `name`, `music`, three `background` gradient colors, `width`, `height`, two or more `spawnPoints`, `platforms` (`x`, `y`, `width`, `height`, and optional `type`), and `hazards` (or an empty array). Hazard records use `x`, `y`, `width`, `height`, `damage`, `period`, and `activeTime`. Add optional `events` data for reusable warning/active/cooldown events; built-in types include Laser Sweep, Meteor Storm, Gravity Shift, Missile Barrage, and Energy Overload. Existing periodic hazards are adapted automatically. See [`docs/ARENA_EVENTS.md`](docs/ARENA_EVENTS.md) for event data fields, lifecycle, and type extension. The arena selector reads this registry. `music` is an expansion point; the current project intentionally ships without audio assets or a dependency.

## Expansion points

The engine separates content from match rules so AI controllers, network input sources, more players, modular equipment, and additional stage hazards can be added without making the renderer or physics depend on a named mech. Replace or extend the shared input provider for AI/network play, register new entity behaviors for boss/projectile types, and keep content definitions in the data registries. Current scope is local 1v1; online synchronization, career progression, and persistent unlocks are not implemented.

## CPU opponent

Choose Easy, Medium, or Hard in the CPU Opponent selector to control Player 2. AI decisions are behavior-tree actions translated into virtual key states on the shared `Input` instance; movement, attack selection, physics, and combat all continue through the normal player code paths. Difficulty tuning and integration details are documented in [`docs/AI_NOTES.md`](docs/AI_NOTES.md).

## Passive gameplay

Passives are first-class, reusable mechanics managed by `PassiveManager`. Built-in passives are Adaptive Shield (recharges a one-hit shield after four seconds without dealing or receiving damage), Siege Core (up to 30% incoming damage and knockback reduction as damage accumulates), Shadow Thrusters (brief one-hit cloak after air dash), and Storm Drive (better air control and 30% faster airborne hitstun recovery). Add tuning parameters to a passive definition and register its class in `data/passives/passiveManager.js`; do not add mech-specific branches to `Game` or `Fighter`. Architecture, lifecycle contracts, extension patterns, and tuning details are in [`docs/PASSIVE_SYSTEM.md`](docs/PASSIVE_SYSTEM.md). [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) is the concise handoff for future AI-assisted development.
