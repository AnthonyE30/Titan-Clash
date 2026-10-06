import { MechComponent } from './mechComponent.js';

export class MobilityComponent extends MechComponent {
  constructor({ stats = {}, movement = {} } = {}) {
    super('mobility', { stats, movement });
  }
}
