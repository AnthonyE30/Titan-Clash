export class AnimationState {
  constructor() { this.time = 0; this.phase = Math.random() * Math.PI * 2; }
  update(dt) { this.time += dt; }
  bob(speed = 4, amount = 2) { return Math.sin(this.time * speed + this.phase) * amount; }
  pulse(speed = 8) { return .65 + Math.sin(this.time * speed + this.phase) * .35; }
}
