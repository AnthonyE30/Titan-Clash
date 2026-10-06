import { ArenaEvent } from '../arenaEvent.js';
import { overlaps } from '../../collision.js';
import { drawWarningLabel, eventAttack, severityColors } from './shared.js';

export class MeteorStormEvent extends ArenaEvent {
  onStart(context) {
    this.meteors = [];
    this.spawnTimer = 0;
    this.spawnIndex = 0;
    this.arenaWidth = context.arena.width;
    const main = context.arena.platforms.find(platform => platform.type === 'main') ?? context.arena.platforms[0];
    this.impactY = main.y;
  }

  onUpdate(dt, context) {
    if (!this.isActive) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnMeteor(context);
      this.spawnTimer = this.definition.spawnInterval ?? .55;
    }
    for (const meteor of this.meteors) {
      if (meteor.warning > 0) {
        meteor.warning = Math.max(0, meteor.warning - dt);
      } else {
        meteor.y += meteor.speed * dt;
        if (meteor.y + meteor.height >= meteor.impactY && !meteor.impacted) {
          meteor.y = meteor.impactY - meteor.height;
          meteor.impacted = true;
          context.game.effects.emit({
            x: meteor.x + meteor.width / 2,
            y: meteor.impactY,
            color: '#ff9b62',
            type: 'explosion',
            size: 38,
            life: .28
          });
        }
        for (const fighter of context.game.fighters) {
          if (fighter.stocks <= 0 || meteor.hit) continue;
          if (overlaps(meteor, fighter)) {
            meteor.hit = this.hit(fighter, eventAttack(this), meteor.x + meteor.width / 2, context, 1);
          }
        }
      }
    }
    this.meteors = this.meteors.filter(meteor =>
      meteor.y < context.arena.height + 100 && !meteor.hit && !meteor.impacted
    );
  }

  spawnMeteor(context) {
    const count = Math.max(1, this.definition.laneCount ?? 7);
    const lane = this.spawnIndex++ % count;
    const x = this.definition.x ?? 80 + ((lane * 791 + this.activation * 317) % Math.max(1, this.arenaWidth - 160));
    this.meteors.push({
      x,
      y: -40,
      width: this.definition.meteorWidth ?? 34,
      height: this.definition.meteorHeight ?? 48,
      speed: this.definition.speed ?? 440,
      impactY: this.impactY,
      warning: this.definition.impactWarning ?? .72,
      hit: false
    });
  }

  draw(ctx) {
    if (!this.isWarning && !this.isActive) return;
    const color = severityColors[this.severity] ?? '#ff7955';
    if (this.isWarning) {
      drawWarningLabel(ctx, this, 500, 170, 'METEOR STORM // SEEK COVER');
      return;
    }
    for (const meteor of this.meteors) {
      ctx.save();
      ctx.globalAlpha = meteor.warning > 0 ? .35 + Math.sin(performance.now() / 55) * .25 : .95;
      ctx.strokeStyle = meteor.warning > 0 ? '#ffe28a' : color;
      ctx.fillStyle = meteor.warning > 0 ? '#ffe28a' : color;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 18;
      if (meteor.warning > 0) {
        ctx.beginPath();
        ctx.ellipse(meteor.x + meteor.width / 2, meteor.impactY, 24, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(meteor.x + meteor.width * .5, meteor.y);
        ctx.lineTo(meteor.x + meteor.width, meteor.y + meteor.height * .72);
        ctx.lineTo(meteor.x + meteor.width * .5, meteor.y + meteor.height);
        ctx.lineTo(meteor.x, meteor.y + meteor.height * .72);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  getThreats() {
    if (!this.isWarning && !this.isActive) return [];
    if (this.isWarning) {
      return [{
        x: 0,
        y: this.impactY - 90,
        width: this.arenaWidth,
        height: 90,
        warning: true
      }];
    }
    return this.meteors.map(meteor => meteor.warning > 0
      ? { x: meteor.x - 12, y: meteor.impactY - 90, width: meteor.width + 24, height: 90, warning: true }
      : { x: meteor.x, y: meteor.y, width: meteor.width, height: meteor.height, warning: false });
  }
}
