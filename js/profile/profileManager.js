const STORAGE_KEY = 'titan-clash-pilot-profile';
const PROFILE_VERSION = 3;
const DEFAULT_CALLSIGN = 'PILOT 01';
const BOSS_RUSH_DIFFICULTIES = ['normal', 'hard', 'extreme'];

function emptyProfile() {
  return {
    version: PROFILE_VERSION,
    callsign: DEFAULT_CALLSIGN,
    favoriteMechId: null,
    mechUsage: {},
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      damageDealt: 0,
      damageTaken: 0,
      kos: 0,
      bossesDefeated: 0,
      trainingSessions: 0,
      bossRush: {
        runs: 0,
        clears: 0,
        deaths: 0,
        damageTaken: 0,
        bossesCleared: 0,
        bestTime: null,
        highestDifficultyCleared: null,
        bestTimes: { normal: null, hard: null, extreme: null }
      }
    }
  };
}

function wholeNumber(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function damageValue(value) {
  return Number.isFinite(value) && value > 0 ? Math.round(value * 10) / 10 : 0;
}

export class ProfileManager {
  constructor(mechDefinitions, storage) {
    this.mechDefinitions = mechDefinitions;
    this.storageError = null;
    this.storage = storage === undefined ? this.getStorage() : storage;
    this.profile = this.load();
  }

  getStorage() {
    try {
      return globalThis.localStorage;
    } catch (error) {
      this.storageError = error;
      return null;
    }
  }

  load() {
    if (!this.storage) {
      console.warn('Pilot profile storage is unavailable; statistics will last only for this session.', this.storageError);
      return emptyProfile();
    }

    let serialized;
    try {
      serialized = this.storage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Could not read the saved pilot profile; using a new in-memory profile.', error);
      return emptyProfile();
    }
    if (!serialized) return emptyProfile();

    let saved;
    try {
      saved = JSON.parse(serialized);
    } catch (error) {
      console.warn('Saved pilot profile is invalid JSON; using a new profile.', error);
      return emptyProfile();
    }
    return this.normalize(saved);
  }

  normalize(saved) {
    const profile = emptyProfile();
    if (!saved || ![1, 2, PROFILE_VERSION].includes(saved.version)) {
      console.warn('Saved pilot profile has an unsupported format; using a new profile.');
      return profile;
    }
    const stats = saved.stats ?? {};
    for (const key of ['matchesPlayed', 'wins', 'losses', 'kos', 'bossesDefeated', 'trainingSessions']) {
      profile.stats[key] = wholeNumber(stats[key]);
    }
    for (const key of ['damageDealt', 'damageTaken']) {
      profile.stats[key] = damageValue(stats[key]);
    }
    const rush = stats.bossRush ?? {};
    for (const key of ['runs', 'clears', 'deaths', 'bossesCleared']) {
      profile.stats.bossRush[key] = wholeNumber(rush[key]);
    }
    profile.stats.bossRush.damageTaken = damageValue(rush.damageTaken);
    for (const difficulty of BOSS_RUSH_DIFFICULTIES) {
      const bestTime = rush.bestTimes?.[difficulty];
      profile.stats.bossRush.bestTimes[difficulty] =
        Number.isFinite(bestTime) && bestTime > 0 ? Math.round(bestTime * 10) / 10 : null;
    }
    const bestTime = rush.bestTime;
    const previousBestTimes = Object.values(profile.stats.bossRush.bestTimes).filter(time => time !== null);
    profile.stats.bossRush.bestTime = Number.isFinite(bestTime) && bestTime > 0
      ? Math.round(bestTime * 10) / 10
      : previousBestTimes.length ? Math.min(...previousBestTimes) : null;
    profile.stats.bossRush.highestDifficultyCleared =
      BOSS_RUSH_DIFFICULTIES.includes(rush.highestDifficultyCleared)
        ? rush.highestDifficultyCleared
        : [...BOSS_RUSH_DIFFICULTIES].reverse()
          .find(difficulty => profile.stats.bossRush.bestTimes[difficulty] !== null) ?? null;
    if (typeof saved.callsign === 'string') {
      profile.callsign = saved.callsign.trim().replace(/\s+/g, ' ').slice(0, 18) || DEFAULT_CALLSIGN;
    }
    if (saved.mechUsage && typeof saved.mechUsage === 'object' && !Array.isArray(saved.mechUsage)) {
      for (const [mechId, count] of Object.entries(saved.mechUsage)) {
        if (Object.hasOwn(this.mechDefinitions, mechId)) {
          profile.mechUsage[mechId] = wholeNumber(count);
        }
      }
    }
    profile.favoriteMechId = this.findFavoriteMech(profile.mechUsage);
    return profile;
  }

  save() {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch (error) {
      console.error('Could not save the pilot profile to local storage.', error);
    }
  }

  setCallsign(callsign) {
    if (typeof callsign !== 'string') throw new TypeError('Pilot callsign must be text.');
    const normalized = callsign.trim().replace(/\s+/g, ' ').slice(0, 18);
    this.profile.callsign = normalized || DEFAULT_CALLSIGN;
    this.save();
  }

  recordTrainingSession() {
    this.profile.stats.trainingSessions++;
    this.save();
  }

  recordDamageDealt(amount) {
    this.profile.stats.damageDealt = damageValue(this.profile.stats.damageDealt + damageValue(amount));
    this.save();
  }

  recordDamageTaken(amount) {
    this.profile.stats.damageTaken = damageValue(this.profile.stats.damageTaken + damageValue(amount));
    this.save();
  }

  recordKO() {
    this.profile.stats.kos++;
    this.save();
  }

  recordBossDefeated() {
    this.profile.stats.bossesDefeated++;
    this.save();
  }

  recordBossRushResult({ cleared, difficulty, time, deaths, damageTaken, bossesCleared }) {
    if (!BOSS_RUSH_DIFFICULTIES.includes(difficulty)) {
      throw new Error(`Unknown boss rush difficulty "${difficulty}".`);
    }
    const rush = this.profile.stats.bossRush;
    const runTime = Number.isFinite(time) && time > 0 ? Math.round(time * 10) / 10 : 0;
    rush.runs++;
    if (cleared) {
      rush.clears++;
      if (rush.bestTime === null || runTime < rush.bestTime) rush.bestTime = runTime;
      const previousBest = rush.bestTimes[difficulty];
      if (previousBest === null || runTime < previousBest) {
        rush.bestTimes[difficulty] = runTime;
      }
      const difficultyRank = BOSS_RUSH_DIFFICULTIES.indexOf(difficulty);
      const highestRank = BOSS_RUSH_DIFFICULTIES.indexOf(rush.highestDifficultyCleared);
      if (difficultyRank > highestRank) rush.highestDifficultyCleared = difficulty;
    }
    rush.deaths += wholeNumber(deaths);
    rush.damageTaken = damageValue(rush.damageTaken + damageValue(damageTaken));
    rush.bossesCleared += wholeNumber(bossesCleared);
    this.save();
  }

  recordMatchCompleted(result, mechId) {
    if (!['win', 'loss', 'draw'].includes(result)) throw new Error(`Unknown match result "${result}".`);
    this.profile.stats.matchesPlayed++;
    if (result === 'win') this.profile.stats.wins++;
    if (result === 'loss') this.profile.stats.losses++;
    if (Object.hasOwn(this.mechDefinitions, mechId)) {
      this.profile.mechUsage[mechId] = (this.profile.mechUsage[mechId] ?? 0) + 1;
      this.profile.favoriteMechId = this.findFavoriteMech(this.profile.mechUsage);
    }
    this.save();
  }

  findFavoriteMech(mechUsage) {
    return Object.entries(mechUsage)
      .filter(([mechId, count]) => Object.hasOwn(this.mechDefinitions, mechId) && count > 0)
      .sort(([idA, countA], [idB, countB]) => countB - countA || idA.localeCompare(idB))[0]?.[0] ?? null;
  }

  getMostPlayedMechs(limit = 5) {
    return Object.entries(this.profile.mechUsage)
      .filter(([mechId, count]) => Object.hasOwn(this.mechDefinitions, mechId) && count > 0)
      .sort(([idA, countA], [idB, countB]) => countB - countA || idA.localeCompare(idB))
      .slice(0, limit)
      .map(([mechId, count]) => ({ id: mechId, name: this.mechDefinitions[mechId].name, count }));
  }

  getSnapshot() {
    return {
      callsign: this.profile.callsign,
      favoriteMechId: this.profile.favoriteMechId,
      stats: {
        ...this.profile.stats,
        bossRush: {
          ...this.profile.stats.bossRush,
          bestTimes: { ...this.profile.stats.bossRush.bestTimes }
        }
      },
      mostPlayedMechs: this.getMostPlayedMechs()
    };
  }
}
