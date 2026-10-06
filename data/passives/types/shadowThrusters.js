import { PassiveBase } from '../passiveBase.js';

export class ShadowThrusters extends PassiveBase {
  constructor(definition = {}) {
    super({
      id: 'shadow-thrusters',
      name: 'Shadow Thrusters',
      description: 'Briefly cloaks and avoids the next hit after an air dash.',
      parameters: { cloakDuration: .45, ...definition.parameters }
    });
  }

  onSpawn({ fighter }) {
    fighter.passiveState.cloakTime = 0;
  }

  onDash({ fighter, isAirDash }) {
    if (isAirDash) fighter.passiveState.cloakTime = this.parameters.cloakDuration;
  }

  onFrame({ fighter, dt }) {
    fighter.passiveState.cloakTime = Math.max(0, fighter.passiveState.cloakTime - dt);
  }

  onDamageTaken({ fighter, result }) {
    if (fighter.passiveState.cloakTime <= 0) return;
    fighter.passiveState.cloakTime = 0;
    result.blocked = true;
  }
}
