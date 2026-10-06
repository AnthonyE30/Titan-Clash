import { UltimateBehavior } from '../ultimateBehavior.js';
import { activeColor, attackDefinition, targetsFor, targetCenter } from './shared.js';

export class SummonUltimate extends UltimateBehavior {
  start() {
    this.duration = this.definition.duration ?? 4.5;
    this.summons = Array.from({ length: this.definition.count ?? 3 }, (_, index) => ({
      angle: Math.PI * 2 * index / (this.definition.count ?? 3),
      distance: this.definition.orbitRadius ?? 90,
      hitIndex: index
    }));
    this.strikeTimer = 0;
    this.strikeIndex = 0;
    this.definition.attack = attackDefinition(this.definition);
  }

  onUpdate(dt, context) {
    this.strikeTimer -= dt;
    if (this.strikeTimer > 0) return;
    const targets = targetsFor(this.owner, context);
    if (!targets.length) return;
    const target = targets[this.strikeIndex % targets.length];
    const center = targetCenter(target);
    if (Math.hypot(center.x - this.owner.x - this.owner.width / 2, center.y - this.owner.y - this.owner.height / 2) <
        (this.definition.range ?? 500)) {
      this.hit(target, this.owner.x + this.owner.width / 2, context, this.strikeIndex);
      context.game.effects.emit({
        x: center.x, y: center.y, color: activeColor(this),
        type: 'impact', size: 30, life: .22
      });
    }
    this.strikeIndex++;
    this.strikeTimer = this.definition.strikeInterval ?? .72;
  }

  draw(ctx) {
    const centerX = this.owner.x + this.owner.width / 2;
    const centerY = this.owner.y + this.owner.height / 2;
    const color = activeColor(this);
    if (this.state === 'telegraph') {
      ctx.save();
      ctx.strokeStyle = '#ffe28a';
      ctx.globalAlpha = .55 + Math.sin(performance.now() / 70) * .18;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.definition.orbitRadius ?? 90, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    this.summons.forEach(summon => {
      const angle = summon.angle + this.elapsed * (this.definition.orbitSpeed ?? 2.8);
      const x = centerX + Math.cos(angle) * summon.distance;
      const y = centerY + Math.sin(angle) * summon.distance * .55;
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x, y, this.definition.summonSize ?? 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();
      ctx.restore();
    });
  }
}
