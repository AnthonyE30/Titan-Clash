export class UIManager {
  constructor() {
    this.nodes = {
      timer: document.querySelector('#timer'),
      state: document.querySelector('#round-state'),
      toast: document.querySelector('#toast'),
      arena: document.querySelector('#arena-label'),
      matchMode: document.querySelector('#match-mode-label'),
      victoryOverlay: document.querySelector('#victory-overlay'),
      victoryTitle: document.querySelector('#victory-title'),
      victoryMessage: document.querySelector('#victory-message'),
      playAgainLabel: document.querySelector('#play-again-label'),
      rushResults: document.querySelector('#rush-result-details'),
      rushGrade: document.querySelector('#rush-result-grade'),
      rushScore: document.querySelector('#rush-result-score'),
      rushBosses: document.querySelector('#rush-result-bosses'),
      rushTime: document.querySelector('#rush-result-time'),
      rushDamage: document.querySelector('#rush-result-damage'),
      rushDeaths: document.querySelector('#rush-result-deaths'),
      changeMechButton: document.querySelector('#change-mech-button'),
      rushIntermission: document.querySelector('#rush-intermission'),
      rushDefeated: document.querySelector('#rush-defeated-boss'),
      rushProgress: document.querySelector('#rush-intermission-progress'),
      rushElapsed: document.querySelector('#rush-intermission-time'),
      rushDamageTaken: document.querySelector('#rush-intermission-damage'),
      rushDeathsCount: document.querySelector('#rush-intermission-deaths'),
      pauseOverlay: document.querySelector('#pause-overlay'),
      trainingHud: document.querySelector('#training-hud'),
      frameStepControls: document.querySelector('#frame-step-controls'),
      trainingDamage: document.querySelector('#training-damage'),
      trainingCombo: document.querySelector('#training-combo'),
      trainingBestCombo: document.querySelector('#training-best-combo'),
      trainingDps: document.querySelector('#training-dps'),
      trainingPlayerPassive: document.querySelector('#training-player-passive'),
      trainingPlayerCooldowns: document.querySelector('#training-player-cooldowns'),
      trainingDummyPassive: document.querySelector('#training-dummy-passive'),
      trainingDummyCooldowns: document.querySelector('#training-dummy-cooldowns'),
      playerTwoCard: document.querySelector('#p2-card'),
      bossCard: document.querySelector('#boss-card'),
      bossName: document.querySelector('#boss-name'),
      bossPhase: document.querySelector('#boss-phase'),
      bossHealth: document.querySelector('#boss-health'),
      bossHealthBar: document.querySelector('#boss-health-bar'),
      aiDebugOverlay: document.querySelector('#ai-debug-overlay'),
      aiDebugBehavior: document.querySelector('#ai-debug-behavior'),
      aiDebugTarget: document.querySelector('#ai-debug-target'),
      aiDebugThreat: document.querySelector('#ai-debug-threat'),
      aiDebugDecision: document.querySelector('#ai-debug-decision'),
      aiDebugTendencies: document.querySelector('#ai-debug-tendencies')
    };
    this.toastTimer = 0;
    this.aiDebugEnabled = false;
  }

  toggleAIDebug() {
    this.aiDebugEnabled = !this.aiDebugEnabled;
    return this.aiDebugEnabled;
  }

  setFighter(index, fighter) {
    const prefix = `p${index + 1}`;
    document.querySelector(`#${prefix}-name`).textContent = fighter.config.name.toUpperCase();
    document.querySelector(`#${prefix}-role`).textContent = fighter.config.role.toUpperCase();
    const abilityNode = document.querySelector(`#${prefix}-ability`);
    abilityNode.textContent = fighter.config.abilities.special.name.toUpperCase();
    const controls = fighter.controls;
    abilityNode.title = [
      `${this.controlLabel(controls.special)}: ${fighter.config.abilities.special.name}`,
      fighter.config.abilities.secondary && `${this.controlLabel(controls.secondary)}: ${fighter.config.abilities.secondary.name}`
    ].filter(Boolean).join(' · ');
    this.updateFighter(index, fighter);
  }

  controlLabel(key) {
    return key === 'mouse-left' ? 'Left click' :
      key === 'mouse-right' ? 'Right click' : key.toUpperCase();
  }

  updateFighter(index, fighter) {
    const prefix = `p${index + 1}`;
    const damage = Math.floor(fighter.damage);
    document.querySelector(`#${prefix}-damage`).textContent = damage;
    document.querySelector(`#${prefix}-meter`).style.width = `${Math.min(100, damage / 2.2)}%`;
    document.querySelector(`#${prefix}-stocks`).textContent = Array.from({ length: Math.max(0, fighter.stocks) }, () => '◆').join(' ') || '—';
    document.querySelector(`#${prefix}-stocks`).setAttribute('aria-label', `${fighter.stocks} stocks remaining`);
    document.querySelector(`#${prefix}-ultimate`).textContent = fighter.ultimateReady ? 'ULT READY' : 'ULT USED';
  }

  setBoss(boss) {
    this.nodes.playerTwoCard.classList.toggle('hidden', Boolean(boss));
    this.nodes.bossCard.classList.toggle('hidden', !boss);
    if (boss) {
      this.nodes.bossName.textContent = boss.name.toUpperCase();
      this.nodes.bossPhase.textContent = boss.phase.name.toUpperCase();
      this.nodes.bossHealth.textContent = `${boss.maxHealth} / ${boss.maxHealth}`;
      this.nodes.bossHealthBar.style.width = '100%';
      this.nodes.bossCard.setAttribute('aria-label', `${boss.name}, ${boss.maxHealth} of ${boss.maxHealth} health`);
    }
  }

  update(game, dt) {
    const rush = game.bossRush;
    this.nodes.timer.textContent = game.matchConfig?.mode === 'timed' || rush
      ? this.formatTime(rush ? game.time : game.roundTime)
      : '∞';
    this.nodes.state.textContent = game.paused ? 'PAUSED' : game.bossRush?.intermission ? 'INTERMISSION' : game.roundOver ? 'RESULT'
      : rush ? `RUSH ${Math.min(rush.bossesCleared + 1, rush.bossIds.length)}/${rush.bossIds.length}` : 'FIGHT!';
    this.nodes.arena.textContent = game.matchConfig
      ? game.arena.name.toUpperCase()
      : 'TACTICAL NETWORK';
    this.nodes.matchMode.textContent = game.matchConfig
      ? game.matchConfig.mode === 'boss' ? 'BOSS ENGAGEMENT'
        : game.matchConfig.mode === 'boss-rush' ? `BOSS RUSH // ${game.matchConfig.difficulty.toUpperCase()}`
        : game.matchConfig.mode === 'training' ? 'TRAINING SIMULATION'
        : game.matchConfig.mode === 'timed' ? 'TIMED MATCH'
          : game.matchConfig.mode === 'last' ? 'LAST MECH STANDING'
            : 'STOCK MATCH'
      : 'SELECT MODE';
    game.fighters.forEach((fighter, index) => this.updateFighter(index, fighter));
    const training = game.trainingManager;
    this.nodes.trainingHud.classList.toggle('hidden', !training);
    if (!training) this.nodes.trainingHud.open = false;
    this.nodes.frameStepControls.classList.toggle('hidden', !training || !game.paused);
    if (training) {
      document.querySelector('#p2-role').textContent = `DUMMY // ${training.behavior.toUpperCase()}`;
    }
    if (training && game.fighters.length > 1) {
      const [player, dummy] = game.fighters;
      this.nodes.trainingDamage.textContent = String(Math.floor(dummy.damage));
      this.nodes.trainingCombo.textContent = String(player.combo);
      this.nodes.trainingBestCombo.textContent = String(training.highestCombo);
      this.nodes.trainingDps.textContent = String(Math.round(training.getDps(game.time)));
      this.nodes.trainingPlayerPassive.textContent = this.passiveReadout(player);
      this.nodes.trainingDummyPassive.textContent = this.passiveReadout(dummy);
      this.nodes.trainingPlayerCooldowns.textContent = this.cooldownReadout(player);
      this.nodes.trainingDummyCooldowns.textContent = this.cooldownReadout(dummy);
    }
    this.nodes.playerTwoCard.classList.toggle('hidden', Boolean(game.boss));
    this.nodes.bossCard.classList.toggle('hidden', !game.boss);
    if (game.boss) {
      this.nodes.bossName.textContent = game.boss.name.toUpperCase();
      this.nodes.bossPhase.textContent = game.boss.phase?.name.toUpperCase() ?? '';
      if (rush) {
        this.nodes.bossPhase.textContent =
          `RUSH ${Math.min(rush.index + 1, rush.bossIds.length)}/${rush.bossIds.length} // ${this.nodes.bossPhase.textContent}`;
      }
      const health = Math.max(0, game.boss.health);
      this.nodes.bossHealth.textContent = `${Math.ceil(health)} / ${game.boss.maxHealth}`;
      this.nodes.bossHealthBar.style.width = `${health / game.boss.maxHealth * 100}%`;
      this.nodes.bossCard.setAttribute('aria-label', `${game.boss.name}, ${Math.ceil(health)} of ${game.boss.maxHealth} health`);
    }
    const aiController = game.aiControllers[0]?.controller;
    const aiActive = aiController && !game.roundOver && !game.bossRush?.intermission &&
      game.boss?.state !== 'intro';
    this.nodes.aiDebugOverlay.hidden = !this.aiDebugEnabled || !aiActive;
    if (this.aiDebugEnabled && aiActive) {
      const debug = aiController.getDebugSnapshot();
      this.nodes.aiDebugBehavior.textContent = debug.behavior;
      this.nodes.aiDebugTarget.textContent = debug.target;
      this.nodes.aiDebugThreat.textContent = `${debug.threatLevel} // ${debug.threat}`;
      this.nodes.aiDebugDecision.textContent = debug.decisionState;
      this.nodes.aiDebugTendencies.textContent =
        `J${debug.tendencies.jumps} A${debug.tendencies.attacks} S${debug.tendencies.specials} D${debug.tendencies.dashes}`;
    }
    this.toastTimer = Math.max(0, this.toastTimer - dt);
    this.nodes.toast.classList.toggle('show', this.toastTimer > 0);
  }

  passiveReadout(fighter) {
    const names = fighter.passives.passives.map(passive => passive.name.toUpperCase()).join(' + ') || 'NO PASSIVE';
    const active = Object.entries(fighter.passiveState)
      .filter(([, value]) => value === true || (typeof value === 'number' && value > 0))
      .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toUpperCase()}${typeof value === 'number' ? ` ${value.toFixed(1)}` : ''}`);
    for (const [key, value] of Object.entries(fighter.passiveModifiers)) {
      if (value !== 1) active.push(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()} ${value.toFixed(2)}`);
    }
    return active.length ? `${names} // ${active.join(', ')}` : names;
  }

  cooldownReadout(fighter) {
    const attack = Math.max(0, fighter.attackCooldown).toFixed(1);
    const special = Math.max(0, fighter.specialCooldown).toFixed(1);
    const dash = Math.max(0, fighter.dashCooldown).toFixed(1);
    return `ATK ${attack}S · SPC ${special}S · DASH ${dash}S · ULT ${fighter.ultimateReady ? 'READY' : 'USED'}`;
  }

  announce(text, duration = 1.2) {
    this.nodes.toast.textContent = text;
    this.toastTimer = duration;
  }

  showVictory(title, message) {
    this.nodes.victoryTitle.textContent = title;
    this.nodes.victoryMessage.textContent = message;
    this.nodes.playAgainLabel.textContent = 'PLAY AGAIN';
    this.nodes.rushResults.classList.add('hidden');
    this.nodes.changeMechButton.classList.add('hidden');
    this.nodes.victoryOverlay.classList.remove('hidden');
    this.nodes.victoryOverlay.setAttribute('aria-hidden', 'false');
  }

  showBossRushResult(result) {
    this.showVictory(result.cleared ? 'RUSH COMPLETE' : 'RUSH FAILED', `${result.difficulty.toUpperCase()} // FINAL RUN RECORD`);
    this.nodes.playAgainLabel.textContent = 'RETRY';
    this.nodes.rushGrade.textContent = result.grade;
    this.nodes.rushScore.textContent = `${result.score} POINTS`;
    this.nodes.rushBosses.textContent = `${result.bossesCleared} / ${result.bossCount}`;
    this.nodes.rushTime.textContent = this.formatRunTime(result.time);
    this.nodes.rushDamage.textContent = Math.round(result.damageTaken).toLocaleString();
    this.nodes.rushDeaths.textContent = result.deaths.toLocaleString();
    this.nodes.rushResults.classList.remove('hidden');
    this.nodes.changeMechButton.classList.remove('hidden');
  }

  showRushIntermission({ bossName, bossesCleared, bossCount, time, damageTaken, deaths }) {
    this.nodes.rushDefeated.textContent = bossName.toUpperCase();
    this.nodes.rushProgress.textContent = `${bossesCleared} / ${bossCount} BOSSES CLEARED`;
    this.nodes.rushElapsed.textContent = this.formatRunTime(time);
    this.nodes.rushDamageTaken.textContent = Math.round(damageTaken).toLocaleString();
    this.nodes.rushDeathsCount.textContent = deaths.toLocaleString();
    this.nodes.rushIntermission.classList.remove('hidden');
    this.nodes.rushIntermission.setAttribute('aria-hidden', 'false');
  }

  hideRushIntermission() {
    this.nodes.rushIntermission.classList.add('hidden');
    this.nodes.rushIntermission.setAttribute('aria-hidden', 'true');
  }

  hideVictory() {
    this.nodes.victoryOverlay.classList.add('hidden');
    this.nodes.victoryOverlay.setAttribute('aria-hidden', 'true');
    this.nodes.rushResults.classList.add('hidden');
    this.nodes.changeMechButton.classList.add('hidden');
  }

  showPause() {
    this.nodes.pauseOverlay.classList.remove('hidden');
    this.nodes.pauseOverlay.setAttribute('aria-hidden', 'false');
  }

  hidePause() {
    this.nodes.pauseOverlay.classList.add('hidden');
    this.nodes.pauseOverlay.setAttribute('aria-hidden', 'true');
  }

  formatTime(seconds) {
    const remaining = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  }

  formatRunTime(seconds) {
    const tenths = Math.max(0, Math.floor(seconds * 10));
    const minutes = Math.floor(tenths / 600);
    const wholeSeconds = Math.floor(tenths / 10) % 60;
    return `${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${tenths % 10}`;
  }
}
