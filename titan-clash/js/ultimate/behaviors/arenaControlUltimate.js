import { UltimateBehavior } from '../ultimateBehavior.js';
import { activeColor, attackDefinition, targetsFor, targetCenter } from './shared.js';

export class ArenaControlUltimate extends UltimateBehavior {
  start(context) {
    this.duration = this.definition.duration ?? 5;
    this.zoneCount = this.definition.zoneCount ?? 3;
    this.zoneRadius = this.definition.zoneRadius ?? 105;
    this.strikeInterval = this.definition.strikeInterval ?? .8;
    this.strikes = Array.from({ length: this.zoneCount }, (_, index) => ({
      x: context.arena.width * (index + 1) / (this.zoneCount + 1),
      y: (context.arena.platforms.find(platform => platform.type === 'main') ?? context.arena.platforms[0]).y - 65,
      warning: this.definition.strikeTelegraph ?? .55,
      elapsed: 0,
      hit: false
    }));
    this.strikeTimer = 0;
    this.strikeIndex = 0;
    this.definition.attack = attackDefinition(this.definition);
  }

  onUpdate(dt, context) {
    this.strikeTimer -= dt;
    if (this.strikeTimer <= 0) {
      const target = targetsFor(this.owner, context)[this.strikeIndex % Math.max(1, targetsFor(this.owner, context).length)];
      if (target) {
        const center = targetCenter(target);
        const strike = this.strikes[this.strikeIndex % this.strikes.length];
        strike.x = Math.max(this.zoneRadius, Math.min(context.arena.width - this.zoneRadius, center.x));
        strike.y = center.y;
        strike.warning = this.definition.strikeTelegraph ?? .55;
        strike.elapsed = 0;
        strike.hit = false;
      }
      this.strikeIndex++;
      this.strikeTimer = this.strikeInterval;
    }
    for (let index = 0; index < this.strikes.length; index++) {
      const strike = this.strikes[index];
      strike.elapsed += dt;
      if (strike.warning > 0) {
        strike.warning = Math.max(0, strike.warning - dt);
        continue;
      }
      if (strike.hit) continue;
      for (const target of targetsFor(this.owner, context)) {
        const center = targetCenter(target);
        if (Math.hypot(center.x - strike.x, center.y - strike.y) <= this.zoneRadius) {
          strike.hit = this.hit(target, strike.x, context, index + this.strikeIndex);
          if (strike.hit) break;
        }
      }
      if (!strike.hit) strike.warning = this.strikeInterval;
    }
  }

  draw(ctx) {
    const color = activeColor(this);
    if (this.state === 'telegraph') {
      ctx.save();
      ctx.strokeStyle = '#ffe28a';
      ctx.globalAlpha = .5 + Math.sin(performance.now() / 60) * .2;
      ctx.setLineDash([10, 7]);
      for (const strike of this.strikes) {
        ctx.beginPath();
        ctx.ellipse(strike.x, strike.y, this.zoneRadius, this.zoneRadius * .3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    for (const strike of this.strikes) {
      ctx.save();
      if (strike.warning > 0) {
        ctx.globalAlpha = .4 + Math.sin(performance.now() / 55) * .24;
        ctx.strokeStyle = '#ffe28a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(strike.x, strike.y, this.zoneRadius, this.zoneRadius * .32, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (!strike.hit) {
        ctx.globalAlpha = .85;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 30;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(strike.x, strike.y - 700);
        ctx.lineTo(strike.x, strike.y + 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(strike.x, strike.y, this.zoneRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
