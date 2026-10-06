import { AoeUltimate } from './aoeUltimate.js';
import { ArenaControlUltimate } from './arenaControlUltimate.js';
import { BeamUltimate } from './beamUltimate.js';
import { PersistentUltimate } from './persistentUltimate.js';
import { SummonUltimate } from './summonUltimate.js';
import { TransformationUltimate } from './transformationUltimate.js';

export const ULTIMATE_BEHAVIORS = Object.freeze({
  aoe: AoeUltimate,
  'arena-control': ArenaControlUltimate,
  beam: BeamUltimate,
  persistent: PersistentUltimate,
  summon: SummonUltimate,
  transformation: TransformationUltimate
});
