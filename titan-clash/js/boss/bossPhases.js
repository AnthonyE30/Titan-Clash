export class BossPhaseManager {
  constructor(boss, phases) {
    this.boss = boss;
    this.phases = phases;
    this.nextPhaseIndex = 1;
  }

  update(game) {
    while (this.nextPhaseIndex < this.phases.length) {
      const next = this.phases[this.nextPhaseIndex];
      if (this.boss.health / this.boss.maxHealth > next.healthThreshold) return;
      this.boss.changePhase(this.nextPhaseIndex, game);
      this.nextPhaseIndex++;
    }
  }
}
