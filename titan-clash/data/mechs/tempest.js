import { ChassisComponent } from '../components/chassis.js';
import { MobilityComponent } from '../components/mobility.js';
import { SpecialAbilityComponent } from '../components/specialAbilities.js';
import { ThrusterComponent } from '../components/thrusters.js';
import { WeaponComponent } from '../components/weapons.js';
import { composeMech } from '../mechFactory.js';

export const tempest = composeMech({
  id: 'tempest',
  name: 'Tempest',
  role: 'Aerial fighter',
  chassis: new ChassisComponent({
    stats: { weight: .93 },
    visual: { color: '#298b82', accent: '#82ffe1', width: 44, height: 66, scale: .98 }
  }),
  mobility: new MobilityComponent({ stats: { speed: 285, dashSpeed: 620 } }),
  thrusters: new ThrusterComponent({ movement: { jumpSpeed: 570, extraJumps: 2, gravityScale: .72 } }),
  weapons: new WeaponComponent({
    attacks: {
      uair: { damage: 10, width: 62, height: 84, offsetX: 12, offsetY: -39, startup: .1, active: .2, recovery: .24, knockback: 225, scale: 3, launch: 300, launchRatio: .61, hitstun: .23 }
    }
  }),
  specialAbilities: new SpecialAbilityComponent({
    special: { name: 'Hover Thrusters', kind: 'hover', cooldown: 1.6, duration: .8 },
    secondary: { name: 'Lightning Cannon', kind: 'beam', cooldown: 1.35, width: 185, damage: 15, knockback: 250, scale: 3.1, launch: 205, launchRatio: .46, hitstun: .28 },
    ultimate: {
      name: 'Thunderstorm Genesis',
      kind: 'ultimate',
      behavior: 'arena-control',
      telegraph: 1,
      duration: 5.2,
      zoneCount: 3,
      zoneRadius: 110,
      strikeInterval: .85,
      strikeTelegraph: .5,
      damage: 16,
      knockback: 250,
      scale: 3.2,
      launch: 220,
      launchRatio: .46,
      hitstun: .3,
      radius: 640,
      color: '#82ffe1'
    }
  }),
  passive: {
    id: 'storm-drive',
    description: 'Storm Drive: improves air control and recovery acceleration.'
  }
});
