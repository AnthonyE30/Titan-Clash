import { ArenaEvent } from '../arenaEvent.js';
import { drawWarningLabel, severityColors } from './shared.js';

export class GravityShiftEvent extends ArenaEvent {
  draw(ctx) {
    if (!this.isWarning && !this.isActive) return;
    const color = severityColors[this.severity] ?? '#65e9ff';
    ctx.save();
    if (this.isWarning) {
      drawWarningLabel(ctx, this, 500, 125, 'GRAVITY SHIFT IMMINENT');
    } else {
      ctx.globalAlpha = .12 + Math.sin(performance.now() / 150) * .04;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.arenaWidth ?? 1800, this.arenaHeight ?? 760);
      ctx.globalAlpha = .7;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      for (let x = -1000; x < 5000; x += 150) {
        ctx.beginPath();
        ctx.moveTo(x, -300);
        ctx.lineTo(x, 3000);
        ctx.stroke();
      }
      drawWarningLabel(ctx, this, 500, 160, `GRAVITY ${this.definition.gravityScale < 1 ? 'LOW' : 'HIGH'}`);
    }
    ctx.restore();
  }

  onStart(context) {
    this.arenaWidth = context.arena.width;
    this.arenaHeight = context.arena.height;
  }
}
