import { MechComponent } from './mechComponent.js';

export class SpecialAbilityComponent extends MechComponent {
  constructor(abilities = {}) {
    super('special-abilities', { abilities });
  }
}
