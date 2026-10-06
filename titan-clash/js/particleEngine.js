import { Effect } from './entities/effect.js';

export class ParticleEngine extends Array {
  emit(definition) {
    const effect = new Effect(definition);
    this.push(effect);
    return effect;
  }

  burst({ x, y, color, type = 'spark', count = 8, size = 18, speed = 220, life = .38, spread = Math.PI * 2 }) {
    for (let index = 0; index < count; index++) {
      const angle = (index / count) * spread + (Math.random() - .5) * .24;
      const velocity = speed * (.55 + Math.random() * .7);
      this.emit({
        x,
        y,
        color,
        type,
        size: size * (.55 + Math.random() * .75),
        life: life * (.7 + Math.random() * .65),
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity
      });
    }
  }

  update(dt) {
    for (const effect of this) effect.update(dt);
  }

  compact() {
    for (let index = this.length - 1; index >= 0; index--) {
      if (!this[index].active) this.splice(index, 1);
    }
  }
}
