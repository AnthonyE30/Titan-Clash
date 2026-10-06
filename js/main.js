import { Game } from './game.js';
import { MECHS } from '../data/mechData.js';
import { ARENAS } from '../data/arenaData.js';
import { BOSSES } from '../data/bosses/index.js';
import { MECH_PRESENTATION } from '../data/mechPresentation.js';
import { ProfileManager } from './profile/profileManager.js';

const canvas = document.querySelector('#game-canvas');
const game = new Game(canvas);
const profile = new ProfileManager(MECHS);
game.profileManager = profile;
const overlay = document.querySelector('#overlay');
const shell = document.querySelector('.shell');
shell.append(overlay);
const menuScreens = [...document.querySelectorAll('.menu-screen')];
const selectors = {
  arena: document.querySelector('#arena-select'),
  p1: document.querySelector('#mech-p1'),
  p2: document.querySelector('#mech-p2'),
  mode: document.querySelector('#mode-select'),
  aiProfile: document.querySelector('#ai-profile'),
  boss: document.querySelector('#boss-select'),
  bossRushDifficulty: document.querySelector('#boss-rush-difficulty'),
  dummyBehavior: document.querySelector('#dummy-behavior')
};

for (const [id, arena] of Object.entries(ARENAS)) {
  if (!arena.bossOnly) selectors.arena.add(new Option(arena.name, id));
}
for (const [id, mech] of Object.entries(MECHS)) {
  selectors.p1.add(new Option(mech.name, id));
  selectors.p2.add(new Option(mech.name, id));
}
selectors.arena.value = 'orbitalShipyard';
selectors.p1.value = 'atlas';
selectors.p2.value = 'vanguard';
selectors.mode.value = 'stock';
for (const [id, boss] of Object.entries(BOSSES)) selectors.boss.add(new Option(boss.name, id));
selectors.boss.value = 'titan-leviathan';
document.querySelector('#roster-count').textContent = String(Object.keys(MECHS).length).padStart(2, '0');
document.querySelector('#arena-count').textContent = String(Object.values(ARENAS).filter(arena => !arena.bossOnly).length).padStart(2, '0');
document.querySelector('#boss-count').textContent = String(Object.keys(BOSSES).length).padStart(2, '0');
document.querySelector('#boss-rush-order').textContent = Object.values(BOSSES).map(boss => boss.name).join('  →  ');
const reducedMotionOption = document.querySelector('#reduced-motion-option');
reducedMotionOption.checked = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
shell.classList.toggle('reduced-motion', reducedMotionOption.checked);
shell.classList.add('menu-open');

let screenTransitionId = 0;
let setupMode = 'stock';
let activePilot = 0;
const pilotLocks = [false, false];
const rosterGrid = document.querySelector('#roster-grid');
const mechEntries = Object.entries(MECHS);
const statDefinitions = [
  { id: 'damage', label: 'DAMAGE', get: mech => Math.max(...Object.values(mech.attacks).map(attack => attack.damage ?? 0)) + Math.max(mech.abilities.special.damage ?? mech.abilities.special.attack?.damage ?? 0, mech.abilities.secondary?.damage ?? mech.abilities.secondary?.attack?.damage ?? 0) },
  { id: 'mobility', label: 'MOBILITY', get: mech => mech.stats.speed + mech.stats.dashSpeed * .25 + (mech.movement.airDashes ?? 0) * 30 + (mech.movement.extraJumps ?? 0) * 15 },
  { id: 'defense', label: 'DEFENSE', get: mech => mech.stats.weight * 60 + (mech.stats.knockbackResistance ?? 0) * 100 },
  { id: 'range', label: 'RANGE', get: mech => Math.max(...[mech.abilities.special, mech.abilities.secondary, mech.abilities.ultimate].filter(Boolean).map(ability => ability.range ?? ability.radius ?? ability.width ?? (ability.projectile ? ability.projectile.speed * ability.projectile.life : ability.distance ?? ability.attack?.width ?? 0))) },
  { id: 'technical', label: 'TECHNICAL DIFFICULTY', get: mech => MECH_PRESENTATION[mech.id].difficultyValue }
];
const statRanges = Object.fromEntries(statDefinitions.map(({ id, get }) => {
  const values = mechEntries.map(([, mech]) => get(mech));
  return [id, { min: Math.min(...values), max: Math.max(...values) }];
}));

