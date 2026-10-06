import { Entity } from './entity.js';

export class Effect extends Entity {
  constructor({ x, y, color, type = 'spark', life = .45, size = 20, vx = 0, vy = 0, text = '' }) {
    super({ x, y, width: size, height: size });
    this.color = color; this.type = type; this.life = life; this.maxLife = life; this.size = size; this.vx = vx; this.vy = vy;
    this.text = text;
    this.rotation = Math.atan2(vy, vx);
  }

  update(dt) {
    super.update(dt);
    this.x += this.vx * dt; this.y += this.vy * dt;
    const gravity = this.type === 'dust' ? -35 : this.type === 'energy' || this.type === 'exhaust' ? -90 : 320;
    this.vy += gravity * dt;
    const drag = this.type === 'dust' ? .91 : .985;
    this.vx *= Math.pow(drag, dt * 60);
    this.vy *= Math.pow(drag, dt * 60);
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = this.color; ctx.fillStyle = this.color;
    ctx.shadowColor = this.color; ctx.shadowBlur = 16;
    if (this.type === 'burst') {
      ctx.lineWidth = 3 + alpha * 3; ctx.beginPath(); ctx.arc(this.x, this.y, this.size * (1 - alpha * .55), 0, Math.PI * 2); ctx.stroke();
    } else if (this.type === 'impact' || this.type === 'explosion' || this.type === 'ko') {
      const radius = this.size * (1.2 - alpha * .8);
      ctx.lineWidth = Math.max(1, 2 + alpha * 5);
      ctx.beginPath(); ctx.arc(this.x, this.y, radius, 0, Math.PI * 2); ctx.stroke();
      if (this.type !== 'impact') {
        ctx.globalAlpha = alpha * .25;
        ctx.beginPath(); ctx.arc(this.x, this.y, radius * .72, 0, Math.PI * 2); ctx.fill();
      }
    } else if (this.type === 'dust') {
      ctx.globalAlpha = alpha * .55;
      ctx.beginPath(); ctx.ellipse(this.x, this.y, this.size * (1.2 - alpha * .35), this.size * (.32 + (1 - alpha) * .18), 0, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'critical') {
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = Math.min(1, alpha * 1.4);
      ctx.font = `900 ${Math.max(12, this.size)}px "Barlow Condensed", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#08131c';
      ctx.strokeText(this.text, 0, 0);
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, 0, 0);
    } else if (this.type === 'exhaust') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = alpha * .8;
      ctx.beginPath(); ctx.ellipse(0, 0, this.size * 1.35, this.size * .42, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.translate(this.x, this.y); ctx.rotate(this.rotation + this.animation.time * 5);
      if (this.type === 'energy') {
        ctx.beginPath(); ctx.arc(0, 0, Math.max(1, this.size * alpha * .48), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha * .45;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(2, this.size * alpha), 0, Math.PI * 2); ctx.stroke();
      } else {
        const length = this.size * alpha;
        ctx.lineWidth = Math.max(1, this.size * .17);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-length * .55, 0); ctx.lineTo(length * .55, 0); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
