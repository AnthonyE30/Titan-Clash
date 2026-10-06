import { Entity } from './entity.js';
import { integrateFighter, applyKnockback } from '../physics.js';
import { PLAYER_CONTROLS } from '../input.js';
import { hitboxAt, overlaps } from '../collision.js';
import { PassiveManager } from '../../data/passives/passiveManager.js';

export class Fighter extends Entity {
  constructor({ x, y, config, playerIndex }) {
    super({ x, y, width: config.visual.width, height: config.visual.height });
    this.config = config;
    this.playerIndex = playerIndex;
    this.controls = PLAYER_CONTROLS[playerIndex];
    this.reset();
    this.passives = new PassiveManager(config.passive);
    this.passives.emit('onSpawn', { fighter: this });
  }

  reset() {
    this.vx = 0; this.vy = 0; this.damage = 0; this.stocks = 3;
    this.facing = this.playerIndex === 0 ? 1 : -1;
    this.onGround = false; this.coyote = 0; this.jumpBuffer = 0;
    this.airJumps = this.config.movement.extraJumps; this.airDashes = this.config.movement.airDashes;
    this.attackCooldown = 0; this.hitstun = 0; this.invincible = 0;
    this.dashTime = 0; this.dashCooldown = 0; this.fastFalling = false;
    this.dropThrough = 0; this.landingRecovery = 0; this.hitPause = 0;
    this.flash = 0; this.blocking = false; this.currentAttack = null;
    this.attackHitIds = new Set(); this.combo = 0; this.comboTimer = 0;
    this.specialCooldown = 0; this.ultimateReady = true; this.respawnTime = 0;
    this.ultimateReady = true;
    this.runTime = 0; this.wallJumpCooldown = 0; this.trailTimer = 0;
    this.thrusterTimer = 0; this.dashStarted = false; this.dashWasAirborne = false;
    this.passiveState = {};
    this.passiveModifiers = { airControl: 1, recoveryAcceleration: 1 };
    this.ultimateModifiers = null;
  }

  respawn(spawn) {
    this.x = spawn.x - this.width / 2; this.y = spawn.y - this.height;
    this.vx = 0; this.vy = 0; this.damage = 0; this.currentAttack = null;
    this.hitstun = 0; this.invincible = 1.5; this.respawnTime = 0;
    this.ultimateReady = true; this.specialCooldown = 0; this.dashCooldown = 0;
    this.grabbedTarget = null; this.combo = 0; this.comboTimer = 0;
    this.airJumps = this.config.movement.extraJumps; this.airDashes = this.config.movement.airDashes;
    this.passiveState = {};
    this.passiveModifiers = { airControl: 1, recoveryAcceleration: 1 };
    this.ultimateModifiers = null;
    this.passives.emit('onSpawn', { fighter: this });
  }

  move(input, dt, arena) {
    this.animation.update(dt);
    if (this.stocks <= 0 || this.respawnTime > 0) {
      this.respawnTime = Math.max(0, this.respawnTime - dt);
      return;
    }
    this.passives.emit('onFrame', { fighter: this, dt, arena });
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (!this.comboTimer) this.combo = 0;
    const horizontal = Number(input.down(this.controls.right)) - Number(input.down(this.controls.left));
    this.barrierTime = Math.max(0, (this.barrierTime ?? 0) - dt);
    this.hoverTime = Math.max(0, (this.hoverTime ?? 0) - dt);
    this.wallJumpCooldown = Math.max(0, this.wallJumpCooldown - dt);
    this.blocking = ((input.down(this.controls.block) && !horizontal) || this.barrierTime > 0) &&
      this.hitstun <= 0 && !this.currentAttack;
    this.fastFalling = input.down(this.controls.down) && !this.onGround;
    if (input.justPressed(this.controls.down) && this.onGround && !input.down(this.controls.attack)) {
      this.dropThrough = Math.max(this.dropThrough, .14);
      this.y += 3;
    }
    if (input.justPressed(this.controls.up)) this.jumpBuffer = this.config.movement.jumpBuffer;
    const wallSide = this.x <= 2 ? 1 : this.x + this.width >= arena.width - 2 ? -1 : 0;
    if (this.jumpBuffer > 0 && wallSide && !this.onGround && this.wallJumpCooldown <= 0) {
      this.vx = wallSide * this.config.stats.dashSpeed * .58;
      this.vy = -this.config.movement.jumpSpeed * .9;
      this.facing = wallSide;
      this.jumpBuffer = 0;
      this.wallJumpCooldown = .3;
      this.airJumps = Math.max(0, this.airJumps - 1);
      this.passives.emit('onJump', { fighter: this, isAirJump: true, isWallJump: true });
    }
    const wantsDash = (input.justPressed(this.controls.block) && horizontal !== 0) || (input.justPressed(this.controls.left) && input.down(this.controls.block)) ||
      (input.justPressed(this.controls.right) && input.down(this.controls.block));
    if (wantsDash && this.dashCooldown <= 0 && this.hitstun <= 0 && (!this.onGround && this.airDashes <= 0 ? false : true)) {
      this.dashWasAirborne = !this.onGround;
      this.dashStarted = true;
      this.passives.emit('onDash', { fighter: this, isAirDash: !this.onGround });
      this.facing = horizontal || this.facing;
      this.vx = this.facing * this.config.stats.dashSpeed;
      this.vy = this.onGround ? this.vy : 0;
      this.dashTime = .15; this.dashCooldown = .8; this.invincible = Math.max(this.invincible, .09);
      if (!this.onGround) this.airDashes--;
    }
    if (this.hitstun <= 0 && this.dashTime <= 0) {
      if (horizontal) {
        this.facing = horizontal;
        this.runTime += dt;
        const walkScale = this.runTime < .18 ? .68 + this.runTime * 1.8 : 1;
        const speed = this.config.stats.speed * walkScale * (this.blocking ? .38 : 1) *
          (this.ultimateModifiers?.speedMultiplier ?? 1);
        const target = horizontal * speed;
        const airControl = this.onGround ? 1 : (this.passiveModifiers?.airControl ?? 1);
        this.vx += (target - this.vx) * Math.min(1, (this.onGround ? 18 : 7.5) * airControl * dt);
      } else {
        this.runTime = 0;
        this.vx *= Math.pow(this.onGround ? .0005 : .84, dt);
      }
    }
    if (input.justReleased(this.controls.up) && this.vy < -150) this.vy *= .55;
    integrateFighter(this, dt, arena);
  }

