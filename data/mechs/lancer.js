import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { WeaponComponent } from '../components/weapons.js';
import { composeMech } from '../mechFactory.js';

export const lancer = composeMech({
  id: 'lancer',
  name: 'Lancer',
  role: 'Precision Duelist',
  chassis: new ChassisComponent({
    stats: { weight: 1.02 },
    visual: { color: '#3976b8', accent: '#b4eeff', width: 46, height: 70, scale: 1.01 }
  }),
  mobility: new MobilityComponent({
    stats: { speed: 285, dashSpeed: 625 },
    movement: { landingRecoveryScale: .86 }
  }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 585, extraJumps: 1, airDashes: 1 } }),
  weapons: new WeaponComponent({
    attacks: {
      neutral: { damage: 8, width: 58, height: 38, offsetX: 24, startup: .08, active: .11, recovery: .19, knockback: 190, scale: 2.8, launch: 135, launchRatio: .36, hitstun: .17 },
      side: { damage: 12, width: 108, height: 28, offsetX: 48, startup: .18, active: .13, recovery: .28, knockback: 275, scale: 3.7, launch: 190, launchRatio: .44, hitstun: .24 },
      fair: { damage: 11, width: 100, height: 30, offsetX: 43, startup: .13, active: .15, recovery: .26, knockback: 250, scale: 3.5, launch: 180, launchRatio: .43, hitstun: .22 }
    }
  }),
  specialAbilities: new SpecialAbilityComponent({
    special: {
      name: 'Needle Lance',
      kind: 'projectile',
      cooldown: .85,
      projectile: { width: 16, height: 9, speed: 900, life: 1.35 },
      attack: { damage: 9, knockback: 205, scale: 3, launch: 145, launchRatio: .37, hitstun: .18 }
    },
    secondary: {
      name: "Fencer's Riposte",
      kind: 'melee',
      cooldown: 1.45,
      attack: { damage: 16, width: 86, height: 66, offsetX: 30, startup: .04, active: .18, recovery: .34, knockback: 285, scale: 3.8, launch: 205, launchRatio: .47, hitstun: .28 }
    },
    ultimate: {
      name: 'Puncture Beam',
      kind: 'ultimate',
      behavior: 'beam',
      telegraph: .8,
      duration: .35,
      range: 680,
      beamHeight: 52,
      radius: 680,
      damage: 28,
      knockback: 350,
      scale: 3.8,
      launch: 290,
      launchRatio: .56,
      hitstun: .4,
      color: '#b4eeff'
    }
  }),
  passive: {
    id: 'adaptive-shield',
    description: 'Adaptive Shield: gains a temporary shield after being out of combat.'
  }
});