function normalizedStat(mech, id) {
  const definition = statDefinitions.find(stat => stat.id === id);
  const { min, max } = statRanges[id];
  if (max === min) return 100;
  return 18 + (definition.get(mech) - min) / (max - min) * 82;
}

function renderRoster() {
  rosterGrid.replaceChildren(...mechEntries.map(([id, mech], index) => {
    const presentation = MECH_PRESENTATION[id];
    const card = document.createElement('button');
    card.className = 'roster-card';
    card.type = 'button';
    card.dataset.mechId = id;
    card.style.setProperty('--mech-color', mech.visual.color);
    card.style.setProperty('--mech-accent', mech.visual.accent);
    card.setAttribute('aria-label', `${mech.name}, ${mech.role}, ${presentation.difficulty} difficulty`);
    card.innerHTML = `<span class="roster-card-sigil"><i></i><b></b></span><span class="roster-card-index">FRAME // ${String(index + 1).padStart(2, '0')}</span><strong>${mech.name.toUpperCase()}</strong><small>${mech.role.toUpperCase()}</small><span class="roster-card-difficulty"><i></i>${presentation.difficulty.toUpperCase()}</span><span class="roster-owner-tags"></span>`;
    card.addEventListener('mouseenter', () => renderDossier(id));
    card.addEventListener('focus', () => renderDossier(id));
    card.addEventListener('mouseleave', () => renderDossier(selectors[`p${activePilot + 1}`].value));
    card.addEventListener('blur', () => renderDossier(selectors[`p${activePilot + 1}`].value));
    card.addEventListener('click', () => {
      selectors[`p${activePilot + 1}`].value = id;
      pilotLocks[activePilot] = false;
      renderSelection();
    });
    return card;
  }));
  document.querySelector('#roster-heading-count').textContent = `${String(mechEntries.length).padStart(2, '0')} UNITS`;
}

function renderDossier(id) {
  const mech = MECHS[id];
  const presentation = MECH_PRESENTATION[id];
  if (!mech || !presentation) throw new Error(`Missing mech select presentation data for "${id}".`);
  const accent = mech.visual.accent;
  const portrait = document.querySelector('#dossier-portrait');
  document.querySelector('.mech-dossier').style.setProperty('--mech-accent', accent);
  document.querySelector('.mech-dossier').style.setProperty('--mech-color', mech.visual.color);
  portrait.style.setProperty('--mech-color', mech.visual.color);
  portrait.style.setProperty('--mech-accent', accent);
  portrait.setAttribute('aria-label', `${mech.name} portrait preview`);
  document.querySelector('#dossier-index').textContent = `FRAME ${String(mechEntries.findIndex(([mechId]) => mechId === id) + 1).padStart(2, '0')} // ${mech.name.toUpperCase()}`;
  document.querySelector('#dossier-status').textContent = id === selectors[`p${activePilot + 1}`].value ? 'SELECTED FRAME' : 'PREVIEW';
  document.querySelector('#dossier-name').textContent = mech.name.toUpperCase();
  document.querySelector('#dossier-role').textContent = mech.role.toUpperCase();
  document.querySelector('#dossier-difficulty').textContent = presentation.difficulty.toUpperCase();
  document.querySelector('#portrait-role').textContent = mech.role.toUpperCase();
  document.querySelector('#dossier-passive').textContent = (mech.passive?.description ?? 'No passive ability').split(':')[0].toUpperCase();
  document.querySelector('#dossier-special').textContent = mech.abilities.special.name.toUpperCase();
  document.querySelector('#dossier-ultimate').textContent = mech.abilities.ultimate.name.toUpperCase();
  document.querySelector('#dossier-strengths').replaceChildren(...presentation.strengths.map(trait => {
    const item = document.createElement('li');
    item.textContent = trait;
    return item;
  }));
  document.querySelector('#dossier-weaknesses').replaceChildren(...presentation.weaknesses.map(trait => {
    const item = document.createElement('li');
    item.textContent = trait;
    return item;
  }));
  document.querySelector('#stat-list').replaceChildren(...statDefinitions.map(stat => {
    const row = document.createElement('div');
    row.className = `stat-row stat-${stat.id}`;
    const value = normalizedStat(mech, stat.id);
    row.innerHTML = `<span>${stat.label}</span><i><b style="width:${value}%"></b></i>${stat.id === 'technical' ? `<small>${presentation.difficulty.toUpperCase()}</small>` : ''}`;
    return row;
  }));
}

