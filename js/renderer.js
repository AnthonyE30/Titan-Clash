export class Renderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Titan Clash requires a browser with Canvas 2D support.');
    this.camera = camera;
  }

  render(game, dt) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackdrop(game.arena, game.time);
    if (!game.arena) return;
    ctx.save();
    this.camera.apply(ctx);
    this.drawArena(game.arena, game.time);
    game.arenaEvents?.draw(ctx);
    for (const fighter of game.fighters) fighter.draw(ctx, game.time);
    if (game.boss) game.boss.draw(ctx);
    for (const projectile of game.projectiles) projectile.draw(ctx);
    for (const attack of game.bossAttacks) attack.draw(ctx);
    for (const hazard of game.bossHazards) this.drawBossHazard(hazard);
    for (const effect of game.effects) effect.draw(ctx);
    game.ultimateManager?.draw(ctx);
    ctx.restore();
  }

  drawBossHazard(hazard) {
    const { ctx } = this;
    ctx.save();
    const warning = hazard.warningTime > 0;
    ctx.globalAlpha = warning ? .38 + Math.sin(performance.now() / 75) * .2 : .9;
    ctx.shadowColor = hazard.color;
    ctx.shadowBlur = warning ? 12 : 27;
    ctx.fillStyle = warning ? '#ffe28a' : hazard.color;
    ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
    ctx.strokeStyle = '#fff1b5';
    ctx.lineWidth = 2;
    ctx.strokeRect(hazard.x, hazard.y, hazard.width, hazard.height);
    ctx.restore();
  }

  drawBackdrop(arena, time) {
    const ctx = this.ctx;
    const colors = arena?.background ?? ['#071523', '#12344a', '#236072'];
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, colors[0]); gradient.addColorStop(.62, colors[1]); gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    for (let i = 0; i < (arena?.stars ?? 72); i++) {
      const x = (i * 173.1 + 51) % this.canvas.width;
      const y = (i * 83.7 + 22) % (this.canvas.height * .66);
      ctx.globalAlpha = .28 + Math.sin(time * 1.2 + i) * .18;
      ctx.fillStyle = i % 5 ? '#c8f7f0' : '#ffdc92';
      ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
    const sun = ctx.createRadialGradient(this.canvas.width * .76, this.canvas.height * .32, 5, this.canvas.width * .76, this.canvas.height * .32, 125);
    sun.addColorStop(0, '#d7f9e955'); sun.addColorStop(1, '#90c7ee00');
    ctx.fillStyle = sun; ctx.fillRect(this.canvas.width * .55, this.canvas.height * .1, this.canvas.width * .42, this.canvas.height * .48);
    this.drawSilhouettes(arena, time);
    ctx.restore();
  }

  drawSilhouettes(arena, time) {
    const ctx = this.ctx;
    const foreground = arena?.id === 'volcanicForge' ? '#261523' : arena?.id === 'skyFortress' ? '#233a59' : '#0d2635';
    for (let layer = 0; layer < 3; layer++) {
      const baseY = this.canvas.height * [.61, .72, .84][layer];
      const width = [125, 88, 120][layer];
      ctx.fillStyle = foreground;
      for (let n = -1; n < 14; n++) {
        const x = ((n * width - (time * (3 + layer * 3)) % width) + 1800) % 1800 - 400;
        const h = 45 + ((n * 47 + layer * 29 + 1400) % 110);
        ctx.fillRect(x, baseY - h, width - 8, h + 120);
        if (layer === 2) {
          ctx.fillStyle = '#74e6df22';
          for (let row = baseY - h + 12; row < baseY; row += 17) for (let col = x + 9; col < x + width - 12; col += 17) ctx.fillRect(col, row, 5, 7);
          ctx.fillStyle = foreground;
        }
      }
    }
  }

  drawArena(arena, time) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#83dbed1a'; ctx.lineWidth = 1;
    for (let x = 0; x < arena.width; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, arena.height); ctx.stroke();
    }
    for (let y = 0; y < arena.height; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(arena.width, y); ctx.stroke();
    }
    for (const platform of arena.platforms) {
      const main = platform.type === 'main';
      ctx.save(); ctx.shadowColor = main ? '#52eee3' : '#63b9ef'; ctx.shadowBlur = main ? 19 : 10;
      ctx.fillStyle = main ? '#1a3440' : '#162c3a'; ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.fillStyle = main ? '#4ce8dc' : '#57b5dd'; ctx.fillRect(platform.x, platform.y, platform.width, 4);
      ctx.shadowBlur = 0; ctx.fillStyle = '#b8f5e2'; ctx.fillRect(platform.x + 13, platform.y + 9, platform.width - 26, 2);
      ctx.fillStyle = '#526d78';
      for (let x = platform.x + 18; x < platform.x + platform.width - 8; x += 52) ctx.fillRect(x, platform.y + platform.height - 7, 17, 3);
      ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = '#73e9ec24'; ctx.setLineDash([8, 11]); ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, arena.width, arena.height); ctx.setLineDash([]);
    for (let x = 0; x < arena.width; x += 64) {
      ctx.fillStyle = '#63dce022'; ctx.fillRect(x, arena.height - 50, 1, 18 + Math.sin(time * 2 + x) * 5);
    }
    ctx.restore();
  }
}
