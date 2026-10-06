export class BossController {
  constructor(profile = {}) {
    this.profile = {
      preferredRange: 250,
      retreatRange: 105,
      decisionInterval: .28,
      ...profile
    };
    this.decisionTimer = 0;
    this.actionCursor = 0;
  }

  reset() {
    this.decisionTimer = 0;
    this.actionCursor = 0;
  }

  update(boss, game, dt) {
    const target = game.fighters.find(fighter => fighter.stocks > 0 && fighter.respawnTime <= 0);
    if (!target || boss.state !== 'active') {
      boss.issueCommand({ type: 'move', direction: 0 }, game);
      return;
    }

    const bossCenter = boss.x + boss.width / 2;
    const targetCenter = target.x + target.width / 2;
    const distance = Math.abs(targetCenter - bossCenter);
    const directionToTarget = Math.sign(targetCenter - bossCenter);
    const minRange = boss.enraged ? this.profile.retreatRange * .55 : this.profile.retreatRange;
    const maxRange = boss.enraged ? this.profile.preferredRange * 1.4 : this.profile.preferredRange;
    const platform = game.arena.platforms.find(item => item.type === 'main') ?? game.arena.platforms[0];
    const recoveryMargin = boss.definition.movement.edgeRecoveryMargin ?? boss.width * .7;
    const platformLeft = platform?.x ?? 0;
    const platformRight = platform ? platform.x + platform.width - boss.width : game.arena.width - boss.width;
    const nearLeftEdge = boss.x < platformLeft + recoveryMargin;
    const nearRightEdge = boss.x > platformRight - recoveryMargin;
    const moveDirection = nearLeftEdge ? 1
      : nearRightEdge ? -1
        : distance > maxRange ? directionToTarget
          : distance < minRange ? -directionToTarget : 0;
    boss.issueCommand({ type: 'move', direction: moveDirection }, game);

    const actionIds = boss.phase.actions;
    for (const actionId of actionIds) {
      const trigger = boss.actions.get(actionId)?.definition.trigger;
      if (trigger && trigger !== 'target-attack') {
        throw new Error(`Unknown boss action trigger: ${trigger}`);
      }
    }
    if (!actionIds.length) return;
    const targetAttackActive = target.currentAttack &&
      target.currentAttack.elapsed < target.currentAttack.startup + target.currentAttack.active;
    if (targetAttackActive && !boss.telegraph && boss.phaseLock <= 0) {
      for (const actionId of actionIds) {
        const action = boss.actions.get(actionId);
        if (!action || action.definition.trigger !== 'target-attack' || !action.ready ||
            distance < (action.definition.minRange ?? 0) ||
            distance > (action.definition.maxRange ?? Infinity)) continue;
        if (boss.issueCommand({ type: 'action', actionId, target }, game)) return;
      }
    }

    this.decisionTimer = Math.max(0, this.decisionTimer - dt);
    if (this.decisionTimer > 0 || boss.telegraph || boss.phaseLock > 0) return;
    this.decisionTimer = boss.enraged
      ? this.profile.decisionInterval * .62
      : this.profile.decisionInterval;


    for (let offset = 0; offset < actionIds.length; offset++) {
      const index = (this.actionCursor + offset) % actionIds.length;
      const action = boss.actions.get(actionIds[index]);
      if (!action || action.definition.trigger || !action.ready || distance < (action.definition.minRange ?? 0) ||
          distance > (action.definition.maxRange ?? Infinity)) continue;
      if (action.definition.kind === 'charge') {
        const chargeDirection = directionToTarget || boss.facing;
        const travelDistance = (action.definition.speed ?? boss.definition.movement.speed) *
          (action.definition.duration ?? .5);
        if ((chargeDirection < 0 && boss.x - travelDistance < platformLeft) ||
            (chargeDirection > 0 && boss.x + boss.width + travelDistance > platformRight + boss.width)) continue;
      }
      if (boss.issueCommand({ type: 'action', actionId: action.definition.id, target }, game)) {
        this.actionCursor = (index + 1) % actionIds.length;
        break;
      }
    }
  }
}