function renderSelection() {
  const p1 = MECHS[selectors.p1.value];
  const p2 = MECHS[selectors.p2.value];
  const cpu = Boolean(selectors.aiProfile.value);
  for (const [id, mech] of mechEntries) {
    const card = rosterGrid.querySelector(`[data-mech-id="${id}"]`);
    const ownerTags = card.querySelector('.roster-owner-tags');
    card.classList.toggle('is-p1', selectors.p1.value === id);
      card.classList.toggle('is-p2', selectors.p2.value === id && setupMode !== 'boss' && setupMode !== 'boss-rush');
    card.classList.toggle('is-active-pilot', selectors[`p${activePilot + 1}`].value === id);
    ownerTags.replaceChildren();
    if (selectors.p1.value === id) {
      const tag = document.createElement('i');
      tag.textContent = 'P1';
      ownerTags.append(tag);
    }
    if (selectors.p2.value === id && setupMode !== 'boss' && setupMode !== 'boss-rush') {
      const tag = document.createElement('i');
      tag.className = 'p2-tag';
      tag.textContent = setupMode === 'training' ? 'DUMMY' : cpu ? 'CPU' : 'P2';
      ownerTags.append(tag);
    }
  }
  document.querySelector('#p1-selected-name').textContent = p1.name.toUpperCase();
  document.querySelector('#p1-selected-role').textContent = p1.role.toUpperCase();
  document.querySelector('#p2-selected-name').textContent = p2.name.toUpperCase();
  document.querySelector('#p2-selected-role').textContent = p2.role.toUpperCase();
  document.querySelector('#p1-lock-label').textContent = 'PLAYER 1 // LOCAL';
  document.querySelector('#p2-lock-label').textContent = setupMode === 'boss' || setupMode === 'boss-rush'
    ? 'PVE // NOT IN MATCH'
    : setupMode === 'training' ? `TRAINING DUMMY // ${selectors.dummyBehavior.value.toUpperCase()}`
      : cpu ? `CPU // ${selectors.aiProfile.value.toUpperCase()}` : 'PLAYER 2 // LOCAL';
  for (const [index, mech] of [p1, p2].entries()) {
    const art = document.querySelector(`#p${index + 1}-mini-art`);
    art.style.setProperty('--mech-color', mech.visual.color);
    art.style.setProperty('--mech-accent', mech.visual.accent);
    const card = document.querySelector(index === 0 ? '.p1-lock' : '.p2-lock');
    card.classList.toggle('is-locked', pilotLocks[index]);
    const lockButton = document.querySelector(`#p${index + 1}-lock-button`);
    lockButton.textContent = pilotLocks[index]
      ? `LOCKED // ${index === 0 ? 'P1' : setupMode === 'training' ? 'DUMMY' : cpu ? 'CPU' : 'P2'}`
      : `LOCK ${index === 0 ? 'PLAYER 1' : setupMode === 'training' ? 'DUMMY' : cpu ? 'CPU' : 'PLAYER 2'}`;
    lockButton.setAttribute('aria-pressed', String(pilotLocks[index]));
  }
  const singlePilotMode = setupMode === 'boss' || setupMode === 'boss-rush';
  document.querySelector('.p2-lock').classList.toggle('hidden', singlePilotMode);
  document.querySelector('.selection-command').classList.toggle('boss-selection', singlePilotMode);
  document.querySelector('#edit-p2-button').classList.toggle('hidden', singlePilotMode);
  document.querySelector('#edit-p2-button').disabled = singlePilotMode;
  document.querySelector('#edit-p1-button').classList.toggle('active-slot', activePilot === 0);
  document.querySelector('#edit-p2-button').classList.toggle('active-slot', activePilot === 1);
  document.querySelector('#p2-controls').classList.toggle('hidden', singlePilotMode);
  document.querySelector('#p2-controls').innerHTML = singlePilotMode
    ? ''
    : setupMode === 'training'
      ? `<div><b>DUMMY</b> ${selectors.dummyBehavior.value.toUpperCase()} // SHARED PLAYER INPUT AND COMBAT</div>`
    : cpu
      ? `<div><b>CPU</b> ${selectors.aiProfile.value.toUpperCase()} AUTONOMOUS PILOT</div>`
      : '<div><b>P2</b> ARROWS MOVE <i>K ATTACK</i> <i>L SPECIAL</i> <i>O SECONDARY*</i> <i>; ULTIMATE</i></div>';
  const isBossSetup = setupMode === 'boss' || setupMode === 'boss-rush';
  const canDeploy = pilotLocks[0] && (isBossSetup || pilotLocks[1]);
  const deployButton = document.querySelector('#start-button');
  deployButton.disabled = !canDeploy;
  deployButton.innerHTML = canDeploy
    ? `${setupMode === 'boss' ? 'DEPLOY TO BOSS BATTLE' : setupMode === 'boss-rush' ? 'DEPLOY TO BOSS RUSH' : setupMode === 'training' ? 'ENTER TRAINING' : 'DEPLOY TO ARENA'} <span>→</span>`
    : `LOCK ${pilotLocks[0] ? (isBossSetup ? 'TARGET' : cpu ? 'CPU' : 'PLAYER 2') : 'PLAYER 1'} TO CONTINUE <span>→</span>`;
  renderDossier(selectors[`p${activePilot + 1}`].value);
}

