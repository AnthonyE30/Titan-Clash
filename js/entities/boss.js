import { Entity } from './entity.js';
import { BossController } from '../boss/bossController.js';
import { BossPhaseManager } from '../boss/bossPhases.js';
import { BossAction } from '../boss/bossActions.js';
import { resolvePlatforms } from '../collision.js';

export class Boss extends Entity {
  constructor({ definition, x, y }) {
    super({ x, y, width: definition.size.width, height: definition.size.height });
    this.definition = definition;
    this.name = definition.name;
    this.health = definition.health;
    this.maxHealth = definition.health;
    this.phaseIndex = 0;
    this.phase = definition.phases[0];
    this.facing = -1;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.stocks = 1;
    this.invincible = 0;
    this.blocking = false;
    this.flash = 0;
    this.enraged = false;
    this.state = 'intro';
    this.introRemaining = definition.cinematic.introDuration;
    this.phaseLock = 0;
    this.actionRecoveryRemaining = 0;
    this.recoveryTime = 0;
    this.shieldTime = 0;
    this.shieldReduction = 0;
    this.shieldDroneCount = 0;
    this.shieldPhase = 0;
    this.telegraph = null;
    this.movementCommand = { direction: 0, speed: definition.movement.speed };
    this.charge = null;
    this.actions = new Map(definition.actions.map(action => [action.id, new BossAction(action)]));
    this.phaseManager = new BossPhaseManager(this, definition.phases);
    this.controller = new BossController(definition.controller);
    this.attackHitIds = new Set();
    this.controller.reset();
  }

  update(dt, game) {
    this.animation.update(dt);
    this.flash = Math.max(0, this.flash - dt);
    if (this.state === 'intro') {
      this.introRemaining = Math.max(0, this.introRemaining - dt);
      if (this.introRemaining === 0) this.state = 'active';
      return;
    }
    if (this.state !== 'active') return;

    if (this.recoveryTime > 0) {
      this.recoveryTime = Math.max(0, this.recoveryTime - dt);
      this.vx = 0;
      this.vy = 0;
      return;
    }
    this.phaseLock = Math.max(0, this.phaseLock - dt);
    this.actionRecoveryRemaining = Math.max(0, this.actionRecoveryRemaining - dt);
    this.shieldTime = Math.max(0, this.shieldTime - dt);
    if (this.shieldTime === 0) this.shieldReduction = 0;
    this.shieldPhase += dt * 2.4;
    this.phaseManager.update(game);
    this.updateEnrage(game);
    for (const action of this.actions.values()) action.update(dt, this, game);
    if (this.phaseLock === 0 && this.actionRecoveryRemaining === 0) {
      this.controller.update(this, game, dt);
    } else if (this.actionRecoveryRemaining > 0) {
      this.movementCommand = { direction: 0, speed: this.definition.movement.speed };
    }
    this.integrate(dt, game.arena);
  }

  issueCommand(command, game) {
    if (this.state !== 'active') return false;
    if (command.type === 'move') {
      this.movementCommand = {
        direction: Math.max(-1, Math.min(1, command.direction)),
        speed: command.speed ?? this.definition.movement.speed
      };
      return true;
    }
    if (command.type === 'action') {
      const action = this.actions.get(command.actionId);
      return action ? action.start(this, command.target, game) : false;
    }
    if (command.type === 'charge') {
      this.charge = {
        direction: command.direction,
        speed: command.speed,
        duration: command.duration,
        remaining: command.duration,
        attack: command.attack,
        hitIds: new Set()
      };
      return true;
    }
    throw new Error(`Unknown boss command: ${command.type}`);
  }

  integrate(dt, arena) {
    if (this.y > arena.height + (this.definition.movement.fallRecoveryMargin ?? 180)) {
      this.recoverToArena(arena);
      return;
    }
    const previousY = this.y;
    if (this.charge?.remaining > 0) {
      this.vx = this.charge.direction * this.charge.speed;
      this.facing = this.charge.direction;
      this.charge.remaining = Math.max(0, this.charge.remaining - dt);
    } else {
      this.charge = null;
      const targetVx = this.movementCommand.direction * this.movementCommand.speed *
        (this.enraged ? this.definition.enrage.speedMultiplier : 1);
      this.vx += (targetVx - this.vx) * Math.min(1, this.definition.movement.acceleration * dt);
      if (Math.abs(this.vx) > 8) this.facing = Math.sign(this.vx);
    }
    this.vy = Math.min(this.vy + 1500 * (arena.eventManager?.gravityScale ?? 1) * dt, 900);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = Math.max(0, Math.min(arena.width - this.width, this.x));
    resolvePlatforms(this, arena.platforms, previousY);
  }

  recoverToArena(arena) {
    const platform = arena.platforms.find(item => item.type === 'main') ?? arena.platforms[0];
    if (!platform) throw new Error(`Boss "${this.definition.id}" requires a recovery platform.`);
    this.x = platform.x + (platform.width - this.width) / 2;
    this.y = platform.y - this.height;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.charge = null;
    this.movementCommand = { direction: 0, speed: this.definition.movement.speed };
    this.recoveryTime = this.definition.movement.fallRecoveryDuration ?? .85;
    this.phaseLock = Math.max(this.phaseLock, this.recoveryTime);
    this.actionRecoveryRemaining = 0;
    this.shieldTime = 0;
    this.shieldReduction = 0;
    this.telegraph = null;
    for (const action of this.actions.values()) action.cancel();
  }

