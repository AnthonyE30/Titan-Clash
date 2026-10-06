export const titanLeviathan = Object.freeze({
  id: 'titan-leviathan',
  arenaId: 'leviathanArena',
  name: 'Titan Leviathan',
  role: 'Ancient autonomous war machine',
  health: 720,
  size: { width: 176, height: 156 },
  spawn: { x: 1500, y: 544 },
  movement: {
    speed: 188,
    acceleration: 3.2,
    edgeRecoveryMargin: 230,
    fallRecoveryMargin: 180,
    fallRecoveryDuration: .85
  },
  controller: { preferredRange: 280, retreatRange: 118, decisionInterval: .32 },
  visual: { color: '#738b91', accent: '#ff764d', enrage: '#ff312e' },
  cinematic: { introDuration: 2.2, defeatDuration: 1.8, playerDefeatDuration: 1.4 },
  enrage: { healthThreshold: .18, cooldownMultiplier: .7, speedMultiplier: 1.42 },
  phases: [
    { name: 'Siege Protocol', healthThreshold: 1, actions: ['plasma-barrage', 'charge-attack'], transitionDuration: 0 },
    { name: 'Hunter Protocol', healthThreshold: .68, actions: ['drone-swarm', 'tail-sweep', 'missile-storm'], transitionDuration: 1.2 },
    { name: 'Reactor Protocol', healthThreshold: .34, actions: ['reactor-overload', 'drone-swarm', 'tail-sweep', 'missile-storm'], transitionDuration: 1.5 }
  ],
  actions: [
    { id: 'plasma-barrage', name: 'Plasma Barrage', kind: 'volley', count: 3, damage: 9, knockback: 175, scale: 2.2, launch: 145, launchRatio: .38, speed: 385, verticalSpread: 52, width: 34, height: 24, life: 2.3, telegraph: .75, cooldown: 2.2, maxRange: 950 },
    { id: 'charge-attack', name: 'Charge Attack', kind: 'charge', damage: 16, knockback: 310, scale: 3.2, launch: 210, launchRatio: .48, speed: 630, duration: .58, telegraph: .9, cooldown: 3.4, maxRange: 650 },
    { id: 'drone-swarm', name: 'Drone Swarm', kind: 'swarm', count: 5, damage: 7, knockback: 145, scale: 2, launch: 125, launchRatio: .34, speed: 300, spreadAngle: .13, width: 25, height: 25, life: 2.8, telegraph: .85, cooldown: 2.8, maxRange: 850 },
    { id: 'tail-sweep', name: 'Tail Sweep', kind: 'sweep', damage: 14, knockback: 260, scale: 2.9, launch: 190, launchRatio: .44, width: 290, height: 135, life: .26, telegraph: .72, cooldown: 2.7, maxRange: 390 },
    { id: 'missile-storm', name: 'Missile Storm', kind: 'missiles', count: 5, damage: 10, knockback: 210, scale: 2.5, launch: 175, launchRatio: .41, speed: 450, spacing: 78, heightAboveTarget: 340, width: 28, height: 46, life: 1.8, telegraph: 1.05, cooldown: 3.6, maxRange: 1100 },
    { id: 'reactor-overload', name: 'Reactor Overload', kind: 'overload', damage: 19, knockback: 330, scale: 3.5, launch: 260, launchRatio: .55, radius: 250, count: 3, hazardWidth: 128, hazardHeight: 28, warningTime: 1.1, activeTime: .42, life: .3, telegraph: 1.35, cooldown: 5.5, maxRange: 1000 }
  ]
});