function lockPilot(index) {
  if (index === 1 && (setupMode === 'boss' || setupMode === 'boss-rush')) return;
  const card = document.querySelector(index === 0 ? '.p1-lock' : '.p2-lock');
  pilotLocks[index] = !pilotLocks[index];
  card.classList.remove('is-locking');
  void card.offsetWidth;
  if (pilotLocks[index]) card.classList.add('is-locking');
  renderSelection();
}

function showScreen(screenId) {
  const nextScreen = document.getElementById(screenId);
  if (!nextScreen) throw new Error(`Unknown menu screen: ${screenId}`);
  const transitionId = ++screenTransitionId;
  const activeScreen = menuScreens.find(screen => screen.classList.contains('is-active'));
  if (activeScreen === nextScreen) {
    if (activeScreen.classList.contains('is-leaving')) {
      activeScreen.classList.remove('is-leaving');
      activeScreen.setAttribute('aria-hidden', 'false');
    }
    return;
  }
  if (activeScreen) {
    activeScreen.classList.add('is-leaving');
    activeScreen.setAttribute('aria-hidden', 'true');
  }
  window.setTimeout(() => {
    if (transitionId !== screenTransitionId) return;
    for (const screen of menuScreens) {
      screen.classList.remove('is-active', 'is-leaving');
      screen.setAttribute('aria-hidden', 'true');
    }
    nextScreen.classList.add('is-active');
    nextScreen.setAttribute('aria-hidden', 'false');
    nextScreen.querySelector('button, select, input')?.focus();
  }, document.querySelector('.shell').classList.contains('reduced-motion') ? 0 : 170);
}

function showMenuOverlay() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.inert = false;
}

function hideMenuOverlay() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.inert = true;
}

function openMenu(screenId = 'main-menu-screen') {
  game.ui.hideVictory();
  game.ui.hidePause();
  document.querySelector('#resume-main-menu-button').classList.toggle('hidden', !game.paused);
  shell.classList.add('menu-open');
  showMenuOverlay();
  showScreen(screenId);
}

