import { ArenaEvent } from '../arenaEvent.js';
import { overlaps } from '../../collision.js';
import { drawWarningLabel, eventAttack, severityColors } from './shared.js';

export class MissileBarrageEvent extends ArenaEvent {
  onStart(context) {
    this.missiles = [];
    this.fireTimer = 0;
    this.targetCursor = 0;
    this.warningTargets = context.game.fighters
      .filter(fighter => fighter.stocks > 0)
      .map(fighter => ({
        x: fighter.x + fighter.width / 2 - 44,
        y: fighter.y + fighter.height / 2 - 16,
        width: 88,
        height: 32,
        warning: true
      }));
  }

  onUpdate(dt, context) {
    if (!this.isActive) return;
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.launchMissile(context);
      this.fireTimer = this.definition.fireInterval ?? .8;
    }
    for (const missile of this.missiles) {
      if (missile.warning > 0) {
        missile.warning = Math.max(0, missile.warning - dt);
        continue;
      }
      const dx = missile.targetX - (missile.x + missile.width / 2);
      const dy = missile.targetY - (missile.y + missile.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const speed = missile.speed;
      missile.vx = dx / distance * speed;
      missile.vy = dy / distance * speed;
      missile.x += missile.vx * dt;
      missile.y += missile.vy * dt;
      for (const fighter of context.game.fighters) {
        if (fighter.stocks <= 0 || missile.hit || !overlaps(missile, fighter)) continue;
        missile.hit = this.hit(fighter, eventAttack(this), missile.x + missile.width / 2, context, 1);
      }
    }
    this.missiles = this.missiles.filter(missile =>
      !missile.hit && missile.x > -100 && missile.x < context.arena.width + 100 &&
      missile.y > -100 && missile.y < context.arena.height + 100
    );
  }

  launchMissile(context) {
    const targets = context.game.fighters.filter(fighter => fighter.stocks > 0);
    if (!targets.length) return;
    const target = targets[this.targetCursor++ % targets.length];
    const centerX = target.x + target.width / 2;
    const centerY = target.y + target.height / 2;
    const offset = (this.targetCursor % 2 ? -1 : 1) * (this.definition.targetOffset ?? 95);
    const targetX = Math.max(0, Math.min(context.arena.width, centerX + offset));
    const width = this.definition.missileWidth ?? 28;
    this.missiles.push({
      x: Math.max(0, Math.min(context.arena.width - width,
        targetX + (this.definition.startOffsetX ?? -280))),
      y: Math.max(25, centerY + (this.definition.startOffsetY ?? -240)),
      width,
      height: this.definition.missileHeight ?? 48,
      targetX,
      targetY: centerY,
      warning: this.definition.impactWarning ?? .55,
      speed: this.definition.speed ?? 410,
      hit: false
    });
  }

  draw(ctx) {
    if (!this.isWarning && !this.isActive) return;
    const color = severityColors[this.severity] ?? '#ff7955';
    if (this.isWarning) {
      drawWarningLabel(ctx, this, 500, 145, 'MISSILE LOCK // MOVE');
      return;
    }
    for (const missile of this.missiles) {
      ctx.save();
      ctx.globalAlpha = missile.warning > 0 ? .4 + Math.sin(performance.now() / 60) * .2 : .95;
      ctx.strokeStyle = missile.warning > 0 ? '#ffe28a' : color;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 17;
      if (missile.warning > 0) {
        ctx.beginPath();
        ctx.ellipse(missile.targetX, missile.targetY, 44, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.translate(missile.x + missile.width / 2, missile.y + missile.height / 2);
        ctx.rotate(Math.atan2(missile.vy, missile.vx) + Math.PI / 2);
        ctx.fillRect(-missile.width / 2, -missile.height / 2, missile.width, missile.height);
      }
      ctx.restore();
    }
  }

  getThreats() {
    if (!this.isWarning && !this.isActive) return [];
    if (this.isWarning) {
      return this.warningTargets;
    }
    return this.missiles.map(missile => missile.warning > 0
      ? { x: missile.targetX - 44, y: missile.targetY - 16, width: 88, height: 32, warning: true }
      : { x: missile.x, y: missile.y, width: missile.width, height: missile.height, warning: false });
  }
}
