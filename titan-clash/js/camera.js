export class Camera {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.shake = 0;
    this.shakeTime = 0;
    this.time = 0;
    this.combatZoom = 0;
    this.shakeEnabled = true;
  }

  update(fighters, arena, dt) {
    const alive = fighters.filter(fighter => fighter.stocks > 0);
    if (!alive.length) return;
    const minX = Math.min(...alive.map(f => f.x + f.width / 2));
    const maxX = Math.max(...alive.map(f => f.x + f.width / 2));
    const minY = Math.min(...alive.map(f => f.y + f.height / 2));
    const maxY = Math.max(...alive.map(f => f.y + f.height / 2));
    const separation = maxX - minX;
    const closeCombat = separation < 220 ? (1 - separation / 220) * .055 : 0;
    this.combatZoom = Math.max(closeCombat, this.combatZoom - dt * .13);
    const horizontalZoom = this.width / (separation + 440);
    const verticalZoom = this.height / (maxY - minY + 330);
    const desiredZoom = Math.max(.5, Math.min(1.055, horizontalZoom, verticalZoom)) + this.combatZoom;
    this.zoom += (desiredZoom - this.zoom) * Math.min(1, (desiredZoom < this.zoom ? 2.7 : 5.5) * dt);
    const centerX = Math.max(this.width / (2 * this.zoom), Math.min(arena.width - this.width / (2 * this.zoom), (minX + maxX) / 2));
    const targetY = (minY + maxY) / 2 - arena.height * .04;
    const minCameraY = arena.cameraBounds?.top ?? this.height / (2 * this.zoom);
    const maxCameraY = arena.cameraBounds?.bottom ?? Math.max(minCameraY, arena.height - this.height / (2 * this.zoom));
    const centerY = Math.max(minCameraY, Math.min(maxCameraY, targetY));
    this.x += (centerX - this.x) * Math.min(1, 5.5 * dt);
    this.y += (centerY - this.y) * Math.min(1, 3.8 * dt);
    this.advanceShake(dt);
  }

  advanceShake(dt) {
    this.time += dt;
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.shake = this.shakeTime > 0 ? this.shake * Math.exp(-dt * 8.5) : Math.max(0, this.shake - dt * 4.5);
  }

  shakeNow(amount) {
    if (!this.shakeEnabled) return;
    this.shake = Math.min(1, Math.max(this.shake, amount));
    this.shakeTime = Math.max(this.shakeTime, .09 + amount * .16);
  }

  setShakeEnabled(enabled) {
    this.shakeEnabled = enabled;
    if (!enabled) {
      this.shake = 0;
      this.shakeTime = 0;
    }
  }

  apply(ctx) {
    const envelope = this.shakeEnabled ? Math.min(1, this.shake * 1.5) : 0;
    const offsetX = Math.sin(this.time * 95) * envelope * 20;
    const offsetY = Math.cos(this.time * 121) * envelope * 13;
    ctx.translate(this.width / 2 + offsetX, this.height / 2 + offsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }
}
