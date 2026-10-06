import { resolvePlatforms } from './collision.js';

const GRAVITY = 1500;
const MAX_FALL = 1100;

export function integrateFighter(fighter, dt, arena) {
  const previousY = fighter.y;
  if (fighter.onGround) {
    fighter.coyote = fighter.config.movement.coyoteTime;
    fighter.airJumps = fighter.config.movement.extraJumps;
    fighter.airDashes = fighter.config.movement.airDashes;
  } else fighter.coyote = Math.max(0, fighter.coyote - dt);
  fighter.jumpBuffer = Math.max(0, fighter.jumpBuffer - dt);
  fighter.dropThrough = Math.max(0, fighter.dropThrough - dt);
  fighter.dashTime = Math.max(0, fighter.dashTime - dt);
  fighter.hitstun = Math.max(0, fighter.hitstun - dt * (fighter.passiveModifiers?.recoveryAcceleration ?? 1));
  fighter.invincible = Math.max(0, fighter.invincible - dt);
  fighter.hitPause = Math.max(0, fighter.hitPause - dt);
  fighter.attackCooldown = Math.max(0, fighter.attackCooldown - dt);
  fighter.flash = Math.max(0, fighter.flash - dt);
  if (fighter.hitPause > 0) return;
  if (fighter.jumpBuffer > 0) {
    if (fighter.coyote > 0) {
      fighter.vy = -fighter.config.movement.jumpSpeed;
      fighter.coyote = 0;
      fighter.jumpBuffer = 0;
      fighter.onGround = false;
      fighter.passives.emit('onJump', { fighter, isAirJump: false, isWallJump: false });
    } else if (fighter.airJumps > 0) {
      fighter.vy = -fighter.config.movement.jumpSpeed * .92;
      fighter.airJumps--;
      fighter.jumpBuffer = 0;
      fighter.onGround = false;
      fighter.passives.emit('onJump', { fighter, isAirJump: true, isWallJump: false });
    }
  }
  if (fighter.dashTime > 0) {
    fighter.vy *= .98;
  } else {
    const fastFall = fighter.fastFalling && fighter.vy > 0;
    const gravityScale = fighter.onGround ? 1 : fighter.hoverTime > 0 ? .12 :
      (fighter.config.movement.gravityScale ?? 1) * (arena.eventManager?.gravityScale ?? 1);
    fighter.vy = Math.min(fighter.vy + GRAVITY * gravityScale * (fastFall ? 1.85 : 1) * dt, MAX_FALL * (fastFall ? 1.6 : 1));
  }
  fighter.x += fighter.vx * dt;
  fighter.y += fighter.vy * dt;
  fighter.x = Math.max(-350, Math.min(arena.width - fighter.width + 350, fighter.x));
  resolvePlatforms(fighter, arena.platforms, previousY);
  if (fighter.onGround && fighter.landingRecovery > 0) fighter.landingRecovery = Math.max(0, fighter.landingRecovery - dt);
}

export function applyKnockback(target, attack, sourceX) {
  const direction = target.x + target.width / 2 < sourceX ? -1 : 1;
  const scaled = attack.knockback + target.damage * attack.scale;
  target.vx = direction * scaled * ((attack.weightReference ?? 1) / target.config.stats.weight) *
    (1 - (target.config.stats.knockbackResistance ?? 0)) * (attack.knockbackMultiplier ?? 1);
  target.vy = -Math.max(attack.launch, scaled * attack.launchRatio);
  target.hitstun = attack.hitstun + Math.min(1.2, target.damage / 140);
  target.hitPause = .055;
  target.landingRecovery = (.08 + Math.min(.28, target.hitstun * .12)) *
    (target.config.movement.landingRecoveryScale ?? 1);
  target.invincible = .08;
  target.flash = .18;
}