function renderPilotProfile() {
  const snapshot = profile.getSnapshot();
  document.querySelector('#profile-callsign').value = snapshot.callsign;
  const favorite = snapshot.favoriteMechId ? MECHS[snapshot.favoriteMechId]?.name : null;
  document.querySelector('#profile-favorite-mech').textContent = favorite ?? 'NO MATCH DATA';
  const statElements = {
    matchesPlayed: 'profile-matches',
    wins: 'profile-wins',
    losses: 'profile-losses',
    damageDealt: 'profile-damage-dealt',
    damageTaken: 'profile-damage-taken',
    kos: 'profile-kos',
    bossesDefeated: 'profile-bosses',
    trainingSessions: 'profile-training'
  };
  for (const [stat, elementId] of Object.entries(statElements)) {
    const value = snapshot.stats[stat];
    document.querySelector(`#${elementId}`).textContent = stat.startsWith('damage')
      ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
      : value.toLocaleString();
  }
  const rushStats = snapshot.stats.bossRush;
  const rushElements = {
    runs: 'profile-rush-runs',
    clears: 'profile-rush-clears',
    bossesCleared: 'profile-rush-bosses',
    deaths: 'profile-rush-deaths'
  };
  for (const [stat, elementId] of Object.entries(rushElements)) {
    document.querySelector(`#${elementId}`).textContent = rushStats[stat].toLocaleString();
  }
  document.querySelector('#profile-rush-damage').textContent =
    rushStats.damageTaken.toLocaleString(undefined, { maximumFractionDigits: 1 });
  document.querySelector('#profile-rush-best-time').textContent =
    rushStats.bestTime === null ? '—' : formatRunTime(rushStats.bestTime);
  document.querySelector('#profile-rush-highest-difficulty').textContent =
    rushStats.highestDifficultyCleared?.toUpperCase() ?? '—';
  for (const difficulty of ['normal', 'hard', 'extreme']) {
    const bestTime = rushStats.bestTimes[difficulty];
    document.querySelector(`#profile-rush-${difficulty}`).textContent =
      bestTime === null ? '—' : formatRunTime(bestTime);
  }
  const mostPlayed = snapshot.mostPlayedMechs;
  const list = document.querySelector('#most-played-mechs');
  list.replaceChildren();
  if (!mostPlayed.length) {
    const empty = document.createElement('li');
    empty.className = 'profile-empty';
    empty.textContent = 'Complete a match to build your mech record.';
    list.append(empty);
    return;
  }
  for (const [index, mech] of mostPlayed.entries()) {
    const item = document.createElement('li');
    item.innerHTML = `<span class="mech-rank">${String(index + 1).padStart(2, '0')}</span><b></b><span class="mech-usage-count"></span>`;
    item.querySelector('b').textContent = mech.name.toUpperCase();
    item.querySelector('.mech-usage-count').textContent = `${mech.count} MATCH${mech.count === 1 ? '' : 'ES'}`;
    item.style.setProperty('--mech-accent', MECHS[mech.id].visual.accent);
    list.append(item);
  }
}

function formatRunTime(seconds) {
  const tenths = Math.floor(seconds * 10);
  const minutes = Math.floor(tenths / 600);
  const wholeSeconds = Math.floor(tenths / 10) % 60;
  return `${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${tenths % 10}`;
}

function openSetup(mode) {
  setupMode = mode;
  pilotLocks[0] = false;
  pilotLocks[1] = false;
  activePilot = 0;
  shell.classList.add('menu-open');
  if (mode !== 'training' && mode !== 'boss' && mode !== 'boss-rush') {
    selectors.mode.value = mode;
  }
  updateSetupMode();
  document.querySelector('#setup-eyebrow').textContent = mode === 'boss'
    ? 'PVE // TITAN ENCOUNTER'
    : mode === 'boss-rush' ? 'SEQUENTIAL PVE // BOSS RUSH'
    : mode === 'training' ? 'PRACTICE SIMULATION // TRAINING BAY'
      : 'MATCH CONFIGURATION // LOCAL OR CPU';
  document.querySelector('#setup-title').innerHTML = mode === 'boss'
    ? 'CHALLENGE THE<br><em>WAR MACHINE</em>'
    : mode === 'boss-rush' ? 'SURVIVE THE<br><em>BOSS RUSH</em>'
    : mode === 'training' ? 'ENTER THE<br><em>MECH LAB</em>'
      : 'DEPLOY YOUR<br><em>MECHS</em>';
  document.querySelector('#start-button').innerHTML = mode === 'boss'
    ? 'BEGIN BOSS BATTLE <span>→</span>'
    : mode === 'boss-rush' ? 'BEGIN BOSS RUSH <span>→</span>'
    : mode === 'training' ? 'ENTER TRAINING <span>→</span>'
      : 'DEPLOY MECHS <span>→</span>';
  renderSelection();
  showScreen('setup-screen');
  showMenuOverlay();
}

