import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { ShieldComponent } from '../components/shields.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { WeaponComponent } from '../components/weapons.js';
import { composeMech } from '../mechFactory.js';

export const bulwark = composeMech({
  id: 'bulwark',
  name: 'Bulwark',
  role: 'Defensive Fortress',
  chassis: new ChassisComponent({
    stats: { weight: 1.38 },
    visual: { color: '#88714c', accent: '#ffe09b', width: 58, height: 78, scale: 1.1 }
  }),
  mobility: new MobilityComponent({
    stats: { speed: 205, dashSpeed: 510 },
    movement: { landingRecoveryScale: 1.2 }
  }),
  shields: new ShieldComponent({ stats: { knockbackResistance: .22 } }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 520, extraJumps: 1, airDashes: 0 } }),
  weapons: new WeaponComponent({
    attacks: {
      neutral: { damage: 10, width: 72, height: 64, offsetX: 25, startup: .18, active: .19, recovery: .34, knockback: 215, scale: 3, launch: 145, launchRatio: .36, hitstun: .22 },
      down: { damage: 11, width: 105, height: 34, offsetX: 27, offsetY: 31, startup: .2, active: .18, recovery: .38, knockback: 220, scale: 3.1, launch: 105, launchRatio: .29, hitstun: .24 }
    }
  }),
  specialAbilities: new SpecialAbilityComponent({
    special: { name: 'Aegis Bastion', kind: 'barrier', cooldown: 3.2, duration: 1.55 },
    secondary: {
      name: 'Breach Mortar',
      kind: 'projectile',
      cooldown: 1.7,
      projectile: { width: 30, height: 26, speed: 420, life: 2.2 },
      attack: { damage: 12, knockback: 235, scale: 3, launch: 170, launchRatio: .4, hitstun: .23 }
    },
    ultimate: {
      name: 'Fortress Protocol',
      kind: 'ultimate',
      behavior: 'transformation',
      telegraph: .75,
      duration: 6,
      damageMultiplier: 1.12,
      knockbackResistance: .55,
      speedMultiplier: .72,
      pulseRadius: 165,
      pulseDamage: 10,
      pulseInterval: 1.25,
      radius: 165,
      color: '#ffe09b'
    }
  }),
  passive: {
    id: 'siege-core',
    description: 'Siege Core: gains armor as damage increases.'
  }
});
