import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { WeaponComponent } from '../components/weapons.js';
import { composeMech } from '../mechFactory.js';

export const atlas = composeMech({
  id: 'atlas',
  name: 'Atlas',
  role: 'Balanced fighter',
  chassis: new ChassisComponent({
    stats: { weight: 1 },
    visual: { color: '#34a7d5', accent: '#70f4ff' }
  }),
  mobility: new MobilityComponent({
    stats: { speed: 300, dashSpeed: 650 },
    movement: { landingRecoveryScale: .65 }
  }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 600 } }),
  weapons: new WeaponComponent({
    attacks: {
      fair: { damage: 10, width: 84, height: 43, offsetX: 32, offsetY: 0, startup: .12, active: .18, recovery: .25, knockback: 245, scale: 3.15, launch: 180, launchRatio: .44, hitstun: .22 }
    }
  }),
  specialAbilities: new SpecialAbilityComponent({
    special: { name: 'Plasma Rifle', kind: 'projectile', cooldown: .65, projectile: { width: 24, height: 13, speed: 710, life: 1.7 }, attack: { damage: 8, width: 24, height: 18, knockback: 170, scale: 2.5, launch: 140, launchRatio: .34, hitstun: .17 } },
    secondary: { name: 'Shield Bash', kind: 'melee', cooldown: 1.2, attack: { damage: 13, width: 90, height: 70, offsetX: 35, offsetY: 0, startup: .03, active: .2, recovery: .24, knockback: 255, scale: 3.5, launch: 170, launchRatio: .4, hitstun: .24 } },
    ultimate: {
      name: 'Orbital Strike',
      kind: 'ultimate',
      behavior: 'aoe',
      targeting: 'target',
      telegraph: .85,
      duration: .7,
      radius: 175,
      damage: 24,
      knockback: 370,
      scale: 4,
      launch: 340,
      launchRatio: .62,
      hitstun: .42,
      color: '#70f4ff'
    }
  }),
  passive: {
    id: 'adaptive-shield',
    description: 'Adaptive Shield: gains a temporary shield after being out of combat.'
  }
});
