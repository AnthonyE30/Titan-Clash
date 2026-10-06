import { MechComponent } from './mechComponent.js';

export class ChassisComponent extends MechComponent {
  constructor({ stats = {}, visual = {} } = {}) {
    super('chassis', { stats, visual });
  }
}
