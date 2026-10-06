import { MechBase } from '../mechs/mechBase.js';
import { ChassisComponent } from './components/chassis.js';
import { MobilityComponent } from './components/mobility.js';
import { SpecialAbilityComponent } from './components/specialAbilities.js';
import { ShieldComponent } from './components/shields.js';
import { ThrusterComponent } from './components/thrusters.js';
import { WeaponComponent } from './components/weapons.js';

export const standardAttacks = {
  neutral: { damage: 7, width: 64, height: 43, offsetX: 27, offsetY: 1, startup: .1, active: .13, recovery: .2, knockback: 185, scale: 2.7, launch: 135, launchRatio: .37, hitstun: .16 },
  side: { damage: 10, width: 83, height: 40, offsetX: 36, offsetY: 0, startup: .18, active: .16, recovery: .3, knockback: 235, scale: 3.15, launch: 185, launchRatio: .43, hitstun: .22 },
  up: { damage: 8, width: 56, height: 68, offsetX: 13, offsetY: -36, startup: .15, active: .15, recovery: .25, knockback: 195, scale: 2.8, launch: 260, launchRatio: .57, hitstun: .19 },
  down: { damage: 8, width: 70, height: 35, offsetX: 27, offsetY: 31, startup: .14, active: .16, recovery: .25, knockback: 190, scale: 2.8, launch: 95, launchRatio: .26, hitstun: .2 },
  nair: { damage: 7, width: 75, height: 58, offsetX: 20, offsetY: 2, startup: .09, active: .2, recovery: .24, knockback: 175, scale: 2.7, launch: 165, launchRatio: .4, hitstun: .18 },
  fair: { damage: 9, width: 78, height: 42, offsetX: 31, offsetY: 0, startup: .12, active: .17, recovery: .28, knockback: 230, scale: 3, launch: 165, launchRatio: .42, hitstun: .2 },
  bair: { damage: 10, width: 75, height: 45, offsetX: 30, offsetY: 0, startup: .16, active: .15, recovery: .3, knockback: 245, scale: 3.1, launch: 175, launchRatio: .43, hitstun: .22 },
  uair: { damage: 8, width: 52, height: 77, offsetX: 12, offsetY: -37, startup: .12, active: .17, recovery: .25, knockback: 205, scale: 2.8, launch: 275, launchRatio: .58, hitstun: .2 },
  dair: { damage: 9, width: 55, height: 62, offsetX: 12, offsetY: 34, startup: .15, active: .16, recovery: .3, knockback: 220, scale: 3, launch: 190, launchRatio: .46, hitstun: .21 },
  dashAttack: { damage: 12, width: 87, height: 46, offsetX: 36, offsetY: 4, startup: .04, active: .2, recovery: .38, knockback: 250, scale: 3.4, launch: 185, launchRatio: .43, hitstun: .24 },
  grab: { damage: 4, width: 48, height: 46, offsetX: 23, offsetY: 0, startup: .12, active: .12, recovery: .3, knockback: 130, scale: 1.8, launch: 105, launchRatio: .27, hitstun: .15, range: 'grab' },
  throw: { damage: 12, width: 60, height: 55, offsetX: 26, offsetY: 0, startup: .08, active: .18, recovery: .28, knockback: 260, scale: 3.4, launch: 210, launchRatio: .5, hitstun: .22 }
};

const withoutUndefined = values => Object.fromEntries(
  Object.entries(values).filter(([, value]) => value !== undefined)
);

export function composeMech({ id, name, role, chassis, mobility, weapons, shields, thrusters, specialAbilities, passive = '' }) {
  if (!id || !name || !role) throw new Error('A mech requires an id, name, and role.');
  if (!(chassis instanceof ChassisComponent)) throw new TypeError('A mech requires a ChassisComponent.');
  if (!(mobility instanceof MobilityComponent)) throw new TypeError('A mech requires a MobilityComponent.');
  if (!(weapons instanceof WeaponComponent)) throw new TypeError('A mech requires a WeaponComponent.');
  if (!(specialAbilities instanceof SpecialAbilityComponent)) {
    throw new TypeError('A mech requires a SpecialAbilityComponent.');
  }
  if (shields && !(shields instanceof ShieldComponent)) throw new TypeError('shields must be a ShieldComponent.');
  if (thrusters && !(thrusters instanceof ThrusterComponent)) throw new TypeError('thrusters must be a ThrusterComponent.');
  if (!specialAbilities.properties.abilities.special || !specialAbilities.properties.abilities.ultimate) {
    throw new Error('A mech requires both a special ability and an ultimate ability.');
  }

  const componentSet = {
    chassis,
    mobility,
    weapons,
    shields: shields ?? new ShieldComponent(),
    thrusters: thrusters ?? new ThrusterComponent(),
    specialAbilities: specialAbilities ?? new SpecialAbilityComponent()
  };
  const chassisProperties = componentSet.chassis.properties;
  const mobilityProperties = componentSet.mobility.properties;
  const weaponProperties = componentSet.weapons.properties;
  const shieldProperties = componentSet.shields.properties;
  const thrusterProperties = componentSet.thrusters.properties;
  const abilityProperties = componentSet.specialAbilities.properties;
  const attacks = { ...standardAttacks, ...weaponProperties.attacks };
  return new MechBase({
    id,
    name,
    role,
    components: componentSet,
    stats: { ...chassisProperties.stats, ...mobilityProperties.stats, ...shieldProperties.stats },
    movement: {
      jumpSpeed: 590, extraJumps: 1, airDashes: 1, coyoteTime: .12, jumpBuffer: .14,
      ...withoutUndefined(mobilityProperties.movement),
      ...withoutUndefined(thrusterProperties.movement)
    },
    visual: { width: 46, height: 68, scale: 1, ...chassisProperties.visual },
    abilities: abilityProperties.abilities,
    passive,
    attacks
  });
}

export function createMechDefinition(id, name, role, stats, movement, visual, abilities, passive, overrides = {}) {
  const { weight, knockbackResistance = 0, ...mobilityStats } = stats;
  const { jumpSpeed, extraJumps, coyoteTime, jumpBuffer, landingRecoveryScale, ...thrusterMovement } = movement;
  return composeMech({
    id,
    name,
    role,
    chassis: new ChassisComponent({ stats: { weight }, visual }),
    mobility: new MobilityComponent({
      stats: mobilityStats,
      movement: { jumpSpeed, extraJumps, coyoteTime, jumpBuffer, landingRecoveryScale }
    }),
    weapons: new WeaponComponent({ attacks: overrides }),
    shields: new ShieldComponent({ stats: { knockbackResistance } }),
    thrusters: new ThrusterComponent({ movement: thrusterMovement }),
    specialAbilities: new SpecialAbilityComponent(abilities),
    passive
  });
}
