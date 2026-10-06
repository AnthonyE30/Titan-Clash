import { AnimationState } from '../animation.js';

let nextEntityId = 1;

export class Entity {
  constructor({ x, y, width, height }) {
    this.id = nextEntityId++;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.active = true;
    this.animation = new AnimationState();
  }

  update(dt) { this.animation.update(dt); }
  draw() {}
}
