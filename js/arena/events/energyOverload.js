import { ArenaEvent } from '../arenaEvent.js';
import { overlaps } from '../../collision.js';
import { drawWarningLabel, eventAttack, severityColors } from './shared.js';

export class EnergyOverloadEvent extends ArenaEvent {
  onStart(context) {
    const main = context.arena.platforms.find(platform => platform.type === 'main') ?? context.arena.platforms[0];
    const count = this.definition.laneCount ?? 4;
    const laneWidth = this.definition.laneWidth ?? 92;
    this.lanes = Array.from({ length: count }, (_, index) => ({
      x: main.x + (main.width - laneWidth) * (index + 1) / (count + 1),
      y: main.y - (this.definition.height ?? 900),
      width: laneWidth,
      height: this.definition.height ?? 900
    }));
  }

  onUpdate(dt, context) {
    if (!this.isActive) return;
    const attack = eventAttack(this);
    for (const lane of this.lanes) {
      for (const fighter of context.game.fighters) {
        if (fighter.stocks <= 0 || !overlaps(lane, fighter)) continue;
        this.hit(fighter, attack, lane.x + lane.width / 2, context, this.duration);
      }
    }
  }

  draw(ctx) {
    if (!this.isWarning && !this.isActive) return;
    const color = severityColors[this.severity] ?? '#ff3d48';
    if (this.isWarning) {
      drawWarningLabel(ctx, this, 500, 130, 'ENERGY OVERLOAD // CLEAR THE LANES');
      ctx.save();
      ctx.globalAlpha = .4 + Math.sin(performance.now() / 60) * .18;
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 9]);
      for (const lane of this.lanes) ctx.strokeRect(lane.x, lane.y, lane.width, lane.height);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.globalAlpha = .52 + Math.sin(performance.now() / 45) * .16;
    ctx.shadowColor = color;
    ctx.shadowBlur = 24;
    ctx.fillStyle = color;
    for (const lane of this.lanes) ctx.fillRect(lane.x, lane.y, lane.width, lane.height);
    ctx.restore();
  }

  getThreats() {
    if (!this.isWarning && !this.isActive) return [];
    return this.lanes.map(lane => ({ ...lane, warning: this.isWarning }));
  }
}
