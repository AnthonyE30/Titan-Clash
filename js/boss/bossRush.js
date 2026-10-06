import { BOSSES } from '../../data/bosses/index.js';

export const BOSS_RUSH_DIFFICULTIES = Object.freeze({
  normal: Object.freeze({
    label: 'Normal',
    aggression: 1,
    cooldown: 1,
    telegraph: 1,
    recovery: 1
  }),
  hard: Object.freeze({
    label: 'Hard',
    aggression: 1.25,
    cooldown: .86,
    telegraph: .82,
    recovery: .78
  }),
  extreme: Object.freeze({
    label: 'Extreme',
    aggression: 1.55,
    cooldown: .72,
    telegraph: .62,
    recovery: .55
  })
});

export function createBossRushBossDefinition(bossId, difficulty) {
  const definition = BOSSES[bossId];
  const modifiers = BOSS_RUSH_DIFFICULTIES[difficulty];
  if (!definition) throw new Error(`Unknown boss in rush order: ${bossId}`);
  if (!modifiers) throw new Error(`Unknown boss rush difficulty: ${difficulty}`);

  return {
    ...definition,
    controller: {
      ...definition.controller,
      decisionInterval: definition.controller.decisionInterval / modifiers.aggression
    },
    actions: definition.actions.map(action => ({
      ...action,
      cooldown: (action.cooldown ?? 0) * modifiers.cooldown,
      telegraph: (action.telegraph ?? .6) * modifiers.telegraph,
      recovery: (action.recovery ?? .35) * modifiers.recovery
    }))
  };
}

export function createBossRushState(config) {
  const difficulty = config.difficulty ?? 'normal';
  if (!BOSS_RUSH_DIFFICULTIES[difficulty]) {
    throw new Error(`Unknown boss rush difficulty: ${difficulty}`);
  }
  const bossIds = config.bossIds ?? Object.keys(BOSSES);
  if (!Array.isArray(bossIds) || bossIds.length === 0 ||
      bossIds.some(bossId => !Object.hasOwn(BOSSES, bossId)) ||
      new Set(bossIds).size !== bossIds.length) {
    throw new Error('Boss rush order must contain unique registered bosses.');
  }
  return {
    bossIds: [...bossIds],
    difficulty,
    index: 0,
    bossesCleared: 0,
    deaths: 0,
    damageTaken: 0,
    intermission: null,
    resultRecorded: false
  };
}

export function calculateBossRushGrade({ bossesCleared, bossCount, time, deaths, damageTaken }) {
  const progress = bossCount > 0 ? Math.min(1, Math.max(0, bossesCleared) / bossCount) : 0;
  const deathPenalty = Math.min(30, Math.max(0, deaths) * 10);
  const damagePenalty = Math.min(30, Math.max(0, damageTaken) / 20);
  const timePenalty = bossCount > 0
    ? Math.min(20, Math.max(0, time) / (bossCount * 12))
    : 20;
  const score = Math.max(0, Math.round(progress * 100 - deathPenalty - damagePenalty - timePenalty));
  const grade = score >= 90 ? 'S'
    : score >= 75 ? 'A'
      : score >= 60 ? 'B'
        : score >= 40 ? 'C' : 'D';
  return { grade, score };
}
