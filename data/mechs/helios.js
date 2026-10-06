import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { WeaponComponent } from '../components/weapons.js';
import { composeMech } from '../mechFactory.js';

export const helios = composeMech({
  id: 'helios',
  name: 'Helios',
  role: 'Energy Artillery',
  chassis: new ChassisComponent({
    stats: { weight: .98 },
    visual: { color: '#a34a9d', accent: '#ffce68', width: 49, height: 70, scale: 1.02 }
  }),
  mobility: new MobilityComponent({
    stats: { speed: 255, dashSpeed: 575 },
    movement: { landingRecoveryScale: 1.05 }
  }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 555, extraJumps: 1, airDashes: 1, gravityScale: .92 } }),
  weapons: new WeaponComponent({
    attacks: {
      up: { damage: 9, width: 54, height: 84, offsetX: 13, offsetY: -37, startup: .12, active: .16, recovery: .28, knockback: 210, scale: 3, launch: 280, launchRatio: .58, hitstun: .21 },
      down: { damage: 10, width: 88, height: 45, offsetX: 30, offsetY: 28, startup: .16, active: .2, recovery: .31, knockback: 215, scale: 3.1, launch: 125, launchRatio: .31, hitstun: .22 }
    }
  }),
  specialAbilities: new SpecialAbilityComponent({
    special: {
      name: 'Solar Lance',
      kind: 'beam',
      cooldown: 1.55,
      width: 300,
      damage: 14,
      knockback: 220,
      scale: 3,
      launch: 190,
      launchRatio: .42,
      hitstun: .26
    },
    secondary: {
      name: 'Flare Mine',
      kind: 'spread',
      cooldown: 1.8,
      count: 2,
      projectile: { width: 25, height: 22, speed: 470, life: 1.8 },
      attack: { damage: 8, knockback: 185, scale: 2.8, launch: 160, launchRatio: .39, hitstun: .2 }
    },
    ultimate: {
      name: 'Corona Field',
      kind: 'ultimate',
      behavior: 'persistent',
      telegraph: .9,
      duration: 4.6,
      hitInterval: .72,
      radius: 265,
      damage: 10,
      knockback: 175,
      scale: 2.8,
      launch: 155,
      launchRatio: .38,
      hitstun: .21,
      color: '#ffce68'
    }
  }),
  passive: {
    id: 'storm-drive',
    description: 'Storm Drive: improves air control and recovery acceleration.'
  }
});
