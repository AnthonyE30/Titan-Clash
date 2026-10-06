import { EnergyOverloadEvent } from './energyOverload.js';
import { GravityShiftEvent } from './gravityShift.js';
import { LegacyHazardEvent } from './legacyHazard.js';
import { LaserSweepEvent } from './laserSweep.js';
import { MeteorStormEvent } from './meteorStorm.js';
import { MissileBarrageEvent } from './missileBarrage.js';

export const ARENA_EVENT_TYPES = Object.freeze({
  'energy-overload': EnergyOverloadEvent,
  'gravity-shift': GravityShiftEvent,
  'legacy-hazard': LegacyHazardEvent,
  'laser-sweep': LaserSweepEvent,
  'meteor-storm': MeteorStormEvent,
  'missile-barrage': MissileBarrageEvent
});
