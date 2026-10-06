import { UltimateBehavior } from '../ultimateBehavior.js';
import { activeColor, attackDefinition, ownerCenter, targetsFor } from './shared.js';
import { overlaps } from '../../collision.js';

export class BeamUltimate extends UltimateBehavior {
  start() {
    const center = ownerCenter(this.owner);
    this.originX = center.x;
    this.originY = center.y;
    this.direction = this.owner.facing;
    this.range = this.definition.range ?? this.definition.radius ?? 550;
    this.beamHeight = this.definition.beamHeight ?? 100;
    this.definition.attack = attackDefinition(this.definition);
  }

  onActivate(context) {
    const box = this.beamBox();
    for (const target of targetsFor(this.owner, context)) {
      if (overlaps(box, target)) this.hit(target, this.originX, context);
    }
    context.game.camera.shakeNow(.7);
  }

  beamBox() {
    return {
      x: this.direction > 0 ? this.originX : this.originX - this.range,
      y: this.originY - this.beamHeight / 2,
      width: this.range,
      height: this.beamHeight
    };
  }

  draw(ctx) {
    const color = activeColor(this);
    const box = this.beamBox();
    ctx.save();
    if (this.state === 'telegraph') {
      ctx.globalAlpha = .35 + Math.sin(performance.now() / 60) * .18;
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(this.originX, this.originY);
      ctx.lineTo(this.originX + this.direction * this.range, this.originY);
      ctx.stroke();
      ctx.fillStyle = '#ffe28a';
      ctx.font = '900 15px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.definition.name.toUpperCase(), this.originX + this.direction * this.range * .5, this.originY - 22);
    } else {
      ctx.globalAlpha = Math.max(0, 1 - this.elapsed / this.duration);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 34;
      ctx.fillRect(box.x, box.y, box.width, box.height);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha *= .78;
      ctx.fillRect(box.x, this.originY - 4, box.width, 8);
    }
    ctx.restore();
  }
}