  attack(move) {
    if (this.attackCooldown > 0 || this.hitstun > 0 || this.landingRecovery > 0 || this.currentAttack || this.stocks <= 0) return null;
    this.currentAttack = {
      ...move,
      damage: (move.damage ?? 0) * (this.ultimateModifiers?.damageMultiplier ?? 1),
      elapsed: 0,
      activeDone: false
    };
    this.attackHitIds.clear();
    this.attackCooldown = move.cooldown ?? move.startup + move.active + move.recovery;
    this.passives.emit('onAttackStart', { fighter: this, attack: this.currentAttack });
    return this.currentAttack;
  }

  attackBox() {
    if (!this.currentAttack) return null;
    return hitboxAt(this, this.currentAttack);
  }

  receiveHit(attack, sourceX) {
    if (this.invincible > 0 || this.blocking || this.stocks <= 0) return false;
    const result = {
      attack,
      sourceX,
      damage: attack.damage,
      knockbackMultiplier: 1 - (this.ultimateModifiers?.knockbackResistance ?? 0),
      blocked: false
    };
    this.passives.emit('onDamageTaken', { fighter: this, ...result, result });
    this.lastDamageResult = result;
    if (result.blocked) {
      this.currentAttack = null;
      this.jumpBuffer = 0;
      return true;
    }
    this.damage += result.damage;
    applyKnockback(this, { ...attack, knockbackMultiplier: result.knockbackMultiplier }, sourceX);
    this.currentAttack = null;
    this.jumpBuffer = 0;
    return true;
  }

  updateAttack(dt) {
    if (!this.currentAttack) return;
    this.currentAttack.elapsed += dt;
    if (this.currentAttack.elapsed >= this.currentAttack.startup + this.currentAttack.active + this.currentAttack.recovery) this.currentAttack = null;
  }

  canHit(target, arena) {
    if (!this.currentAttack) return false;
    if (target.invincible > 0 || target.blocking) return false;
    const { startup, active, elapsed } = this.currentAttack;
    if (elapsed < startup || elapsed > startup + active) return false;
    const box = this.attackBox();
    if (!box || !overlaps(box, target)) return false;
    return true;
  }

  draw(ctx, time) {
    if (this.stocks <= 0 || this.respawnTime > 0) return;
    if (this.invincible > 0 && Math.floor(time * 18) % 2 === 0) return;
    const scale = this.config.visual.scale ?? 1;
    const bob = this.animation.bob(5, 1.5);
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.scale(this.facing * scale, scale);
    if (this.passiveState.cloakTime > 0) ctx.globalAlpha = .32;
    const color = this.flash > 0 ? '#ffffff' : this.config.visual.color;
    const accent = this.flash > 0 ? '#ffffff' : this.config.visual.accent;
    const w = this.width / scale;
    const h = this.height / scale;
    ctx.shadowColor = this.flash > 0 ? '#ffffff' : accent; ctx.shadowBlur = this.flash > 0 ? 26 : 13;
    if (this.passiveState.adaptiveShieldReady && this.passiveState.adaptiveShieldTime > 0) {
      ctx.save();
      ctx.strokeStyle = '#8af7ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#59e2dc';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * .62, h * .56, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#101b28';
    ctx.fillRect(-w * .33, h * .12, w * .26, h * .4);
    ctx.fillRect(w * .07, h * .12, w * .26, h * .4);
    ctx.fillStyle = '#1b2a35';
    ctx.fillRect(-w * .36, h * .45, w * .34, h * .09);
    ctx.fillRect(w * .04, h * .45, w * .34, h * .09);
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-w * .48, -h * .19); ctx.lineTo(-w * .37, -h * .42); ctx.lineTo(w * .3, -h * .42); ctx.lineTo(w * .48, -h * .12); ctx.lineTo(w * .4, h * .2); ctx.lineTo(-w * .4, h * .2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent; ctx.fillRect(-w * .24, -h * .12, w * .48, h * .07);
    ctx.fillStyle = '#10202b'; ctx.fillRect(-w * .2, -h * .58, w * .4, h * .25);
    ctx.fillStyle = color; ctx.fillRect(-w * .27, -h * .72, w * .54, h * .23);
    ctx.fillStyle = accent; ctx.shadowBlur = 17; ctx.fillRect(w * .02, -h * .66, w * .18, h * .055);
    ctx.fillStyle = color; ctx.fillRect(w * .3, -h * .22, w * .17, h * .3);
    ctx.fillStyle = accent; ctx.fillRect(w * .37, -h * .08, w * .12, h * .08);
    if (this.blocking) {
      ctx.strokeStyle = accent; ctx.globalAlpha = .7; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, w * .7, -1.15, 1.15); ctx.stroke();
    }
    if (this.currentAttack) {
      const progress = this.currentAttack.elapsed / (this.currentAttack.startup + this.currentAttack.active);
      ctx.globalAlpha = Math.max(.15, 1 - progress * .7); ctx.strokeStyle = accent; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(w * .5, 0, w * (.58 + progress * .16), -1.15, .9); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }
}
