# Mech Design Guide

These four roster additions are built entirely from the existing mech composition, passive, special, and ultimate systems. Their identity comes from combining different movement/stat profiles with distinct uses of registered ability and ultimate behaviors. All damage continues through the shared combat paths.

## Lancer

**Role:** Precision Duelist  
**Identity:** High accuracy and spacing  
**Difficulty:** Hard

- **Strengths:** Needle Lance is a fast, narrow projectile; Lancer's extended side attacks reward deliberate spacing. Puncture Beam threatens a long horizontal lane after a clear telegraph.
- **Weaknesses:** Moderate weight and below-average mobility leave fewer escape options than Nomad. The narrow primary projectile and beam are less reliable against unpredictable vertical movement.
- **Counterplay:** Change elevation or jump the beam lane during its warning. Close distance during Lancer's recovery and avoid predictable approaches that line up the lance.
- **Build notes:** Medium weight, deliberate landing recovery, and long narrow attack boxes complement aim and range rather than raw speed. Adaptive Shield rewards disengaging long enough to reset.

## Bulwark

**Role:** Defensive Fortress  
**Identity:** Area denial and survivability  
**Difficulty:** Easy

- **Strengths:** High weight, shield resistance, Siege Core armor, Aegis Bastion, and Fortress Protocol make Bulwark difficult to launch. Breach Mortar and its wide down attack contest approach lanes.
- **Weaknesses:** Slow movement, long attack recovery, no air dash, and limited jump height make rotations and recovery predictable. Its defensive specials do not guarantee damage.
- **Counterplay:** Bait the barrier, then attack during its cooldown. Use vertical approaches and avoid trading into the armor curve; leave the pulse radius while Fortress Protocol is active.
- **Build notes:** The slowest ground profile and heaviest chassis trade chase power for durability. The transformation's damage bonus is modest; the main value is holding space and resisting knockback.

## Nomad

**Role:** Hit-and-Run Skirmisher  
**Identity:** Extreme mobility  
**Difficulty:** Medium

- **Strengths:** Highest ground/dash speed, two air dashes, a long blink, and reduced landing recovery let Nomad choose engagements and escape quickly. Wandering Echoes adds pursuit pressure.
- **Weaknesses:** Lowest weight and small hitboxes make Nomad vulnerable to strong confirms. Mobility mistakes near blast zones are costly; the summon ultimate is less effective when the opponent can keep distance.
- **Counterplay:** Cover likely blink exits and punish whiffed Crosscuts. Use broad attacks and stage positioning to limit escape routes; force Nomad to spend air dashes before attempting an edge guard.
- **Build notes:** The lightest chassis receives the strongest movement profile, but standard attack damage stays moderate. Shadow Thrusters reuses the air-dash cloak passive, rewarding controlled recovery routes.

## Helios

**Role:** Energy Artillery  
**Identity:** Beam attacks and zone control  
**Difficulty:** Medium

- **Strengths:** Solar Lance reaches through a long horizontal lane, Flare Mine can cover two projectile paths, and Corona Field pressures opponents who remain close. Storm Drive helps maintain aerial firing positions.
- **Weaknesses:** Slower movement and heavier landing recovery make repositioning harder than for Lancer or Nomad. Beam attacks are directional and can be avoided by changing elevation or moving behind Helios.
- **Counterplay:** Break line of sight, vary vertical timing, and close in after Solar Lance. During Corona Field's warning, move outside its marked radius and avoid predictable approaches.
- **Build notes:** Moderate weight and reduced gravity support aerial aiming without matching Tempest's air specialization. Strong ranged pressure is balanced by cooldowns, telegraphs, and close-range vulnerability.

## Roster tuning and extension

The current game has no draft-level role queue or match-up system, so role names are guidance rather than hard class rules. Passive IDs must be registered in `data/passives/passiveManager.js`; use existing IDs unless a genuinely new mechanic is required. Special `kind` values must be supported by `Game.useSpecial`. Ultimate `behavior` values must be registered in `js/ultimate/behaviors/index.js`; choose an existing behavior before introducing code.

When tuning these or future mechs:

1. Keep identity in component stats, attack records, ability payloads, and registered passive/ultimate data.
2. Use strengths and weaknesses as paired tradeoffs; do not stack best-in-roster speed, weight, range, and damage on one frame.
3. Check actual move hitboxes and recovery windows, not only role text.
4. Test each mech against the roster at low and high damage, on upper platforms and near edges, in human and AI matches, and against the boss.
5. Tune telegraph duration and effective range along with damage. A powerful ultimate should have visible counterplay.
6. Revisit ratings after playtesting; difficulty reflects execution demands, not total power.