  receiveHit(attack, sourceX = this.x + this.width / 2 - this.facing) {
    if (this.state !== 'active') return false;
    const damageReduction = this.shieldTime > 0 ? this.shieldReduction : 0;
    const damage = Math.min(this.health, Math.max(0,
      (attack.damage ?? 0) * (1 - damageReduction)));
    this.health -= damage;
    this.lastDamageResult = { damage };
    this.flash = .14;
    const recoilDirection = this.x + this.width / 2 < sourceX ? -1 : 1;
    this.vx += recoilDirection * Math.min(95, (attack.knockback ?? 0) * .12);
    return true;
  }

  changePhase(index, game) {
    this.phaseIndex = index;
    this.phase = this.definition.phases[index];
    this.phaseLock = this.phase.transitionDuration ?? 1.1;
    this.telegraph = null;
    for (const action of this.actions.values()) action.cancel();
    this.shieldTime = 0;
    this.shieldReduction = 0;
    game.camera.shakeNow(.58);
    game.effects.emit({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      color: this.definition.visual.accent,
      type: 'explosion',
      size: 94,
      life: .8
    });
    game.ui.announce(`PHASE ${index + 1} // ${this.phase.name.toUpperCase()}`, this.phaseLock);
  }

  updateEnrage(game) {
    const threshold = this.definition.enrage.healthThreshold;
    if (this.enraged || this.health / this.maxHealth > threshold) return;
    this.enraged = true;
    game.camera.shakeNow(.72);
    game.effects.burst({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      color: this.definition.visual.enrage,
      type: 'energy',
      count: 22,
      size: 25,
      speed: 350,
      life: .65
    });
    game.ui.announce(`${this.name.toUpperCase()} // ENRAGED`, 1.2);
  }

  draw(ctx) {
    if (this.state === 'defeated') return;
    const { visual } = this.definition;
    const color = this.flash > 0 ? '#ffffff' : this.enraged ? visual.enrage : visual.color;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(this.facing, 1);
    ctx.shadowColor = this.enraged ? visual.enrage : visual.accent;
    ctx.shadowBlur = this.enraged ? 38 : 22;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-this.width * .48, this.height * .42);
    ctx.lineTo(-this.width * .38, -this.height * .28);
    ctx.lineTo(-this.width * .2, -this.height * .45);
    ctx.lineTo(this.width * .08, -this.height * .5);
    ctx.lineTo(this.width * .42, -this.height * .18);
    ctx.lineTo(this.width * .5, this.height * .4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#14232c';
    ctx.fillRect(-this.width * .21, -this.height * .16, this.width * .35, this.height * .22);
    ctx.fillStyle = visual.accent;
    ctx.fillRect(-this.width * .12, -this.height * .1, this.width * .22, this.height * .06);
    ctx.fillStyle = color;
    ctx.fillRect(-this.width * .38, this.height * .25, this.width * .28, this.height * .32);
    ctx.fillRect(this.width * .12, this.height * .25, this.width * .28, this.height * .32);
    ctx.restore();
    if (this.shieldTime > 0) {
      ctx.save();
      ctx.strokeStyle = '#75e5f2';
      ctx.lineWidth = 4;
      ctx.globalAlpha = .5 + Math.sin(this.shieldPhase * 4) * .16;
      ctx.shadowColor = '#75e5f2';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, this.width * .72, this.height * .72, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let index = 0; index < this.shieldDroneCount; index++) {
        const angle = this.shieldPhase + index * Math.PI * 2 / this.shieldDroneCount;
        ctx.fillStyle = '#d8fbff';
        ctx.beginPath();
        ctx.arc(centerX + Math.cos(angle) * this.width * .68,
          centerY + Math.sin(angle) * this.height * .68, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (this.telegraph) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '900 19px "Barlow Condensed", sans-serif';
      ctx.fillStyle = '#ffe28a';
      ctx.shadowColor = '#ff714e';
      ctx.shadowBlur = 15;
      ctx.fillText(this.telegraph.label.toUpperCase(), centerX, this.y - 20);
      const progress = this.telegraph.duration
        ? 1 - this.telegraph.remaining / this.telegraph.duration
        : 1;
      ctx.fillStyle = '#ff714e';
      ctx.fillRect(centerX - 54, this.y - 12, 108 * progress, 4);
      if (this.telegraph.style === 'beam') {
        const beamEnd = centerX + this.telegraph.direction * this.telegraph.range;
        ctx.strokeStyle = '#ffe28a';
        ctx.globalAlpha = .2 + progress * .5;
        ctx.lineWidth = 18;
        ctx.setLineDash([18, 12]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(beamEnd, centerY);
        ctx.stroke();
      } else if (this.telegraph.style === 'area' && this.telegraph.targetX !== undefined) {
        ctx.strokeStyle = '#ffe28a';
        ctx.globalAlpha = .35 + Math.sin(this.shieldPhase * 6) * .15;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(this.telegraph.targetX, this.telegraph.targetY,
          this.telegraph.radius ?? 72, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.telegraph.style === 'lanes' && this.telegraph.targetX !== undefined &&
          this.telegraph.platform) {
        const { platform, laneCount, laneWidth, laneHeight, laneY } = this.telegraph;
        const count = laneCount ?? 2;
        const width = laneWidth ?? 110;
        ctx.strokeStyle = '#ffe28a';
        ctx.fillStyle = '#ffe28a';
        ctx.globalAlpha = .3 + Math.sin(this.shieldPhase * 6) * .12;
        ctx.setLineDash([8, 7]);
        for (let index = 0; index < count; index++) {
          const offset = count === 1 ? 0 : (index - (count - 1) / 2) * (width + 22);
          const x = Math.max(platform.x, Math.min(
            platform.x + platform.width - width,
            this.telegraph.targetX + offset - width / 2
          ));
          ctx.fillRect(x, laneY, width, laneHeight ?? 25);
          ctx.strokeRect(x, laneY, width, laneHeight ?? 25);
        }
      }
      ctx.restore();
    }
  }
}
