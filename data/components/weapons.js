import { MechComponent } from './mechComponent.js';

export class WeaponComponent extends MechComponent {
  constructor({ attacks = {} } = {}) {
    super('weapons', { attacks });
  }
}
