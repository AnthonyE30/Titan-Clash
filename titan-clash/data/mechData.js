import { atlas } from './mechs/atlas.js';
import { bulwark } from './mechs/bulwark.js';
import { helios } from './mechs/helios.js';
import { lancer } from './mechs/lancer.js';
import { nomad } from './mechs/nomad.js';
import { phantom } from './mechs/phantom.js';
import { tempest } from './mechs/tempest.js';
import { vanguard } from './mechs/vanguard.js';

export { standardAttacks, createMechDefinition, composeMech } from './mechFactory.js';

export const MECHS = Object.freeze({
  atlas,
  vanguard,
  phantom,
  tempest,
  lancer,
  bulwark,
  nomad,
  helios
});
