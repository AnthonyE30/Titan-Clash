import { PassiveBase } from '../passiveBase.js';

export class AdaptiveShield extends PassiveBase {
  constructor(definition = {}) {
    super({
      id: 'adaptive-shield',
      name: 'Adaptive Shield',
      description: 'Gains a temporary one-hit shield after staying out of combat.',
      parameters: { rechargeDelay: 4, shieldDuration: 2.5, ...definition.parameters }
    });
  }

  onSpawn({ fighter }) {
    fighter.passiveState.adaptiveShieldTime = 0;
    fighter.passiveState.adaptiveShieldReady = false;
    fighter.passiveState.combatQuietTime = 0;
  }

  onDamageDealt({ fighter }) {
    fighter.passiveState.combatQuietTime = 0;
    fighter.passiveState.adaptiveShieldTime = 0;
    fighter.passiveState.adaptiveShieldReady = false;
  }

  onFrame({ fighter, dt }) {
    const state = fighter.passiveState;
    if (state.adaptiveShieldTime > 0) {
      state.adaptiveShieldTime = Math.max(0, state.adaptiveShieldTime - dt);
      if (state.adaptiveShieldTime === 0) state.adaptiveShieldReady = false;
      return;
    }
    if (state.adaptiveShieldReady) return;
    state.combatQuietTime += dt;
    if (state.combatQuietTime >= this.parameters.rechargeDelay) {
      state.adaptiveShieldTime = this.parameters.shieldDuration;
      state.adaptiveShieldReady = true;
      state.combatQuietTime = 0;
    }
  }

  onDamageTaken({ fighter, result }) {
    const state = fighter.passiveState;
    state.combatQuietTime = 0;
    if (state.adaptiveShieldReady && state.adaptiveShieldTime > 0) {
      state.adaptiveShieldReady = false;
      state.adaptiveShieldTime = 0;
      result.blocked = true;
    }
  }
}
