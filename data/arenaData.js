const sky = {
  background: ['#071523', '#12344a', '#236072'],
  stars: 72,
  width: 1800,
  height: 760,
  spawnPoints: [{ x: 740, y: 390 }, { x: 1060, y: 390 }],
  platforms: [
    { x: 540, y: 470, width: 720, height: 34, type: 'main' },
    { x: 660, y: 330, width: 190, height: 20, type: 'upper' },
    { x: 950, y: 330, width: 190, height: 20, type: 'upper' }
  ]
};

export const ARENAS = Object.freeze({
  orbitalShipyard: {
    id: 'orbitalShipyard', name: 'Orbital Shipyard', music: 'orbital-pulse', background: sky.background,
    stars: sky.stars, width: sky.width, height: sky.height, spawnPoints: sky.spawnPoints,
    platforms: sky.platforms, hazards: [],
    events: [
      { id: 'shipyard-laser-sweep', type: 'laser-sweep', name: 'Laser Sweep', severity: 'high', warningTime: 1.5, duration: 4, cooldown: 18, initialDelay: 5, damage: 10, height: 34, beamWidth: 110, y: 436 },
      { id: 'shipyard-gravity-shift', type: 'gravity-shift', name: 'Gravity Shift', severity: 'medium', warningTime: 2, duration: 5, cooldown: 24, initialDelay: 13, gravityScale: .55 }
    ]
  },
  volcanicForge: {
    id: 'volcanicForge', name: 'Volcanic Forge World', music: 'forge-rhythm',
    background: ['#180d1b', '#522128', '#e56d37'], stars: 34, width: 1800, height: 760,
    spawnPoints: sky.spawnPoints,
    platforms: [{ x: 540, y: 470, width: 720, height: 34, type: 'main' }, { x: 610, y: 345, width: 170, height: 20, type: 'upper' }, { x: 920, y: 345, width: 170, height: 20, type: 'upper' }],
    hazards: [{ x: 820, y: 460, width: 160, height: 16, damage: 2, period: 2.8, activeTime: .65 }],
    events: [
      { id: 'forge-meteor-storm', type: 'meteor-storm', name: 'Meteor Storm', severity: 'high', warningTime: 2, duration: 6, cooldown: 22, initialDelay: 7, damage: 9, spawnInterval: .7, impactWarning: .75 },
      { id: 'forge-energy-overload', type: 'energy-overload', name: 'Energy Overload', severity: 'critical', warningTime: 2.2, duration: 3, cooldown: 27, initialDelay: 17, damage: 14, laneCount: 3, height: 800 }
    ]
  },
  skyFortress: {
    id: 'skyFortress', name: 'Sky Fortress', music: 'high-altitude',
    background: ['#0a1930', '#315179', '#8ac0d5'], stars: 48, width: 1800, height: 760,
    spawnPoints: sky.spawnPoints,
    platforms: [{ x: 510, y: 470, width: 780, height: 34, type: 'main' }, { x: 600, y: 330, width: 190, height: 20, type: 'upper' }, { x: 1010, y: 330, width: 190, height: 20, type: 'upper' }, { x: 820, y: 260, width: 160, height: 16, type: 'upper' }],
    hazards: [],
    events: [
      { id: 'fortress-missile-barrage', type: 'missile-barrage', name: 'Missile Barrage', severity: 'high', warningTime: 1.6, duration: 5, cooldown: 20, initialDelay: 6, damage: 11, fireInterval: .9, impactWarning: .65 },
      { id: 'fortress-energy-overload', type: 'energy-overload', name: 'Energy Overload', severity: 'critical', warningTime: 2, duration: 3, cooldown: 26, initialDelay: 16, damage: 13, laneCount: 3, laneWidth: 100, height: 800 }
    ]
  },
  fusionReactor: {
    id: 'fusionReactor',
    name: 'Fusion Reactor',
    description: 'An unstable power plant built around an exposed fusion core.',
    visualTheme: 'Molten amber conduits, reactor glow, and deep industrial steel.',
    dangerRating: 'High',
    music: 'reactor-heartbeat',
    background: ['#170f18', '#552b28', '#d46a36'],
    stars: 22,
    width: 1800,
    height: 760,
    spawnPoints: [{ x: 720, y: 390 }, { x: 1080, y: 390 }],
    platforms: [
      { x: 380, y: 470, width: 1040, height: 34, type: 'main' },
      { x: 510, y: 385, width: 230, height: 20, type: 'upper' },
      { x: 1060, y: 385, width: 230, height: 20, type: 'upper' },
      { x: 810, y: 300, width: 180, height: 18, type: 'upper' }
    ],
    hazards: [],
    events: [
      {
        id: 'fusion-reactor-overload',
        type: 'energy-overload',
        name: 'Reactor Energy Overload',
        severity: 'critical',
        warningTime: 2.2,
        duration: 2.8,
        cooldown: 20,
        initialDelay: 8,
        damage: 12,
        laneCount: 4,
        laneWidth: 104,
        height: 820
      }
    ]
  },
  orbitalWeaponsPlatform: {
    id: 'orbitalWeaponsPlatform',
    name: 'Orbital Weapons Platform',
    description: 'A planetary defense installation whose rail cannons rake the firing deck.',
    visualTheme: 'Cold orbital blues, targeting lights, and luminous weapon rails.',
    dangerRating: 'High',
    music: 'orbital-pulse',
    background: ['#071323', '#173657', '#477a96'],
    stars: 112,
    width: 1900,
    height: 760,
    spawnPoints: [{ x: 760, y: 390 }, { x: 1140, y: 390 }],
    platforms: [
      { x: 340, y: 470, width: 1220, height: 34, type: 'main' },
      { x: 490, y: 385, width: 230, height: 20, type: 'upper' },
      { x: 1180, y: 385, width: 230, height: 20, type: 'upper' }
    ],
    hazards: [],
    events: [
      {
        id: 'weapons-platform-laser-sweep',
        type: 'laser-sweep',
        name: 'Defense Rail Sweep',
        severity: 'high',
        warningTime: 1.8,
        duration: 4.6,
        cooldown: 18,
        initialDelay: 7,
        damage: 9,
        height: 32,
        beamWidth: 112,
        y: 438,
        direction: 1
      }
    ]
  },
  meteorBelt: {
    id: 'meteorBelt',
    name: 'Meteor Belt',
    description: 'An asteroid mining operation exposed to a dense and shifting meteor field.',
    visualTheme: 'Violet-black space, mineral glints, and hot meteor trails.',
    dangerRating: 'High',
    music: 'deep-space-mining',
    background: ['#090b19', '#242344', '#63425d'],
    stars: 148,
    width: 2100,
    height: 860,
    spawnPoints: [{ x: 830, y: 430 }, { x: 1270, y: 430 }],
    platforms: [
      { x: 230, y: 520, width: 1640, height: 36, type: 'main' },
      { x: 470, y: 435, width: 250, height: 20, type: 'upper' },
      { x: 1380, y: 435, width: 250, height: 20, type: 'upper' },
      { x: 890, y: 350, width: 320, height: 18, type: 'upper' }
    ],
    hazards: [],
    events: [
      {
        id: 'meteor-belt-storm',
        type: 'meteor-storm',
        name: 'Meteor Storm',
        severity: 'high',
        warningTime: 2,
        duration: 6,
        cooldown: 21,
        initialDelay: 8,
        damage: 9,
        spawnInterval: 0.72,
        impactWarning: 0.9,
        laneCount: 10,
        speed: 470,
        meteorWidth: 36,
        meteorHeight: 48
      }
    ]
  },
  gravityTestFacility: {
    id: 'gravityTestFacility',
    name: 'Gravity Test Facility',
    description: 'An experimental physics laboratory cycling between unfamiliar gravity fields.',
    visualTheme: 'Sterile graphite chambers, white test lighting, and electric cyan field markers.',
    dangerRating: 'Medium',
    music: 'gravity-lab',
    background: ['#0c1820', '#21414c', '#417a7d'],
    stars: 18,
    width: 1800,
    height: 820,
    spawnPoints: [{ x: 720, y: 410 }, { x: 1080, y: 410 }],
    platforms: [
      { x: 380, y: 500, width: 1040, height: 34, type: 'main' },
      { x: 560, y: 415, width: 210, height: 20, type: 'upper' },
      { x: 1030, y: 415, width: 210, height: 20, type: 'upper' },
      { x: 820, y: 330, width: 160, height: 18, type: 'upper' }
    ],
    hazards: [],
    events: [
      {
        id: 'gravity-facility-shift',
        type: 'gravity-shift',
        name: 'Gravity Field Reversal',
        severity: 'medium',
        warningTime: 2.4,
        duration: 6,
        cooldown: 19,
        initialDelay: 8,
        gravityScale: 1.45
      }
    ]
  },
  missileFoundry: {
    id: 'missileFoundry',
    name: 'Missile Foundry',
    description: 'An automated weapons factory that marks active combatants for guided strikes.',
    visualTheme: 'Hazard-striped assembly lines, furnace orange, and missile guidance red.',
    dangerRating: 'High',
    music: 'forge-rhythm',
    background: ['#170f17', '#472524', '#98603d'],
    stars: 28,
    width: 1900,
    height: 780,
    spawnPoints: [{ x: 760, y: 400 }, { x: 1140, y: 400 }],
    platforms: [
      { x: 340, y: 480, width: 1220, height: 34, type: 'main' },
      { x: 500, y: 395, width: 220, height: 20, type: 'upper' },
      { x: 1180, y: 395, width: 220, height: 20, type: 'upper' },
      { x: 850, y: 310, width: 200, height: 18, type: 'upper' }
    ],
    hazards: [],
    events: [
      {
        id: 'missile-foundry-barrage',
        type: 'missile-barrage',
        name: 'Foundry Missile Barrage',
        severity: 'high',
        warningTime: 1.8,
        duration: 5,
        cooldown: 19,
        initialDelay: 7,
        damage: 10,
        fireInterval: 1,
        impactWarning: 0.8,
        speed: 390,
        targetOffset: 115
      }
    ]
  },
  leviathanArena: {
    id: 'leviathanArena',
    name: "Leviathan's Crucible",
    music: 'reactor-heartbeat',
    background: ['#120e20', '#2b2037', '#65423b'],
    stars: 58,
    width: 2600,
    height: 1040,
    spawnPoints: [{ x: 720, y: 700 }],
    platforms: [
      { x: 150, y: 700, width: 2300, height: 46, type: 'main' },
      { x: 410, y: 610, width: 430, height: 24, type: 'upper' },
      { x: 1760, y: 610, width: 430, height: 24, type: 'upper' },
      { x: 1000, y: 525, width: 600, height: 24, type: 'upper' }
    ],
    hazards: [],
    events: [],
    bossOnly: true,
    cameraBounds: { top: 390, bottom: 790 }
  },
  aegisCitadel: {
    id: 'aegisCitadel',
    name: "Aegis Prime's Citadel",
    music: 'high-altitude',
    background: ['#081522', '#1b3448', '#476477'],
    stars: 86,
    width: 3200,
    height: 1180,
    spawnPoints: [{ x: 900, y: 790 }],
    platforms: [
      { x: 100, y: 790, width: 3000, height: 48, type: 'main' },
      { x: 310, y: 655, width: 470, height: 24, type: 'upper' },
      { x: 2420, y: 655, width: 470, height: 24, type: 'upper' },
      { x: 1010, y: 565, width: 370, height: 22, type: 'upper' },
      { x: 1820, y: 565, width: 370, height: 22, type: 'upper' },
      { x: 1430, y: 475, width: 340, height: 20, type: 'upper' }
    ],
    hazards: [],
    events: [
      {
        id: 'citadel-laser-sweep', type: 'laser-sweep', name: 'Citadel Laser Sweep',
        severity: 'high', warningTime: 1.8, duration: 4.2, cooldown: 23,
        initialDelay: 7, damage: 9, height: 38, beamWidth: 120, y: 752
      },
      {
        id: 'citadel-energy-overload', type: 'energy-overload', name: 'Citadel Strike Lanes',
        severity: 'critical', warningTime: 2.2, duration: 2.8, cooldown: 28,
        initialDelay: 16, damage: 12, laneCount: 5, laneWidth: 92, height: 900
      }
    ],
    bossOnly: true,
    cameraBounds: { top: 420, bottom: 860 }
  }
});
