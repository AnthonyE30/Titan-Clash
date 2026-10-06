import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { WeaponComponent } from '../components/weapons.js';
import { composeMech } from '../mechFactory.js';

export const nomad = composeMech({
  id: 'nomad',
  name: 'Nomad',
  role: 'Hit-and-Run Skirmisher',
  chassis: new ChassisComponent({
    stats: { weight: .78 },
    visual: { color: '#c06b3e', accent: '#ffd27a', width: 41, height: 64, scale: .94 }
  }),
  mobility: new MobilityComponent({
    stats: { speed: 410, dashSpeed: 850 },
    movement: { landingRecoveryScale: .68 }
  }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 640, extraJumps: 1, airDashes: 2 } }),
  weapons: new WeaponComponent({
    attacks: {
      dashAttack: { damage: 10, width: 96, height: 47, offsetX: 38, startup: .02, active: .16, recovery: .3, knockback: 230, scale: 3.2, launch: 165, launchRatio: .4, hitstun: .21 },
      bair: { damage: 11, width: 78, height: 44, offsetX: 31, startup: .1, active: .14, recovery: .25, knockback: 250, scale: 3.4, launch: 180, launchRatio: .43, hitstun: .22 }
    }
  }),
  specialAbilities: new SpecialAbilityComponent({
    special: { name: 'Wayfinder Blink', kind: 'blink', cooldown: 1.15, distance: 230 },
    secondary: {
      name: 'Crosscut',
      kind: 'melee',
      cooldown: 1.05,
      attack: { damage: 13, width: 94, height: 60, offsetX: 35, startup: .02, active: .17, recovery: .24, knockback: 230, scale: 3.2, launch: 170, launchRatio: .42, hitstun: .23 }
    },
    ultimate: {
      name: 'Wandering Echoes',
      kind: 'ultimate',
      behavior: 'summon',
      telegraph: .7,
      duration: 4.4,
      count: 3,
      orbitRadius: 78,
      orbitSpeed: 3.8,
      summonSize: 12,
      strikeInterval: .62,
      range: 520,
      radius: 520,
      damage: 11,
      knockback: 180,
      scale: 2.8,
      launch: 150,
      launchRatio: .37,
      hitstun: .2,
      color: '#ffd27a'
    }
  }),
  passive: {
    id: 'shadow-thrusters',
    description: 'Shadow Thrusters: briefly cloaks after an air dash.'
  }
});
