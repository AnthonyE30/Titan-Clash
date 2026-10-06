import { Entity } from '../entities/entity.js';

export class BossAttack extends Entity {
  constructor({ x, y, width, height, vx = 0, vy = 0, life, attack, color, delay = 0, shape = 'orb' }) {
    super({ x, y, width, height });
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.delay = delay;
    this.attack = attack;
    this.color = color;
    this.shape = shape;
    this.hitIds = new Set();
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.delay = Math.max(0, this.delay - dt);
    if (this.delay === 0) this.life -= dt;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.delay > 0 ? .32 : .9;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.delay > 0 ? 10 : 24;
    ctx.fillStyle = this.delay > 0 ? '#ffe28a' : this.color;
    if (this.shape === 'beam') {
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else {
      ctx.beginPath();
      ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2,
        this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class BossAction {
  constructor(definition) {
    this.definition = definition;
    this.cooldownRemaining = 0;
    this.telegraphRemaining = 0;
    this.target = null;
  }

  get ready() { return this.cooldownRemaining <= 0 && this.telegraphRemaining <= 0; }

  start(boss, target, game) {
    if (!this.ready || boss.telegraph) return false;
    this.target = target;
    this.telegraphRemaining = this.definition.telegraph ?? .6;
    const mainPlatform = game.arena.platforms.find(platform => platform.type === 'main') ??
      game.arena.platforms[0];
    boss.telegraph = {
      label: this.definition.name,
      duration: this.telegraphRemaining,
      remaining: this.telegraphRemaining,
      style: this.definition.telegraphStyle,
      targetX: target ? target.x + target.width / 2 : undefined,
      targetY: target ? target.y + target.height / 2 : undefined,
      radius: this.definition.radius,
      direction: target
        ? Math.sign(target.x + target.width / 2 - boss.x - boss.width / 2) || boss.facing
        : boss.facing,
      range: this.definition.range ?? this.definition.maxRange ?? 900,
      laneCount: this.definition.count,
      laneWidth: this.definition.hazardWidth,
      laneHeight: this.definition.hazardHeight,
      laneY: mainPlatform ? mainPlatform.y - (this.definition.hazardHeight ?? 25) : undefined,
      platform: mainPlatform
    };
    if (this.telegraphRemaining === 0) this.execute(boss, game);
    return true;
  }

  update(dt, boss, game) {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining -
      dt * (boss.enraged ? 1 / boss.definition.enrage.cooldownMultiplier : 1));
    if (this.telegraphRemaining <= 0) return;
    this.telegraphRemaining = Math.max(0, this.telegraphRemaining - dt);
    if (boss.telegraph) boss.telegraph.remaining = this.telegraphRemaining;
    if (this.telegraphRemaining === 0) this.execute(boss, game);
  }

  execute(boss, game) {
    this.cooldownRemaining = this.definition.cooldown;
    const telegraph = boss.telegraph;
    boss.telegraph = null;
    executeBossAction(boss, this.definition, this.target, game, telegraph);
    boss.actionRecoveryRemaining = Math.max(boss.actionRecoveryRemaining,
      this.definition.recovery ?? 0);
    this.target = null;
  }

  cancel() {
    this.telegraphRemaining = 0;
    this.target = null;
    this.cooldownRemaining = Math.max(this.cooldownRemaining, .5);
  }
}

function executeBossAction(boss, definition, target, game, telegraph) {
  const bossX = boss.x + boss.width / 2;
  const bossY = boss.y + boss.height * .48;
  const targetX = telegraph?.targetX ?? (target ? target.x + target.width / 2 : bossX + boss.facing * 200);
  const targetY = telegraph?.targetY ?? (target ? target.y + target.height / 2 : bossY);
  const direction = telegraph?.style === 'beam'
    ? telegraph.direction
    : Math.sign(targetX - bossX) || boss.facing;
  const attack = {
    damage: definition.damage,
    knockback: definition.knockback ?? 210,
    scale: definition.scale ?? 2.8,
    launch: definition.launch ?? 160,
    launchRatio: definition.launchRatio ?? .4,
    hitstun: definition.hitstun ?? .22,
    weightReference: 1
  };
  const color = boss.definition.visual.accent;

  if (definition.kind === 'shield') {
    boss.shieldTime = Math.max(boss.shieldTime, definition.duration ?? 1);
    boss.shieldReduction = Math.max(boss.shieldReduction,
      Math.max(0, Math.min(1, definition.damageReduction ?? .5)));
    boss.shieldDroneCount = definition.droneCount ?? 3;
  } else if (definition.kind === 'beam') {
    const count = definition.count ?? 1;
    const beamRange = definition.range ?? definition.maxRange ?? 900;
    const startX = direction > 0
      ? Math.min(game.arena.width, bossX + boss.width * .28)
      : Math.max(0, bossX - beamRange);
    const endX = direction > 0
      ? Math.min(game.arena.width, bossX + beamRange)
      : Math.max(0, bossX - boss.width * .28);
    const width = Math.abs(endX - startX);
    for (let index = 0; index < count; index++) {
      const verticalOffset = (index - (count - 1) / 2) * (definition.verticalSpacing ?? 42);
      game.bossAttacks.push(new BossAttack({
        x: startX,
        y: bossY + verticalOffset - (definition.height ?? 30) / 2,
        width,
        height: definition.height ?? 30,
        life: definition.life ?? .35,
        attack,
        color,
        shape: 'beam'
      }));
    }
  } else if (definition.kind === 'volley') {
    const count = definition.count ?? 1;
    for (let index = 0; index < count; index++) {
      const spread = index - (count - 1) / 2;
      const vx = direction * (definition.speed ?? 380);
      const vy = (definition.verticalSpread ?? 0) * spread;
      game.bossAttacks.push(new BossAttack({
        x: bossX + direction * boss.width * .38,
        y: bossY + spread * 12,
        width: definition.width ?? 34,
        height: definition.height ?? 24,
        vx,
        vy,
        life: definition.life ?? 2.2,
        attack,
        color
      }));
    }
  } else if (definition.kind === 'swarm') {
    const count = definition.count ?? 5;
    for (let index = 0; index < count; index++) {
      const angle = Math.atan2(targetY - bossY, targetX - bossX) +
        (index - (count - 1) / 2) * (definition.spreadAngle ?? .14);
      const speed = definition.speed ?? 290;
      game.bossAttacks.push(new BossAttack({
        x: bossX + direction * boss.width * .35,
        y: bossY - 10,
        width: definition.width ?? 24,
        height: definition.height ?? 24,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: definition.life ?? 2.8,
        attack,
        color
      }));
    }
  } else if (definition.kind === 'missiles') {
    const count = definition.count ?? 5;
    for (let index = 0; index < count; index++) {
      const offset = (index - (count - 1) / 2) * (definition.spacing ?? 76);
      game.bossAttacks.push(new BossAttack({
        x: Math.max(0, Math.min(game.arena.width - 32, targetX + offset)),
        y: Math.max(35, target.y - (definition.heightAboveTarget ?? 330)),
        width: definition.width ?? 30,
        height: definition.height ?? 46,
        vx: (definition.drift ?? 18) * Math.sign(offset || 1),
        vy: definition.speed ?? 420,
        life: definition.life ?? 1.8,
        attack,
        color
      }));
    }
  } else if (definition.kind === 'charge') {
    boss.issueCommand({
      type: 'charge',
      direction,
      speed: definition.speed ?? 620,
      duration: definition.duration ?? .55,
      attack
    }, game);
  } else if (definition.kind === 'sweep') {
    const width = definition.width ?? 270;
    game.bossAttacks.push(new BossAttack({
      x: direction > 0 ? bossX + boss.width * .35 : bossX - boss.width * .35 - width,
      y: bossY - (definition.height ?? 120) / 2,
      width,
      height: definition.height ?? 120,
      life: definition.life ?? .24,
      attack,
      color
    }));
  } else if (definition.kind === 'hazards' || definition.kind === 'overload') {
    const mainPlatform = game.arena.platforms.find(platform => platform.type === 'main') ?? game.arena.platforms[0];
    const count = definition.kind === 'overload' ? 3 : definition.count ?? 2;
    const hazardWidth = definition.hazardWidth ?? 110;
    for (let index = 0; index < count; index++) {
      const offset = count === 1 ? 0 : (index - (count - 1) / 2) * (hazardWidth + 22);
      const x = Math.max(mainPlatform.x, Math.min(
        mainPlatform.x + mainPlatform.width - hazardWidth,
        targetX + offset - hazardWidth / 2
      ));
      game.bossHazards.push({
        x,
        y: mainPlatform.y - (definition.hazardHeight ?? 25),
        width: hazardWidth,
        height: definition.hazardHeight ?? 25,
        warningTime: definition.warningTime ?? .8,
        activeTime: definition.activeTime ?? .36,
        damage: definition.damage,
        attack,
        color,
        hitIds: new Set()
      });
    }
    if (definition.kind === 'overload') {
      game.bossAttacks.push(new BossAttack({
        x: bossX - (definition.radius ?? 230),
        y: bossY - (definition.radius ?? 230),
        width: (definition.radius ?? 230) * 2,
        height: (definition.radius ?? 230) * 2,
        life: definition.life ?? .28,
        delay: definition.warningTime ?? .8,
        attack,
        color
      }));
    }
  } else {
    throw new Error(`Unknown boss action kind: ${definition.kind}`);
  }
}
