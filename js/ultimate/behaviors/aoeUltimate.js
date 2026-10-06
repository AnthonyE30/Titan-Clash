import { UltimateBehavior } from '../ultimateBehavior.js';
import { activeColor, attackDefinition, distanceTo, drawTelegraph, ownerCenter, targetsFor, targetCenter } from './shared.js';

export class AoeUltimate extends UltimateBehavior {
  start(context) {
    const target = targetsFor(this.owner, context)[0];
    const center = target ? targetCenter(target) : ownerCenter(this.owner);
    this.x = this.definition.targeting === 'self' ? ownerCenter(this.owner).x : center.x;
    this.y = this.definition.targeting === 'self' ? ownerCenter(this.owner).y : center.y;
    this.radius = this.definition.radius ?? 175;
    this.definition.attack = attackDefinition(this.definition);
  }

  onActivate(context) {
    for (const target of targetsFor(this.owner, context)) {
      if (distanceTo(this.x, this.y, target) <= this.radius) this.hit(target, this.x, context);
    }
    context.game.effects.emit({
      x: this.x, y: this.y, color: activeColor(this), type: 'explosion',
      size: this.radius, life: .62
    });
    context.game.camera.shakeNow(.8);
  }

  draw(ctx) {
    const color = activeColor(this);
    if (this.state === 'telegraph') {
      drawTelegraph(ctx, this.x, this.y, this.radius, color, Math.min(1, this.elapsed / this.telegraph));
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = .85;
      ctx.font = '900 15px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.definition.name.toUpperCase(), this.x, this.y - this.radius - 18);
      ctx.restore();
      return;
    }
    const progress = Math.min(1, this.elapsed / this.duration);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 28;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (.3 + progress), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
