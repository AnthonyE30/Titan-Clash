export const aegisPrime = Object.freeze({
  id: 'aegis-prime',
  arenaId: 'aegisCitadel',
  name: 'Aegis Prime',
  role: 'Ancient fortress war machine',
  health: 840,
  size: { width: 208, height: 178 },
  spawn: { x: 2260, y: 612 },
  movement: {
    speed: 104,
    acceleration: 1.55,
    edgeRecoveryMargin: 270,
    fallRecoveryMargin: 140,
    fallRecoveryDuration: 1.45
  },
  controller: { preferredRange: 470, retreatRange: 300, decisionInterval: .56 },
  visual: { color: '#566d7d', accent: '#75e5f2', enrage: '#ffd365' },
  cinematic: { introDuration: 2.8, defeatDuration: 2.2, playerDefeatDuration: 1.6 },
  enrage: { healthThreshold: .16, cooldownMultiplier: .82, speedMultiplier: 1.18 },
  phases: [
    { name: 'Sentinel Lattice', healthThreshold: 1, actions: ['shield-drones', 'drone-screen'], transitionDuration: 0 },
    { name: 'Artillery Array', healthThreshold: .76, actions: ['artillery-lasers', 'crossfire-grid'], transitionDuration: 1.8 },
    { name: 'Core Overload', healthThreshold: .39, actions: ['core-overload', 'artillery-lasers', 'crossfire-grid'], transitionDuration: 2.2 }
  ],
  actions: [
    {
      id: 'shield-drones', name: 'Shield Drones', kind: 'shield', trigger: 'target-attack',
      telegraph: 0, duration: 1.15, damageReduction: .72, droneCount: 3, cooldown: 3.6,
      minRange: 120, maxRange: 820
    },
    {
      id: 'drone-screen', name: 'Drone Screen', kind: 'swarm', count: 4, damage: 6,
      knockback: 125, scale: 1.8, launch: 110, launchRatio: .3, speed: 270,
      spreadAngle: .3, width: 28, height: 28, life: 3, telegraph: .95,
      cooldown: 4.4, maxRange: 1000, recovery: .3
    },
    {
      id: 'artillery-lasers', name: 'Artillery Lasers', kind: 'beam', count: 2,
      verticalSpacing: 54, range: 1250, height: 34, damage: 13, knockback: 245,
      scale: 2.8, launch: 180, launchRatio: .42, life: .46, telegraph: 1.35,
      telegraphStyle: 'beam', cooldown: 5.8, maxRange: 1350, recovery: .8
    },
    {
      id: 'crossfire-grid', name: 'Crossfire Grid', kind: 'hazards', count: 4,
      hazardWidth: 94, hazardHeight: 36, damage: 10, knockback: 205,
      scale: 2.5, launch: 160, launchRatio: .38, warningTime: 1.25,
      activeTime: .5, telegraph: .9, telegraphStyle: 'lanes', cooldown: 6.2,
      maxRange: 1500, recovery: .55
    },
    {
      id: 'core-overload', name: 'Core Overload', kind: 'overload',
      damage: 21, knockback: 360, scale: 3.8, launch: 285, launchRatio: .58,
      radius: 285, count: 3, hazardWidth: 150, hazardHeight: 42, warningTime: 1.45,
      activeTime: .48, life: .32, telegraph: 1.65, telegraphStyle: 'area',
      cooldown: 7.2, maxRange: 1400, recovery: 1.1
    }
  ]
});
