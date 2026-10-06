import { Camera } from './camera.js';
import { overlaps } from './collision.js';
import { Engine } from './engine.js';
import { Effect } from './entities/effect.js';
import { Fighter } from './entities/fighter.js';
import { Boss } from './entities/boss.js';
import { Projectile } from './entities/projectile.js';
import { BossAttack } from './boss/bossActions.js';
import { Input } from './input.js';
import { ParticleEngine } from './particleEngine.js';
import { Renderer } from './renderer.js';
import { UIManager } from '../ui/uiManager.js';
import { ARENAS } from '../data/arenaData.js';
import { MECHS } from '../data/mechData.js';
import { AIController } from './ai/aiController.js';
import { BOSSES } from '../data/bosses/index.js';
import { ArenaEventManager } from './arena/arenaEventManager.js';
import { UltimateManager } from './ultimate/ultimateManager.js';
import { TrainingManager } from './training/trainingManager.js';
import {
  calculateBossRushGrade,
  createBossRushBossDefinition,
  createBossRushState
} from './boss/bossRush.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.input = new Input(canvas);
    this.camera = new Camera(canvas.width, canvas.height);
    this.renderer = new Renderer(canvas, this.camera);
    this.ui = new UIManager();
    this.engine = new Engine(this);
    this.time = 0;
    this.paused = false;
    this.roundOver = false;
    this.arena = ARENAS.orbitalShipyard;
    this.arenaEvents = new ArenaEventManager(this.arena);
    this.ultimateManager = new UltimateManager();
    this.fighters = [];
    this.boss = null;
    this.bossAttacks = [];
    this.bossHazards = [];
    this.bossEndTimer = 0;
    this.projectiles = [];
    this.effects = new ParticleEngine();
    this.matchConfig = null;
    this.hitStopRemaining = 0;
    this.aiControllers = [];
    this.trainingManager = null;
    this.pausedStepFrames = 0;
    this.profileManager = null;
    this.profileMatchRecorded = false;
    this.bossRush = null;
  }

  start() { this.engine.start(); }

  startMatch(config) {
    const isBossMode = config.mode === 'boss' || config.mode === 'boss-rush';
    const mechIds = isBossMode ? config.mechIds.slice(0, 1) : config.mechIds;
    const mechConfigs = mechIds.map(id => MECHS[id]);
    if (mechConfigs.some(mech => !mech)) throw new Error('Match configuration references an unknown mech.');
    const rush = config.mode === 'boss-rush' ? createBossRushState(config) : null;
    const bossId = rush?.bossIds[0] ?? config.bossId;
    const bossDefinition = isBossMode
      ? rush
        ? createBossRushBossDefinition(bossId, rush.difficulty)
        : BOSSES[bossId]
      : null;
    if (isBossMode && !bossDefinition) throw new Error(`Unknown boss: ${bossId}`);
    const arenaId = bossDefinition?.arenaId ?? config.arenaId;
    const arena = ARENAS[arenaId];
    if (!arena) throw new Error(`Unknown arena: ${arenaId}`);
    for (const { controller } of this.aiControllers) this.input.setVirtualKeys(controller.source, []);
    this.input.setVirtualKeys('training-dummy', []);
    this.matchConfig = {
      ...config,
      bossId,
      bossIds: rush?.bossIds ?? config.bossIds,
      difficulty: rush?.difficulty ?? config.difficulty,
      arenaId,
      aiProfile: isBossMode ? '' : config.aiProfile || '',
      trainingOptions: config.mode === 'training'
        ? { infiniteStocks: true, infiniteUltimate: true, infiniteCooldowns: true, ...config.trainingOptions }
        : config.trainingOptions,
      mechIds: [...mechIds]
    };
    this.bossRush = rush;
    this.profileMatchRecorded = false;
    if (config.mode === 'training') this.profileManager?.recordTrainingSession();
    this.aiControllers = this.matchConfig.aiProfile && this.matchConfig.mode !== 'training'
      ? [{ playerIndex: 1, controller: new AIController(this.matchConfig.aiProfile) }]
      : [];
    this.arena = { ...arena };
    this.arenaEvents = new ArenaEventManager(this.arena);
    this.arena.eventManager = this.arenaEvents;
    this.ultimateManager = new UltimateManager();
    this.fighters = mechConfigs.map((mech, index) => new Fighter({
      config: mech,
      playerIndex: index,
      x: arena.spawnPoints[index].x - mech.visual.width / 2,
      y: arena.spawnPoints[index].y - mech.visual.height
    }));
    this.trainingManager = config.mode === 'training'
      ? new TrainingManager(config.dummyBehavior ?? 'idle')
      : null;
    if (this.trainingManager && config.trainingOptions) {
      Object.assign(this.trainingManager.options, this.matchConfig.trainingOptions);
    }
    this.boss = bossDefinition ? new Boss({
      definition: bossDefinition,
      x: Math.max(0, Math.min(arena.width - bossDefinition.size.width, bossDefinition.spawn.x)),
      y: bossDefinition.spawn.y
    }) : null;
    this.bossAttacks = [];
    this.bossHazards = [];
    this.bossEndTimer = 0;
    if (config.mode === 'last') this.fighters.forEach(fighter => { fighter.stocks = 1; });
    this.projectiles = [];
    this.effects = new ParticleEngine();
    this.hitStopRemaining = 0;
    this.time = 0;
    this.roundTime = 180;
    this.paused = false;
    this.pausedStepFrames = 0;
    this.roundOver = false;
    this.ui.hideVictory();
    this.ui.hideRushIntermission();
    this.ui.hidePause();
    this.ui.setBoss(this.boss);
    this.ui.announce(this.boss
      ? `${this.boss.name.toUpperCase()} // AWAKENING`
      : '3   2   1   FIGHT!', this.boss ? this.boss.definition.cinematic.introDuration : 1.5);
    this.fighters.forEach((fighter, index) => this.ui.setFighter(index, fighter));
    this.camera.x = arena.width / 2;
    this.camera.y = arena.height * .44;
  }

  togglePause() {
    if (!this.matchConfig || this.roundOver || this.bossRush?.intermission) return;
    this.paused = !this.paused;
    if (this.paused) this.ui.showPause();
    else this.ui.hidePause();
    this.ui.announce(this.paused ? 'PAUSED' : 'RESUME', .75);
    this.ui.update(this, 0);
  }

  stepPausedFrames(frames = 1) {
    if (!this.paused || !this.trainingManager || this.roundOver) return;
    this.pausedStepFrames += Math.max(1, Math.floor(frames));
    this.ui.update(this, 0);
  }

  update(dt) {
    if (this.paused && this.pausedStepFrames <= 0) {
      this.ui.update(this, 0);
      return;
    }
    if (this.paused) {
      dt = 1 / 60;
      this.pausedStepFrames--;
    }
    if (this.hitStopRemaining > 0) {
      this.hitStopRemaining = Math.max(0, this.hitStopRemaining - dt);
      this.camera.advanceShake(dt);
      this.ui.update(this, 0);
      return;
    }
    if (this.bossRush?.intermission) {
      this.ui.update(this, 0);
      return;
    }
    this.time += dt;
    if (!this.matchConfig) return;
    if (this.bossEndTimer > 0) {
      this.bossEndTimer = Math.max(0, this.bossEndTimer - dt);
      this.updateEffects(dt);
      this.camera.advanceShake(dt);
      if (this.bossEndTimer === 0) {
        const playerAlive = this.fighters[0]?.stocks > 0;
        if (this.bossRush) {
          if (playerAlive) {
            this.bossRush.bossesCleared++;
            this.profileManager?.recordBossDefeated();
          }
          if (playerAlive && this.bossRush.index + 1 < this.bossRush.bossIds.length) {
            this.bossRush.intermission = { bossName: this.boss.name };
            this.ui.showRushIntermission({
              bossName: this.bossRush.intermission.bossName,
              bossesCleared: this.bossRush.bossesCleared,
              bossCount: this.bossRush.bossIds.length,
              time: this.time,
              damageTaken: this.bossRush.damageTaken,
              deaths: this.bossRush.deaths
            });
          } else {
            this.finishBossRush(playerAlive && this.bossRush.bossesCleared === this.bossRush.bossIds.length);
          }
        } else {
          this.roundOver = true;
          this.recordProfileResult(playerAlive ? 'win' : 'loss');
          if (playerAlive) this.profileManager?.recordBossDefeated();
          this.ui.showVictory(playerAlive ? 'BOSS DEFEATED' : 'DEFEAT', playerAlive
            ? `${this.boss.name.toUpperCase()} HAS BEEN DESTROYED`
            : `${this.fighters[0].config.name.toUpperCase()} WAS DESTROYED`);
        }
      }
      this.ui.update(this, dt);
      return;
    }
    if (this.roundOver) {
      this.effects.update(dt);
      this.effects.compact();
      this.camera.advanceShake(dt);
      this.ui.update(this, dt);
      return;
    }
    if (this.boss?.state === 'intro') {
      this.boss.update(dt, this);
      this.camera.update([...this.fighters, this.boss], this.arena, dt);
      this.ui.update(this, dt);
      return;
    }
    if (this.matchConfig.mode === 'timed') {
      this.roundTime = Math.max(0, this.roundTime - dt);
      if (this.roundTime === 0) this.finishTimedRound();
    }
    for (const { playerIndex, controller } of this.aiControllers) {
      const fighter = this.fighters[playerIndex];
      const opponent = this.fighters.find((_, index) => index !== playerIndex);
      if (fighter && opponent) controller.update(fighter, opponent, this.arena, this, dt);
    }
    this.trainingManager?.update(this, dt);
    if (this.boss) this.boss.update(dt, this);
    for (const fighter of this.fighters) {
      if (fighter.stocks <= 0) continue;
      if (fighter.respawnTime > 0) {
        fighter.respawnTime -= dt;
        if (fighter.respawnTime <= 0) fighter.respawn(this.arena.spawnPoints[fighter.playerIndex]);
        continue;
      }
      const wasGrounded = fighter.onGround;
      fighter.move(this.input, dt, this.arena);
      if (fighter.dashStarted) {
        if (fighter.dashWasAirborne) {
          this.effects.burst({
            x: fighter.x + fighter.width / 2,
            y: fighter.y + fighter.height * .72,
            color: fighter.config.visual.accent,
            type: 'energy',
            count: 10,
            size: 15,
            speed: 170,
            life: .28
          });
        }
        fighter.dashStarted = false;
      }
      const dashing = fighter.dashTime > 0;
      const usingThrusters = !fighter.onGround && (fighter.vy < -90 || fighter.hoverTime > 0);
      if ((dashing || usingThrusters) && fighter.trailTimer <= 0) {
        this.effects.emit({
          x: fighter.x + fighter.width / 2 - fighter.facing * fighter.width * .3,
          y: fighter.y + fighter.height * .76,
          color: dashing ? fighter.config.visual.accent : '#72e9ff',
          type: 'exhaust',
          size: dashing ? 15 : 9,
          vx: -fighter.facing * (dashing ? 115 : 25),
          vy: 35,
          life: dashing ? .24 : .18
        });
        fighter.trailTimer = .035;
      }
      if (usingThrusters && fighter.thrusterTimer <= 0) {
        this.effects.burst({
          x: fighter.x + fighter.width / 2,
          y: fighter.y + fighter.height * .86,
          color: '#56ddff',
          type: 'exhaust',
          count: 2,
          size: 7,
          speed: 75,
          life: .17,
          spread: .9
        });
        fighter.thrusterTimer = .075;
      }
      fighter.trailTimer = Math.max(0, fighter.trailTimer - dt);
      fighter.thrusterTimer = Math.max(0, fighter.thrusterTimer - dt);
      this.processFighterInput(fighter);
      fighter.updateAttack(dt);
      if (!wasGrounded && fighter.onGround) {
        this.effects.burst({
          x: fighter.x + fighter.width / 2,
          y: fighter.y + fighter.height,
          color: '#a9c8c8',
          type: 'dust',
          count: 9,
          size: 17,
          speed: 95,
          life: .32
        });
        this.camera.shakeNow(.09);
      }
      if (fighter.y > this.arena.height + 130 || fighter.x < -300 || fighter.x > this.arena.width + 300) this.loseStock(fighter);
    }
    this.arenaEvents.update(dt, { game: this, arena: this.arena });
    this.ultimateManager.update(dt, { game: this, arena: this.arena });
    this.resolveAttacks();
    this.updateProjectiles(dt);
    this.updateBossAttacks(dt);
    this.updateBossHazards(dt);
    this.updateEffects(dt);
    this.applyTrainingOptions();
    this.camera.update(this.boss ? [...this.fighters, this.boss] : this.fighters, this.arena, dt);
    this.checkWinner();
    this.ui.update(this, dt);
  }

  applyTrainingOptions() {
    if (!this.trainingManager) return;
    for (const fighter of this.fighters) {
      if (this.trainingManager.options.infiniteUltimate) fighter.ultimateReady = true;
      if (this.trainingManager.options.infiniteCooldowns) {
        fighter.specialCooldown = 0;
        fighter.dashCooldown = 0;
        if (!fighter.currentAttack) fighter.attackCooldown = 0;
      }
    }
  }

  resetTrainingFighter(fighter) {
    const spawn = this.arena.spawnPoints[fighter.playerIndex];
    fighter.x = spawn.x - fighter.width / 2;
    fighter.y = spawn.y - fighter.height;
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.onGround = false;
    fighter.coyote = 0;
    fighter.jumpBuffer = 0;
    fighter.airJumps = fighter.config.movement.extraJumps;
    fighter.airDashes = fighter.config.movement.airDashes;
    fighter.hitstun = 0;
    fighter.hitPause = 0;
    fighter.currentAttack = null;
    fighter.attackCooldown = 0;
    fighter.dashTime = 0;
    fighter.dashCooldown = 0;
    fighter.dashStarted = false;
    fighter.specialCooldown = 0;
    fighter.respawnTime = 0;
    fighter.grabbedTarget = null;
    fighter.invincible = 0;
    fighter.blocking = false;
    fighter.fastFalling = false;
    fighter.dropThrough = 0;
    fighter.landingRecovery = 0;
    fighter.wallJumpCooldown = 0;
    fighter.barrierTime = 0;
    fighter.hoverTime = 0;
    fighter.runTime = 0;
    fighter.combo = 0;
    fighter.comboTimer = 0;
    fighter.attackHitIds.clear();
    fighter.lastDamageResult = null;
    fighter.passives.emit('onSpawn', { fighter });
    this.trainingManager?.clearInputs(this.input);
  }

  resetTrainingPositions() {
    if (!this.trainingManager) return;
    this.trainingManager.behaviorTimer = 0;
    this.trainingManager.pulseTimer = 0;
    for (const fighter of this.fighters) this.resetTrainingFighter(fighter);
  }

  processFighterInput(fighter) {
    const { controls } = fighter;
    if (this.input.justPressed(controls.attack)) {
      if (fighter.grabbedTarget && fighter.grabbedTarget.stocks > 0) this.performThrow(fighter);
      else if (this.input.down(controls.block) && fighter.onGround) this.startGrab(fighter);
      else this.startConfiguredAttack(fighter);
    }
    if (this.input.justPressed(controls.special)) this.useSpecial(fighter);
    if (fighter.config.abilities.secondary && this.input.justPressed(controls.secondary)) {
      this.useSpecial(fighter, true);
    }
    if (this.input.justPressed(controls.ultimate)) this.useUltimate(fighter);
  }

  startConfiguredAttack(fighter) {
    const c = fighter.controls;
    const horizontal = Number(this.input.down(c.right)) - Number(this.input.down(c.left));
    const vertical = Number(this.input.down(c.down)) - Number(this.input.down(c.up));
    let name;
    if (fighter.dashTime > 0 || (fighter.onGround && Math.abs(fighter.vx) > fighter.config.stats.speed * .8)) name = 'dashAttack';
    else if (!fighter.onGround) {
      if (vertical < 0) name = 'uair';
      else if (vertical > 0) name = 'dair';
      else if (horizontal) name = horizontal === fighter.facing ? 'fair' : 'bair';
      else name = 'nair';
    } else if (vertical < 0) name = 'up';
    else if (vertical > 0) name = 'down';
    else if (horizontal) name = 'side';
    else name = 'neutral';
    const move = name === 'bair'
      ? { ...fighter.config.attacks[name], facingMultiplier: -1 }
      : fighter.config.attacks[name];
    fighter.attack(move);
  }

  startGrab(fighter) {
    if (fighter.attackCooldown > 0 || fighter.hitstun > 0) return;
    fighter.attack(fighter.config.attacks.grab);
    if (fighter.currentAttack) fighter.currentAttack.isGrab = true;
  }

  performThrow(fighter) {
    const target = fighter.grabbedTarget;
    fighter.grabbedTarget = null;
    if (!target || target.stocks <= 0) return;
    target.blocking = false;
    target.invincible = 0;
    if (!target.receiveHit(fighter.config.attacks.throw, fighter.x + fighter.width / 2)) return;
    const blocked = target.lastDamageResult?.blocked ?? false;
    if (!blocked) {
      this.recordProfileDamage(fighter, target, target.lastDamageResult.damage);
      target.lastHitByPlayerIndex = fighter.playerIndex;
    }
    fighter.passives.emit('onAttackHit', {
      fighter,
      target,
      attack: fighter.config.attacks.throw,
      blocked
    });
    if (!blocked) {
      fighter.passives.emit('onDamageDealt', {
        fighter,
        target,
        attack: fighter.config.attacks.throw,
        damage: target.lastDamageResult.damage
      });
    }
    target.hitPause = .06;
    target.landingRecovery = .2;
    this.triggerHitStop({ damage: fighter.config.attacks.throw.damage });
    this.camera.shakeNow(.32);
    this.effects.emit({ x: target.x + target.width / 2, y: target.y + target.height / 2, color: fighter.config.visual.accent, type: 'impact', size: 36, life: .32 });
    this.effects.burst({ x: target.x + target.width / 2, y: target.y + target.height / 2, color: fighter.config.visual.accent, type: 'spark', count: 9, size: 13, speed: 250 });
  }

  resolveAttacks() {
    for (const attacker of this.fighters) {
      if (!attacker.currentAttack || attacker.stocks <= 0) continue;
      for (const target of this.fighters) {
        if (target === attacker || attacker.attackHitIds.has(target.id) || !attacker.canHit(target, this.arena)) continue;
        if (attacker.currentAttack.isGrab) {
          attacker.grabbedTarget = target;
          attacker.passives.emit('onAttackHit', {
            fighter: attacker,
            target,
            attack: attacker.currentAttack,
            blocked: false
          });
          target.vx = attacker.facing * 65;
          target.vy = 0;
          target.hitstun = .6;
          attacker.attackHitIds.add(target.id);
          attacker.currentAttack = null;
          this.ui.announce('GRAB!  ATTACK TO THROW', .9);
          continue;
        }
        if (target.receiveHit(attacker.currentAttack, attacker.x + attacker.width / 2)) {
          attacker.attackHitIds.add(target.id);
          this.onHit(attacker, target, attacker.currentAttack);
        }
      }
      if (this.boss?.state === 'active' && !attacker.attackHitIds.has(this.boss.id) &&
          attacker.canHit(this.boss, this.arena)) {
        attacker.attackHitIds.add(this.boss.id);
        if (this.boss.receiveHit(attacker.currentAttack, attacker.x + attacker.width / 2)) {
          this.onBossHit(attacker, this.boss, attacker.currentAttack);
        }
      }
      if (this.boss?.charge) this.resolveBossCharge();
    }
  }

  onBossHit(attacker, boss, attack) {
    attacker.combo++;
    attacker.comboTimer = 1.25;
    attacker.passives.emit('onAttackHit', {
      fighter: attacker,
      target: boss,
      attack,
      blocked: false
    });
    attacker.passives.emit('onDamageDealt', {
      fighter: attacker,
      target: boss,
      attack,
      damage: boss.lastDamageResult?.damage ?? attack.damage ?? 0
    });
    if (attacker === this.fighters[0] && this.matchConfig?.mode !== 'training') {
      this.profileManager?.recordDamageDealt(boss.lastDamageResult?.damage ?? attack.damage ?? 0);
    }
    const x = boss.x + boss.width / 2;
    const y = boss.y + boss.height / 2;
    const critical = (attack.damage ?? 0) >= 15;
    this.triggerHitStop(attack);
    this.camera.shakeNow(critical ? .42 : .2);
    this.effects.emit({ x, y, color: '#f5ffff', type: 'impact', size: critical ? 38 : 27, life: .3 });
    this.effects.burst({
      x, y, color: attacker.config.visual.accent, type: 'spark',
      count: critical ? 12 : 7, size: critical ? 17 : 12, speed: 280, life: .34
    });
    if (boss.health === 0) this.beginBossVictory();
  }

  resolveBossCharge() {
    const { charge } = this.boss;
    const direction = charge.direction;
    const hitbox = {
      x: direction > 0 ? this.boss.x + this.boss.width * .45 : this.boss.x - this.boss.width * .55,
      y: this.boss.y + this.boss.height * .2,
      width: this.boss.width * 1.1,
      height: this.boss.height * .65
    };
    for (const fighter of this.fighters) {
      if (fighter.stocks <= 0 || charge.hitIds.has(fighter.id) || !overlaps(hitbox, fighter)) continue;
      charge.hitIds.add(fighter.id);
      if (fighter.receiveHit(charge.attack, this.boss.x + this.boss.width / 2)) this.onBossAttackHit(fighter, charge.attack);
    }
  }

  onHit(attacker, target, attack = attacker.currentAttack) {
    attacker.combo++;
    attacker.comboTimer = 1.25;
    const damage = attack?.damage ?? 0;
    const blocked = target.lastDamageResult?.blocked ?? false;
    attacker.passives.emit('onAttackHit', { fighter: attacker, target, attack, blocked });
    if (!blocked) {
      if (this.trainingManager && attacker === this.fighters[0]) {
        this.trainingManager.recordDamage(target.lastDamageResult?.damage ?? damage, this.time);
      }
      this.recordProfileDamage(attacker, target, target.lastDamageResult?.damage ?? damage);
      if (target instanceof Fighter) target.lastHitByPlayerIndex = attacker.playerIndex;
      attacker.passives.emit('onDamageDealt', {
        fighter: attacker,
        target,
        attack,
        damage: target.lastDamageResult?.damage ?? damage
      });
    }

    const critical = damage >= 15;
    this.triggerHitStop({ damage });
    this.camera.shakeNow(damage >= 16 ? .58 : damage >= 9 ? .32 : .16);
    const x = target.x + target.width / 2;
    const y = target.y + target.height / 2;
    this.effects.emit({ x, y, color: '#f5ffff', type: 'impact', size: critical ? 38 : 25, life: .3 });
    this.effects.burst({ x, y, color: attacker.config.visual.accent, type: 'spark', count: critical ? 12 : 7, size: critical ? 17 : 12, speed: critical ? 330 : 245, life: .34 });
    this.effects.burst({ x, y, color: critical ? '#ffe28a' : '#a7ffff', type: 'energy', count: critical ? 6 : 3, size: critical ? 12 : 8, speed: 140, life: .3 });
    if (critical) {
      this.effects.emit({ x, y: y - 34, color: '#ffe28a', type: 'critical', text: 'CRITICAL', size: 20, vy: -55, life: .7 });
      this.effects.emit({ x, y, color: '#ffe28a', type: 'explosion', size: 30, life: .36 });
    }
    this.ui.announce(attacker.combo > 1 ? `${attacker.combo} HIT COMBO` : 'HIT!', .35);
  }

  recordProfileDamage(attacker, target, damage) {
    if (this.matchConfig?.mode === 'training') return;
    if (attacker === this.fighters[0]) this.profileManager?.recordDamageDealt(damage);
    if (target === this.fighters[0]) {
      this.profileManager?.recordDamageTaken(damage);
      if (this.bossRush) this.bossRush.damageTaken += Math.max(0, damage);
    }
  }

  recordProfileResult(result) {
    if (this.profileMatchRecorded || !this.profileManager || this.matchConfig?.mode === 'training') return;
    this.profileMatchRecorded = true;
    this.profileManager.recordMatchCompleted(result, this.matchConfig.mechIds[0]);
  }

  onArenaEventHit(fighter, event, attack) {
    if (fighter === this.fighters[0] && !fighter.lastDamageResult?.blocked &&
        this.matchConfig?.mode !== 'training') {
      this.profileManager?.recordDamageTaken(fighter.lastDamageResult?.damage ?? attack.damage ?? 0);
      if (this.bossRush) {
        this.bossRush.damageTaken += Math.max(0, fighter.lastDamageResult?.damage ?? attack.damage ?? 0);
      }
    }
    const x = fighter.x + fighter.width / 2;
    const y = fighter.y + fighter.height / 2;
    this.triggerHitStop(attack);
    this.camera.shakeNow(event.severity === 'critical' ? .58 : event.severity === 'high' ? .38 : .2);
    this.effects.emit({ x, y, color: '#fff1d0', size: 28, type: 'impact', life: .3 });
    this.effects.burst({
      x, y,
      color: event.severity === 'critical' ? '#ff3d48' : '#ffb45e',
      size: 13,
      type: 'spark',
      count: 8,
      speed: 230,
      life: .34
    });
  }

  triggerHitStop(attack) {
    const frames = Math.min(6, 2 + Math.floor((attack.damage ?? 0) / 5));
    this.hitStopRemaining = Math.max(this.hitStopRemaining, frames / 60);
  }

  useSpecial(fighter, useSecondary = false) {
    const ability = useSecondary && fighter.config.abilities.secondary
      ? fighter.config.abilities.secondary
      : fighter.config.abilities.special;
    if (fighter.specialCooldown > 0 || fighter.hitstun > 0 || fighter.stocks <= 0) return;
    fighter.specialCooldown = ability.cooldown;
    const x = fighter.x + fighter.width / 2 + fighter.facing * (fighter.width / 2);
    const y = fighter.y + fighter.height * .43;
    if (ability.kind === 'projectile' || ability.kind === 'spread') {
      const count = ability.count ?? 1;
      for (let i = 0; i < count; i++) {
        const direction = fighter.facing;
        const projectile = new Projectile({ x, y: y - (i - (count - 1) / 2) * 15, direction, owner: fighter, definition: ability.projectile, color: fighter.config.visual.accent });
        projectile.attack = { ...ability.attack };
        this.projectiles.push(projectile);
      }
      this.effects.push(new Effect({ x, y, color: fighter.config.visual.accent, type: 'burst', size: 24, life: .2 }));
    } else if (ability.kind === 'melee') {
      const move = fighter.attack({ ...ability.attack, cooldown: ability.cooldown });
      if (move) move.elapsed = 0;
    } else if (ability.kind === 'blink') {
      fighter.x = Math.max(0, Math.min(this.arena.width - fighter.width, fighter.x + fighter.facing * ability.distance));
      fighter.invincible = .25;
      this.effects.push(new Effect({ x: fighter.x + fighter.width / 2, y: y, color: fighter.config.visual.accent, type: 'burst', size: 50 }));
    } else if (ability.kind === 'barrier') {
      fighter.barrierTime = ability.duration;
      fighter.blocking = true;
      this.effects.push(new Effect({ x: fighter.x + fighter.width / 2, y: y, color: fighter.config.visual.accent, type: 'burst', size: 62 }));
    } else if (ability.kind === 'hover') {
      fighter.hoverTime = ability.duration;
      fighter.vy = Math.min(fighter.vy, 0);
      this.effects.push(new Effect({ x, y: fighter.y + fighter.height, color: fighter.config.visual.accent, type: 'burst', size: 36 }));
    } else if (ability.kind === 'beam') {
      const target = this.boss?.state === 'active'
        ? this.boss
        : this.fighters.find(other => other !== fighter);
      const targetIsBoss = Boolean(target && target === this.boss);
      const targetY = targetIsBoss ? target.y + target.height / 2 : target?.y;
      const fighterY = targetIsBoss ? fighter.y + fighter.height / 2 : fighter.y;
      if (target && Math.abs(target.x + target.width / 2 - x) < ability.width &&
          Math.abs(targetY - fighterY) < 90 && target.receiveHit(ability, x)) {
        if (targetIsBoss) this.onBossHit(fighter, target, ability);
        else this.onHit(fighter, target, ability);
      }
      this.effects.push(new Effect({ x: x + fighter.facing * ability.width / 2, y, color: fighter.config.visual.accent, type: 'burst', size: ability.width }));
    }
    this.ui.announce(ability.name.toUpperCase(), .7);
  }

  useUltimate(fighter) {
    const ability = fighter.config.abilities.ultimate;
    if (!fighter.ultimateReady || fighter.hitstun > 0 || fighter.stocks <= 0) return;
    fighter.ultimateReady = false;
    fighter.passives.emit('onUltimateUsed', { fighter, ability });
    this.ultimateManager.activate(fighter, ability, { game: this, arena: this.arena });
    this.camera.shakeNow(.42);
    this.ui.announce(fighter.config.abilities.ultimate.name.toUpperCase(), 1.1);
  }

  applyUltimateHit(attacker, target, attack, sourceX) {
    if (!target.receiveHit(attack, sourceX)) return false;
    if (target === this.boss) this.onBossHit(attacker, target, attack);
    else this.onHit(attacker, target, attack);
    return true;
  }

  updateProjectiles(dt) {
    for (const projectile of this.projectiles) {
      projectile.update(dt);
      const target = this.fighters.find(fighter => fighter.playerIndex !== projectile.team && fighter.stocks > 0 && overlaps(projectile, fighter));
      if (target && target.receiveHit(projectile.attack, projectile.owner.x + projectile.owner.width / 2)) {
        projectile.active = false;
        this.onHit(projectile.owner, target, projectile.attack);
      }
      if (!target && this.boss?.state === 'active' && projectile.owner.playerIndex !== undefined &&
          overlaps(projectile, this.boss)) {
        projectile.active = false;
        if (this.boss.receiveHit(projectile.attack, projectile.owner.x + projectile.owner.width / 2)) {
          this.onBossHit(projectile.owner, this.boss, projectile.attack);
        }
      }
      if (projectile.x < -100 || projectile.x > this.arena.width + 100) projectile.active = false;
    }
    this.projectiles = this.projectiles.filter(projectile => projectile.active);
  }

  updateBossAttacks(dt) {
    for (const attack of this.bossAttacks) {
      attack.update(dt);
      if (!attack.active || attack.delay > 0) continue;
      for (const fighter of this.fighters) {
        if (fighter.stocks <= 0 || attack.hitIds.has(fighter.id) || !overlaps(attack, fighter)) continue;
        attack.hitIds.add(fighter.id);
        if (fighter.receiveHit(attack.attack, this.boss.x + this.boss.width / 2)) {
          this.onBossAttackHit(fighter, attack.attack);
        }
      }
    }
    this.bossAttacks = this.bossAttacks.filter(attack => attack.active);
  }

  updateBossHazards(dt) {
    for (const hazard of this.bossHazards) {
      if (hazard.warningTime > 0) {
        hazard.warningTime = Math.max(0, hazard.warningTime - dt);
        continue;
      }
      if (hazard.activeTime <= 0) continue;
      hazard.activeTime = Math.max(0, hazard.activeTime - dt);
      for (const fighter of this.fighters) {
        if (fighter.stocks <= 0 || hazard.hitIds.has(fighter.id) || !overlaps(hazard, fighter)) continue;
        hazard.hitIds.add(fighter.id);
        if (fighter.receiveHit(hazard.attack, this.boss.x + this.boss.width / 2)) {
          this.onBossAttackHit(fighter, hazard.attack);
        }
      }
    }
    this.bossHazards = this.bossHazards.filter(hazard => hazard.warningTime > 0 || hazard.activeTime > 0);
  }

  onBossAttackHit(fighter, attack) {
    if (fighter === this.fighters[0] && !fighter.lastDamageResult?.blocked &&
        this.matchConfig?.mode !== 'training') {
      this.profileManager?.recordDamageTaken(fighter.lastDamageResult?.damage ?? attack.damage ?? 0);
      if (this.bossRush) {
        this.bossRush.damageTaken += Math.max(0, fighter.lastDamageResult?.damage ?? attack.damage ?? 0);
      }
    }
    this.triggerHitStop(attack);
    this.camera.shakeNow((attack.damage ?? 0) >= 15 ? .46 : .25);
    const x = fighter.x + fighter.width / 2;
    const y = fighter.y + fighter.height / 2;
    this.effects.emit({ x, y, color: '#fff3c2', type: 'impact', size: 32, life: .32 });
    this.effects.burst({
      x, y, color: this.boss.definition.visual.accent, type: 'spark',
      count: 10, size: 15, speed: 260, life: .36
    });
  }

  beginBossVictory() {
    if (!this.boss || this.bossEndTimer > 0 || this.roundOver) return;
    this.boss.state = 'defeated';
    this.boss.stocks = 0;
    this.boss.telegraph = null;
    this.bossEndTimer = this.boss.definition.cinematic.defeatDuration;
    this.camera.shakeNow(1);
    const x = this.boss.x + this.boss.width / 2;
    const y = this.boss.y + this.boss.height / 2;
    this.effects.emit({ x, y, color: this.boss.definition.visual.enrage, type: 'explosion', size: 135, life: 1 });
    this.effects.burst({
      x, y, color: this.boss.definition.visual.accent, type: 'ko',
      count: 30, size: 27, speed: 510, life: .9
    });
    this.ui.announce(`${this.boss.name.toUpperCase()} // REACTOR FAILURE`, this.bossEndTimer);
  }

  advanceBossRush() {
    this.bossRush.index++;
    const bossId = this.bossRush.bossIds[this.bossRush.index];
    const definition = createBossRushBossDefinition(bossId, this.bossRush.difficulty);
    const arenaDefinition = ARENAS[definition.arenaId];
    if (!arenaDefinition) throw new Error(`Unknown arena: ${definition.arenaId}`);
    this.matchConfig.bossId = bossId;
    this.matchConfig.arenaId = definition.arenaId;
    this.arena = { ...arenaDefinition };
    this.arenaEvents = new ArenaEventManager(this.arena);
    this.arena.eventManager = this.arenaEvents;
    this.boss = new Boss({
      definition,
      x: Math.max(0, Math.min(this.arena.width - definition.size.width, definition.spawn.x)),
      y: definition.spawn.y
    });
    this.bossAttacks = [];
    this.bossHazards = [];
    this.projectiles = [];
    this.effects = new ParticleEngine();
    this.hitStopRemaining = 0;
    this.ultimateManager = new UltimateManager();
    const fighter = this.fighters[0];
    const stocks = fighter.stocks;
    fighter.respawn(this.arena.spawnPoints[0]);
    fighter.stocks = stocks;
    fighter.attackCooldown = 0;
    fighter.jumpBuffer = 0;
    fighter.coyote = 0;
    fighter.onGround = false;
    fighter.fastFalling = false;
    fighter.dropThrough = 0;
    fighter.landingRecovery = 0;
    fighter.hitPause = 0;
    fighter.flash = 0;
    fighter.dashTime = 0;
    fighter.barrierTime = 0;
    fighter.hoverTime = 0;
    fighter.runTime = 0;
    fighter.wallJumpCooldown = 0;
    fighter.trailTimer = 0;
    fighter.thrusterTimer = 0;
    fighter.dashStarted = false;
    fighter.dashWasAirborne = false;
    fighter.attackHitIds.clear();
    fighter.blocking = false;
    fighter.facing = this.boss.x > fighter.x ? 1 : -1;
    this.ui.setBoss(this.boss);
    this.ui.announce(
      `BOSS RUSH ${this.bossRush.index + 1}/${this.bossRush.bossIds.length} // ${this.boss.name.toUpperCase()}`,
      definition.cinematic.introDuration
    );
    this.camera.x = this.arena.width / 2;
    this.camera.y = this.arena.height * .44;
  }

  continueBossRush() {
    if (!this.bossRush?.intermission || this.roundOver) return;
    this.bossRush.intermission = null;
    this.ui.hideRushIntermission();
    this.advanceBossRush();
    this.ui.update(this, 0);
  }

  finishBossRush(cleared) {
    if (this.bossRush.resultRecorded) return;
    this.bossRush.resultRecorded = true;
    this.roundOver = true;
    this.recordProfileResult(cleared ? 'win' : 'loss');
    const result = {
      cleared,
      difficulty: this.bossRush.difficulty,
      time: this.time,
      deaths: this.bossRush.deaths,
      damageTaken: this.bossRush.damageTaken,
      bossesCleared: this.bossRush.bossesCleared,
      bossCount: this.bossRush.bossIds.length
    };
    Object.assign(result, calculateBossRushGrade(result));
    this.profileManager?.recordBossRushResult(result);
    this.ui.showBossRushResult(result);
  }

  beginPlayerDefeat() {
    if (!this.boss || this.bossEndTimer > 0 || this.roundOver) return;
    this.bossEndTimer = this.boss.definition.cinematic.playerDefeatDuration;
    this.camera.shakeNow(.82);
    this.ui.announce('PILOT // SYSTEM FAILURE', this.bossEndTimer);
  }

  updateEffects(dt) {
    this.effects.update(dt);
    this.effects.compact();
  }

  loseStock(fighter) {
    if (fighter.stocks <= 0) return;
    if (this.trainingManager?.options.infiniteStocks) {
      this.resetTrainingFighter(fighter);
      this.effects.burst({
        x: fighter.x + fighter.width / 2,
        y: fighter.y + fighter.height,
        color: fighter.config.visual.accent,
        type: 'dust',
        count: 12,
        size: 18,
        speed: 110,
        life: .35
      });
      return;
    }
    if (this.bossRush && fighter === this.fighters[0]) this.bossRush.deaths++;
    if (this.matchConfig?.mode !== 'training' &&
        fighter.playerIndex !== 0 && fighter.lastHitByPlayerIndex === 0) {
      this.profileManager?.recordKO();
    }
    fighter.lastHitByPlayerIndex = null;
    fighter.stocks--;
    fighter.passives.emit('onStockLost', { fighter, stocksRemaining: fighter.stocks });
    fighter.grabbedTarget = null;
    fighter.currentAttack = null;
    fighter.damage = 0;
    fighter.vx = 0; fighter.vy = 0;
    const koX = Math.max(0, Math.min(this.arena.width, fighter.x + fighter.width / 2));
    const koY = Math.max(30, Math.min(this.arena.height - 40, fighter.y + fighter.height / 2));
    if (fighter.stocks > 0) {
      this.camera.shakeNow(.62);
      this.effects.emit({ x: koX, y: koY, color: fighter.config.visual.accent, type: 'explosion', size: 66, life: .65 });
      this.effects.burst({ x: koX, y: koY, color: fighter.config.visual.accent, type: 'spark', count: 18, size: 21, speed: 430, life: .65 });
      this.effects.burst({ x: koX, y: koY, color: '#fff1a1', type: 'energy', count: 12, size: 18, speed: 300, life: .5 });
    } else {
      this.camera.shakeNow(.85);
      this.effects.emit({ x: koX, y: this.arena.height - 40, color: fighter.config.visual.accent, type: 'explosion', size: 85, life: .8 });
      this.effects.burst({ x: koX, y: this.arena.height - 40, color: fighter.config.visual.accent, type: 'ko', count: 24, size: 24, speed: 500, life: .8 });
      this.effects.burst({ x: koX, y: this.arena.height - 40, color: '#fff2a4', type: 'energy', count: 15, size: 21, speed: 340, life: .7 });
    }
    if (fighter.stocks > 0) {
      fighter.respawnTime = .9;
      this.ui.announce(`${fighter.config.name.toUpperCase()} // ${fighter.stocks} STOCKS`, .85);
    } else this.ui.announce(`${fighter.config.name.toUpperCase()} // OUT!`, .8);
  }

  finishTimedRound() {
    const [a, b] = this.fighters;
    this.roundOver = true;
    const score = fighter => fighter.stocks * 1000 - fighter.damage;
    const winner = score(a) === score(b) ? null : score(a) > score(b) ? a : b;
    this.recordProfileResult(winner === a ? 'win' : winner === b ? 'loss' : 'draw');
    this.ui.showVictory(winner ? 'VICTORY' : 'DRAW', winner
      ? `${winner.config.name.toUpperCase()} WINS THE MATCH`
      : 'THE MATCH ENDS IN A DRAW');
  }

  checkWinner() {
    if (this.matchConfig.mode === 'boss' || this.matchConfig.mode === 'boss-rush') {
      if (this.fighters[0]?.stocks <= 0) this.beginPlayerDefeat();
      return;
    }
    const alive = this.fighters.filter(fighter => fighter.stocks > 0);
    if (alive.length > 1) return;
    this.roundOver = true;
    this.recordProfileResult(alive.length === 0 ? 'draw' : alive[0] === this.fighters[0] ? 'win' : 'loss');
    this.ui.showVictory(alive.length ? 'VICTORY' : 'DOUBLE K.O.', alive.length
      ? `${alive[0].config.name.toUpperCase()} WINS THE MATCH`
      : 'BOTH MECHS WERE KNOCKED OUT');
  }

  render(dt) { this.renderer.render(this, dt); }
}
