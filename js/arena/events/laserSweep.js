import { ArenaEvent } from '../arenaEvent.js';
import { overlaps } from '../../collision.js';
import { drawWarningLabel, eventAttack, severityColors } from './shared.js';

export class LaserSweepEvent extends ArenaEvent {
  onStart(context) {
    const main = context.arena.platforms.find(platform => platform.type === 'main') ?? context.arena.platforms[0];
    this.direction = this.definition.direction ?? 1;
    const beamWidth = this.definition.beamWidth ?? 90;
    this.startX = this.definition.startX ??
      (this.direction > 0 ? main.x - beamWidth : main.x + main.width);
    this.endX = this.direction > 0 ? main.x + main.width : main.x - beamWidth;
    this.x = this.startX;
    this.y = this.definition.y ?? main.y - (this.definition.height ?? 24);
    this.warningStartX = this.startX;
  }

  onUpdate(dt, context) {
    if (!this.isActive) return;
    const progress = Math.min(1, this.elapsed / this.duration);
    this.x = this.startX + (this.endX - this.startX) * progress;
    const beam = {
      x: this.x,
      y: this.y,
      width: this.definition.beamWidth ?? 90,
      height: this.definition.height ?? 28
    };
    for (const fighter of context.game.fighters) {
      if (fighter.stocks <= 0 || !overlaps(fighter, beam)) continue;
      this.hit(fighter, eventAttack(this), beam.x + beam.width / 2, context,
        this.definition.hitCooldown ?? .35);
    }
  }

  draw(ctx) {
    if (!this.isWarning && !this.isActive) return;
    const main = this.definition;
    const warning = this.isWarning;
    const color = severityColors[this.severity] ?? '#ff7955';
    const x = this.isWarning ? (this.warningStartX ?? main.startX ?? 0) : this.x;
    const y = this.y ?? main.y ?? 450;
    ctx.save();
    ctx.globalAlpha = warning ? .35 + Math.sin(performance.now() / 65) * .2 : .92;
    ctx.shadowColor = color;
    ctx.shadowBlur = warning ? 14 : 30;
    ctx.fillStyle = warning ? '#ffe28a' : color;
    ctx.fillRect(x, y, warning ? 4 : (main.beamWidth ?? 90), main.height ?? 28);
    if (warning) {
      ctx.save();
      ctx.globalAlpha = .45;
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = main.height ?? 28;
      ctx.setLineDash([16, 12]);
      ctx.beginPath();
      ctx.moveTo(Math.min(this.startX, this.endX), y + ctx.lineWidth / 2);
      ctx.lineTo(Math.max(this.startX, this.endX) + (main.beamWidth ?? 90), y + ctx.lineWidth / 2);
      ctx.stroke();
      ctx.restore();
      drawWarningLabel(ctx, this, x + 200, y - 18);
    }
    ctx.restore();
  }

  onComplete() {
    this.x = null;
    this.y = null;
  }

  getThreats() {
    if (!this.isWarning && !this.isActive) return [];
    const beamWidth = this.definition.beamWidth ?? 90;
    const left = Math.min(this.startX, this.endX);
    const right = Math.max(this.startX, this.endX) + beamWidth;
    return [{
      x: this.isWarning ? left : this.x,
      y: this.y,
      width: this.isWarning ? right - left : beamWidth,
      height: this.definition.height ?? 28,
      warning: this.isWarning
    }];
  }
}