function updateSetupMode() {
  const bossMode = setupMode === 'boss';
  const bossRushMode = setupMode === 'boss-rush';
  const pveMode = bossMode || bossRushMode;
  const trainingMode = setupMode === 'training';
  selectors.p2.disabled = pveMode;
  selectors.aiProfile.disabled = pveMode || trainingMode;
  selectors.arena.disabled = pveMode;
  document.querySelector('#boss-select-row').classList.toggle('hidden', !bossMode);
  document.querySelector('#boss-rush-difficulty-row').classList.toggle('hidden', !bossRushMode);
  document.querySelector('#boss-rush-order-row').classList.toggle('hidden', !bossRushMode);
  document.querySelector('#dummy-behavior-row').classList.toggle('hidden', !trainingMode);
  document.querySelector('#arena-select-row').classList.toggle('hidden', pveMode);
  document.querySelector('#mode-select-row').classList.toggle('hidden', pveMode || trainingMode);
  document.querySelector('#ai-select-row').classList.toggle('hidden', pveMode || trainingMode);
  document.querySelector('#setup-description').textContent = bossMode
    ? 'Choose your mech and target. Each war machine guards its own arena.'
    : bossRushMode
      ? 'Clear every registered boss in sequence. Between fights, your frame is restored and your ultimate recharged.'
    : trainingMode
      ? 'Choose your mech, arena, and dummy behavior. Practice against the shared combat simulation.'
      : 'Choose a frame for each active pilot. Lock in to deploy.';
}

document.querySelector('#battle-menu-button').addEventListener('click', () => openSetup('stock'));
document.querySelector('#boss-menu-button').addEventListener('click', () => openSetup('boss'));
document.querySelector('#boss-rush-menu-button').addEventListener('click', () => {
  openSetup('boss-rush');
});
document.querySelector('#training-menu-button').addEventListener('click', () => {
  openSetup('training');
});
document.querySelector('#options-menu-button').addEventListener('click', () => showScreen('options-screen'));
document.querySelector('#profile-menu-button').addEventListener('click', () => {
  renderPilotProfile();
  showScreen('profile-screen');
});
document.querySelector('#save-callsign-button').addEventListener('click', () => {
  profile.setCallsign(document.querySelector('#profile-callsign').value);
  renderPilotProfile();
});
renderRoster();
renderSelection();
document.querySelector('#edit-p1-button').addEventListener('click', () => {
  activePilot = 0;
  renderSelection();
});
document.querySelector('#edit-p2-button').addEventListener('click', () => {
  if (setupMode === 'boss') return;
  activePilot = 1;
  renderSelection();
});
document.querySelector('#p1-lock-button').addEventListener('click', () => lockPilot(0));
document.querySelector('#p2-lock-button').addEventListener('click', () => lockPilot(1));
selectors.aiProfile.addEventListener('change', () => {
  pilotLocks[1] = false;
  renderSelection();
});
document.querySelector('#resume-main-menu-button').addEventListener('click', () => {
  game.togglePause();
  shell.classList.remove('menu-open');
  hideMenuOverlay();
  canvas.focus();
});
for (const button of document.querySelectorAll('[data-menu-back]')) {
  button.addEventListener('click', () => openMenu(button.dataset.menuBack));
}
document.querySelector('#screen-shake-option').addEventListener('change', event => {
  game.camera.setShakeEnabled(event.currentTarget.checked);
});
document.querySelector('#reduced-motion-option').addEventListener('change', event => {
  shell.classList.toggle('reduced-motion', event.currentTarget.checked);
});

