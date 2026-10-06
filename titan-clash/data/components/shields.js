import { MechComponent } from './mechComponent.js';

export class ShieldComponent extends MechComponent {
  constructor({ stats = {} } = {}) {
    super('shields', { stats });
  }
}
