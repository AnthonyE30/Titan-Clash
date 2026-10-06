import { PassiveBase } from '../passiveBase.js';

export class SiegeCore extends PassiveBase {
  constructor(definition = {}) {
    super({
      id: 'siege-core',
      name: 'Siege Core',
      description: 'Builds up to 30% armor as damage accumulates.',
      parameters: { maxArmor: .3, damageForMaxArmor: 180, ...definition.parameters }
    });
  }

  onDamageTaken({ fighter, result }) {
    const armor = Math.min(this.parameters.maxArmor, fighter.damage / this.parameters.damageForMaxArmor * this.parameters.maxArmor);
    result.damage *= 1 - armor;
    result.knockbackMultiplier *= 1 - armor;
    fighter.passiveState.armor = armor;
  }

  onSpawn({ fighter }) {
    fighter.passiveState.armor = 0;
  }
}
