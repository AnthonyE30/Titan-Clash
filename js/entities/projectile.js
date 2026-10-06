import { Entity } from './entity.js';

export class Projectile extends Entity {
  constructor({ x, y, direction, owner, definition, color }) {
    super({ x, y, width: definition.width, height: definition.height });
    this.owner = owner;
    this.direction = direction;
    this.definition = definition;
    this.color = color;
    this.vx = direction * definition.speed;
    this.life = definition.life ?? 2.5;
    this.team = owner.playerIndex;
  }

  update(dt) {
    super.update(dt);
    this.x += this.vx * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    ctx.save(); ctx.shadowColor = this.color; ctx.shadowBlur = 18;
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .38; ctx.fillRect(this.x - this.direction * this.width, this.y + this.height * .3, this.width, this.height * .4);
    ctx.restore();
  }
}
