import { ArenaEvent } from '../arenaEvent.js';
import { overlaps } from '../../collision.js';
import { severityColors } from './shared.js';

export class LegacyHazardEvent extends ArenaEvent {
  onUpdate(dt, context) {
    if (!this.isActive) return;
    const hazard = this.definition;
    const attack = {
      damage: hazard.damage ?? 8,
      knockback: 160,
      scale: 2,
      launch: 210,
      launchRatio: .5,
      hitstun: .2,
      weightReference: 1
    };
    for (const fighter of context.game.fighters) {
      if (fighter.stocks <= 0 || !overlaps(fighter, hazard)) continue;
      this.hit(fighter, attack, hazard.x + hazard.width / 2, context, .08);
    }
  }

  draw(ctx) {
    const hazard = this.definition;
    const warning = this.isWarning;
    const active = this.isActive;
    const color = active ? (severityColors[this.severity] ?? '#ff603d') : '#8d3b35';
    ctx.save();
    ctx.globalAlpha = warning ? .45 + Math.sin(performance.now() / 75) * .18 : active ? .9 : 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = warning ? 10 : active ? 24 : 7;
    ctx.fillStyle = warning ? '#ffe28a' : active ? color : '#8d3b35';
    ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
    ctx.fillStyle = '#ffe17a';
    ctx.globalAlpha = active ? .95 : .35;
    for (let x = hazard.x + 4; x < hazard.x + hazard.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, hazard.y);
      ctx.lineTo(x + 8, hazard.y - 13);
      ctx.lineTo(x + 16, hazard.y);
      ctx.fill();
    }
    ctx.restore();
  }

  getThreats() {
    if (!this.isWarning && !this.isActive) return [];
    return [{ ...this.definition, warning: this.isWarning }];
  }
}
