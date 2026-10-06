import { UltimateBehavior } from '../ultimateBehavior.js';
import { activeColor, drawTelegraph, ownerCenter, targetsFor } from './shared.js';

export class TransformationUltimate extends UltimateBehavior {
  start(context) {
    this.duration = this.definition.duration ?? 7;
    this.center = ownerCenter(this.owner);
    this.definition.attack = this.definition.pulseDamage
      ? {
          damage: this.definition.pulseDamage,
          knockback: this.definition.knockback ?? 280,
          scale: this.definition.scale ?? 3,
          launch: this.definition.launch ?? 230,
          launchRatio: this.definition.launchRatio ?? .45,
          hitstun: .3,
          weightReference: 1
        }
      : null;
  }

  onActivate(context) {
    this.owner.ultimateModifiers = {
      remaining: this.duration,
      damageMultiplier: this.definition.damageMultiplier ?? 1.25,
      knockbackResistance: this.definition.knockbackResistance ?? .3,
      speedMultiplier: this.definition.speedMultiplier ?? 1,
      color: activeColor(this)
    };
    this.pulse(context, 0);
    context.game.camera.shakeNow(.72);
    context.game.effects.burst({
      x: this.center.x, y: this.center.y,
      color: activeColor(this), type: 'energy',
      count: 24, size: 23, speed: 340, life: .62
    });
  }

  onUpdate(dt, context) {
    this.pulseTimer = (this.pulseTimer ?? this.definition.pulseInterval ?? 1) - dt;
    if (this.pulseTimer <= 0) {
      this.pulse(context, (this.pulseIndex ?? 0) + 1);
      this.pulseIndex = (this.pulseIndex ?? 0) + 1;
      this.pulseTimer = this.definition.pulseInterval ?? 1;
    }
  }

  pulse(context, index) {
    if (!this.definition.attack) return;
    const radius = this.definition.pulseRadius ?? 130;
    for (const target of targetsFor(this.owner, context)) {
      const center = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
      if (Math.hypot(center.x - this.center.x, center.y - this.center.y) <= radius) {
        this.hit(target, this.center.x, context, index);
      }
    }
  }

  onComplete() {
    if (this.owner.ultimateModifiers) this.owner.ultimateModifiers = null;
  }

  draw(ctx) {
    const color = activeColor(this);
    const center = ownerCenter(this.owner);
    if (this.state === 'telegraph') {
      drawTelegraph(ctx, center.x, center.y, this.definition.pulseRadius ?? 130, color);
      return;
    }
    const pulse = .85 + Math.sin(performance.now() / 90) * .12;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 24;
    ctx.lineWidth = 5;
    ctx.globalAlpha = .7;
    ctx.beginPath();
    ctx.arc(center.x, center.y, this.owner.width * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
