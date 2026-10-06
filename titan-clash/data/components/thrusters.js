import { MechComponent } from './mechComponent.js';

export class ThrusterComponent extends MechComponent {
  constructor({ movement = {} } = {}) {
    super('thrusters', { movement });
  }
}