document.querySelector('#start-button').addEventListener('click', () => {
  const trainingOptions = {
    infiniteStocks: document.querySelector('#infinite-stocks-option').checked,
    infiniteUltimate: document.querySelector('#infinite-ultimate-option').checked,
    infiniteCooldowns: document.querySelector('#infinite-cooldowns-option').checked
  };
  game.startMatch({
    arenaId: selectors.arena.value,
    mechIds: [selectors.p1.value, selectors.p2.value],
    mode: setupMode === 'boss' ? 'boss'
      : setupMode === 'boss-rush' ? 'boss-rush'
        : setupMode === 'training' ? 'training' : selectors.mode.value,
    aiProfile: setupMode === 'training' ? '' : selectors.aiProfile.value,
    bossId: selectors.boss.value,
    difficulty: selectors.bossRushDifficulty.value,
    bossIds: setupMode === 'boss-rush' ? Object.keys(BOSSES) : undefined,
    dummyBehavior: selectors.dummyBehavior.value,
    trainingOptions
  });
  shell.classList.remove('menu-open');
  hideMenuOverlay();
  canvas.focus();
});
selectors.bossRushDifficulty.value = 'normal';
document.querySelector('#play-again-button').addEventListener('click', () => {
  if (!game.matchConfig) return;
  game.startMatch(game.matchConfig);
  shell.classList.remove('menu-open');
  hideMenuOverlay();
  canvas.focus();
});
document.querySelector('#change-mech-button').addEventListener('click', () => {
  if (!game.matchConfig) return;
  game.ui.hideVictory();
  selectors.p1.value = game.matchConfig.mechIds[0];
  selectors.bossRushDifficulty.value = game.matchConfig.difficulty ?? 'normal';
  openSetup('boss-rush');
});
document.querySelector('#continue-rush-button').addEventListener('click', () => game.continueBossRush());
document.querySelector('#main-menu-button').addEventListener('click', () => {
  openMenu();
});
document.querySelector('#resume-button').addEventListener('click', () => game.togglePause());
document.querySelector('#pause-menu-button').addEventListener('click', () => {
  game.ui.hidePause();
  if (game.matchConfig) {
    if (game.matchConfig.mode !== 'boss') selectors.arena.value = game.matchConfig.arenaId;
    selectors.p1.value = game.matchConfig.mechIds[0];
    selectors.p2.value = game.matchConfig.mechIds[1] ?? selectors.p2.value;
    const setupSelection = game.matchConfig.mode === 'boss' ? 'boss'
      : game.matchConfig.mode === 'boss-rush' ? 'boss-rush'
      : game.matchConfig.mode === 'training' ? 'training' : game.matchConfig.mode;
    if (setupSelection !== 'training' && setupSelection !== 'boss-rush') {
      selectors.mode.value = setupSelection === 'boss' ? 'stock' : setupSelection;
    }
    selectors.aiProfile.value = game.matchConfig.aiProfile;
    selectors.boss.value = game.matchConfig.bossId ?? selectors.boss.value;
    selectors.bossRushDifficulty.value = game.matchConfig.difficulty ?? 'normal';
    selectors.dummyBehavior.value = game.matchConfig.dummyBehavior ?? 'idle';
    openSetup(setupSelection);
  } else openMenu();
});
document.querySelector('#restart-button').addEventListener('click', () => {
  if (game.matchConfig) game.startMatch(game.matchConfig);
  else openMenu();
});
document.querySelector('#pause-button').addEventListener('click', () => game.togglePause());
document.querySelector('#reset-position-button').addEventListener('click', () => game.resetTrainingPositions());
document.querySelector('#step-frame-button').addEventListener('click', () => game.stepPausedFrames(1));
document.querySelector('#step-10-frames-button').addEventListener('click', () => game.stepPausedFrames(10));
for (const [id, option] of [
  ['infinite-stocks-option', 'infiniteStocks'],
  ['infinite-ultimate-option', 'infiniteUltimate'],
  ['infinite-cooldowns-option', 'infiniteCooldowns']
]) {
  document.querySelector(`#${id}`).addEventListener('change', event => {
    if (game.trainingManager) {
      game.trainingManager.options[option] = event.currentTarget.checked;
      game.matchConfig.trainingOptions[option] = event.currentTarget.checked;
    }
  });
}
selectors.dummyBehavior.addEventListener('change', () => {
  if (setupMode === 'training') pilotLocks[1] = false;
  if (game.trainingManager) {
    game.trainingManager.behavior = selectors.dummyBehavior.value;
    game.matchConfig.dummyBehavior = selectors.dummyBehavior.value;
  }
  if (setupMode === 'training') renderSelection();
});
window.addEventListener('keydown', event => {
  if (event.key === 'F3') {
    event.preventDefault();
    game.ui.toggleAIDebug();
    game.ui.update(game, 0);
    return;
  }
  if (event.key !== 'Escape') return;
  if (!overlay.classList.contains('hidden')) {
    const activeScreen = menuScreens.find(screen => screen.classList.contains('is-active'));
    if (activeScreen && activeScreen.id !== 'main-menu-screen') openMenu();
    return;
  }
  game.togglePause();
});
game.start();
