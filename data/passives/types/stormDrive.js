import { PassiveBase } from '../passiveBase.js';

export class StormDrive extends PassiveBase {
  constructor(definition = {}) {
    super({
      id: 'storm-drive',
      name: 'Storm Drive',
      description: 'Improves air control and recovers from hitstun faster while airborne.',
      parameters: { airControlMultiplier: 1.45, recoveryAcceleration: 1.3, ...definition.parameters }
    });
  }

  onSpawn({ fighter }) {
    fighter.passiveModifiers.airControl = 1;
    fighter.passiveModifiers.recoveryAcceleration = 1;
  }

  onFrame({ fighter }) {
    const multiplier = fighter.onGround ? 1 : this.parameters.airControlMultiplier;
    fighter.passiveModifiers.airControl = multiplier;
    fighter.passiveModifiers.recoveryAcceleration = fighter.onGround
      ? 1
      : this.parameters.recoveryAcceleration;
  }
}
