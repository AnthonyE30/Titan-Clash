import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { WeaponComponent } from '../components/weapons.js';
import { composeMech } from '../mechFactory.js';

export const phantom = composeMech({
  id: 'phantom',
  name: 'Phantom',
  role: 'Fast assassin',
  chassis: new ChassisComponent({
    stats: { weight: .84 },
    visual: { color: '#7852bd', accent: '#ef8bff', width: 42, height: 66, scale: .96 }
  }),
  mobility: new MobilityComponent({ stats: { speed: 375, dashSpeed: 790 } }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 625, airDashes: 2 } }),
  weapons: new WeaponComponent(),
  specialAbilities: new SpecialAbilityComponent({
    special: { name: 'Blink Dash', kind: 'blink', cooldown: 1.4, distance: 185 },
    secondary: { name: 'Energy Blades', kind: 'melee', cooldown: 1.15, attack: { damage: 15, width: 105, height: 64, offsetX: 39, offsetY: 0, startup: .02, active: .22, recovery: .3, knockback: 240, scale: 3.2, launch: 185, launchRatio: .43, hitstun: .26 } },
    ultimate: {
      name: 'Shadow Frenzy',
      kind: 'ultimate',
      behavior: 'persistent',
      telegraph: .55,
      duration: 3.8,
      hitInterval: .48,
      radius: 225,
      damage: 9,
      knockback: 170,
      scale: 2.8,
      launch: 145,
      launchRatio: .34,
      hitstun: .2,
      color: '#ef8bff'
    }
  }),
  passive: {
    id: 'shadow-thrusters',
    description: 'Shadow Thrusters: briefly cloaks after an air dash.'
  }
});
