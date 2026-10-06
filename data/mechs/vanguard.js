import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { ShieldComponent } from '../components/shields.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { WeaponComponent } from '../components/weapons.js';
import { composeMech } from '../mechFactory.js';

export const vanguard = composeMech({
  id: 'vanguard',
  name: 'Vanguard',
  role: 'Heavy tank',
  chassis: new ChassisComponent({
    stats: { weight: 1.28 },
    visual: { color: '#d85647', accent: '#ffb45c', width: 54, height: 74, scale: 1.08 }
  }),
  mobility: new MobilityComponent({ stats: { speed: 235, dashSpeed: 560 } }),
  shields: new ShieldComponent({ stats: { knockbackResistance: .17 } }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 540 } }),
  weapons: new WeaponComponent({
    attacks: {
      side: { damage: 13, width: 88, height: 54, offsetX: 36, offsetY: 0, startup: .21, active: .2, recovery: .35, knockback: 270, scale: 3.6, launch: 200, launchRatio: .45, hitstun: .27 }
    }
  }),
  specialAbilities: new SpecialAbilityComponent({
    special: { name: 'Rocket Salvo', kind: 'spread', cooldown: 1.15, projectile: { width: 27, height: 15, speed: 590, life: 1.9 }, attack: { damage: 7, width: 26, height: 20, knockback: 190, scale: 2.6, launch: 150, launchRatio: .35, hitstun: .18 }, count: 3 },
    secondary: { name: 'Energy Barrier', kind: 'barrier', cooldown: 2.5, duration: 1.2 },
    ultimate: {
      name: 'Siege Protocol',
      kind: 'ultimate',
      behavior: 'transformation',
      telegraph: .7,
      duration: 7,
      damageMultiplier: 1.3,
      knockbackResistance: .38,
      speedMultiplier: .82,
      pulseRadius: 135,
      pulseDamage: 12,
      pulseInterval: 1.4,
      radius: 250,
      color: '#ff7955'
    }
  }),
  passive: {
    id: 'siege-core',
    description: 'Siege Core: gains armor as damage increases.'
  }
});
