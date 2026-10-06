import { AdaptiveShield } from './types/adaptiveShield.js';
import { ShadowThrusters } from './types/shadowThrusters.js';
import { SiegeCore } from './types/siegeCore.js';
import { StormDrive } from './types/stormDrive.js';

const PASSIVE_TYPES = Object.freeze({
  'adaptive-shield': AdaptiveShield,
  'siege-core': SiegeCore,
  'shadow-thrusters': ShadowThrusters,
  'storm-drive': StormDrive
});

export class PassiveManager {
  constructor(definitions = []) {
    const list = Array.isArray(definitions) ? definitions : [definitions];
    this.passives = list.filter(Boolean).map(definition => {
      if (typeof definition === 'string') {
        throw new TypeError(`Passive "${definition}" must be a data definition with an id.`);
      }
      const PassiveType = Object.hasOwn(PASSIVE_TYPES, definition.id) ? PASSIVE_TYPES[definition.id] : null;
      if (!PassiveType) throw new Error(`Unknown passive: ${definition.id}`);
      return new PassiveType(definition);
    });
  }

  emit(hook, context) {
    for (const passive of this.passives) {
      const handler = passive[hook];
      if (typeof handler !== 'function') {
        throw new Error(`Passive "${passive.id}" does not implement lifecycle hook "${hook}".`);
      }
      handler.call(passive, context);
    }
    return context;
  }

  get descriptions() {
    return this.passives.map(passive => passive.description);
  }
}
