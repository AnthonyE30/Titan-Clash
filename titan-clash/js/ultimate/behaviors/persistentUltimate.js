import { UltimateBehavior } from '../ultimateBehavior.js';
import { activeColor, attackDefinition, drawTelegraph, ownerCenter, targetsFor, targetCenter } from './shared.js';

export class PersistentUltimate extends UltimateBehavior {
  start() {
    this.duration = this.definition.duration ?? 3.6;
    this.hitInterval = this.definition.hitInterval ?? .5;
    this.hitCooldowns = new Map();
    this.definition.attack = attackDefinition(this.definition);
  }

  onUpdate(dt, context) {
    for (const [id, remaining] of this.hitCooldowns) {
      if (remaining <= dt) this.hitCooldowns.delete(id);
      else this.hitCooldowns.set(id, remaining - dt);
    }
    this.hitTimer = (this.hitTimer ?? 0) - dt;
    if (this.hitTimer > 0) return;
    this.hitTimer = this.hitInterval;
    const owner = ownerCenter(this.owner);
    const radius = this.definition.radius ?? 220;
    for (const target of targetsFor(this.owner, context)) {
      if (this.hitCooldowns.has(target.id)) continue;
      const center = targetCenter(target);
      if (Math.hypot(center.x - owner.x, center.y - owner.y) > radius) continue;
      if (this.hit(target, owner.x, context, Math.floor(this.elapsed / this.hitInterval))) {
        this.hitCooldowns.set(target.id, this.hitInterval);
      }
    }
  }

  draw(ctx) {
    const owner = ownerCenter(this.owner);
    const radius = this.definition.radius ?? 220;
    const color = activeColor(this);
    if (this.state === 'telegraph') {
      drawTelegraph(ctx, owner.x, owner.y, radius, color);
      return;
    }
    ctx.save();
    ctx.globalAlpha = .28 + Math.sin(performance.now() / 75) * .09;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.arc(owner.x, owner.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = .9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(owner.x, owner.y, radius * (.82 + Math.sin(performance.now() / 100) * .05), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
