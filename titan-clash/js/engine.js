export class Engine {
  constructor(game) {
    this.game = game;
    this.lastTime = 0;
    this.running = false;
    this.frame = this.frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  frame(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - (this.lastTime || timestamp)) / 1000, 1 / 30);
    this.lastTime = timestamp;
    this.game.update(dt);
    this.game.render(dt);
    this.game.input.endFrame();
    requestAnimationFrame(this.frame);
  }
}
