import { Action, Condition, Selector, Sequence } from './behaviorTree.js';
import { AI_PROFILES } from './aiProfiles.js';

const centerX = fighter => fighter.x + fighter.width / 2;
const centerY = fighter => fighter.y + fighter.height / 2;
const distanceToRange = (value, start, end) => value < start ? start - value : value > end ? value - end : 0;

export class AIController {
  constructor(profileId = 'medium') {
    const profile = AI_PROFILES[profileId];
    if (!profile) throw new Error(`Unknown AI profile: ${profileId}`);
    this.profile = profile;
    this.source = `ai-${profile.id}`;
    this.keys = new Set();
    this.decisionTimer = 0;
    this.observedOpponentCombo = 0;
    this.comboThreat = 0;
    this.observationTime = 0;
    this.opponentObservations = [];
    this.lastOpponentState = null;
    this.lastOpponentJumpTime = -Infinity;
    this.currentBehavior = 'initializing';
    this.decisionState = 'waiting';
    this.currentTarget = 'opponent';
    this.threatLevel = 'LOW';
    this.lastThreat = null;
    this.tree = this.createBehaviorTree();
  }

  createBehaviorTree() {
    const context = new Condition(({ fighter, opponent }) => opponent.stocks > 0 && fighter.stocks > 0);
    return new Sequence([
      context,
      new Selector([
        new Sequence([
          new Condition(({ controller, fighter, arena }) => controller.needsRecovery(fighter, arena)),
          new Action(({ controller, fighter, arena }) => controller.recover(fighter, arena))
        ]),
        new Sequence([
          new Condition(({ controller, fighter, arena, game }) => controller.shouldAvoidHazard(fighter, arena, game)),
          new Action(({ controller, fighter, arena, game }) => controller.avoidHazard(fighter, arena, game))
        ]),
        new Sequence([
          new Condition(({ controller, fighter, opponent }) => controller.shouldBlock(fighter, opponent)),
          new Action(({ controller }) => controller.act(['block'], 'defending'))
        ]),
        new Sequence([
          new Condition(({ controller, fighter }) => controller.shouldRetreat(fighter)),
          new Action(({ controller, fighter, opponent, arena }) => controller.position(fighter, opponent, arena, true))
        ]),
        new Sequence([
          new Condition(({ controller, fighter, opponent }) => controller.shouldUseUltimate(fighter, opponent)),
          new Action(({ controller }) => controller.act(['ultimate'], 'ultimate'))
        ]),
        new Sequence([
          new Condition(({ controller, fighter, opponent }) => controller.shouldAttack(fighter, opponent)),
          new Action(({ controller, fighter, opponent, arena }) => controller.attack(fighter, opponent, arena))
        ]),
        new Sequence([
          new Condition(({ controller, fighter, opponent }) => controller.shouldUseSpecial(fighter, opponent)),
          new Action(({ controller }) => controller.useSpecial())
        ]),
        new Action(({ controller, fighter, opponent, arena }) => controller.position(fighter, opponent, arena, false))
      ])
    ]);
  }

  update(fighter, opponent, arena, game, dt) {
    this.currentControls = fighter.controls;
    this.observeOpponent(opponent, dt);
    this.currentTarget = opponent?.config?.name ?? 'opponent';
    this.lastThreat = this.findHazard(fighter, arena, game.time, game);
    this.threatLevel = this.getThreatLevel(fighter, arena, game);
    if (fighter.stocks <= 0 || fighter.respawnTime > 0) {
      this.keys.clear();
      this.currentBehavior = 'inactive';
      this.decisionState = fighter.stocks <= 0 ? 'eliminated' : 'respawning';
      game.input.setVirtualKeys(this.source, this.keys);
      return;
    }
    if (this.opponentUnavailable(opponent, arena)) {
      this.keys.clear();
      this.preservePosition(fighter, arena);
      this.currentBehavior = 'position preservation';
      this.decisionState = 'opponent unavailable';
      game.input.setVirtualKeys(this.source, this.keys);
      return;
    }
    if (this.needsRecovery(fighter, arena)) {
      this.keys.clear();
      this.recover(fighter, arena);
      this.decisionState = 'recovery override';
      game.input.setVirtualKeys(this.source, this.keys);
      return;
    }
    if (this.profile.recognizeCombos) {
      if (opponent.combo > this.observedOpponentCombo) this.comboThreat = .5;
      this.observedOpponentCombo = opponent.combo;
      this.comboThreat = Math.max(0, this.comboThreat - dt);
    }
    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.keys.clear();
      this.decisionState = 'behavior tree deciding';
      this.tree.tick({ controller: this, fighter, opponent, arena, game });
      this.decisionTimer = this.profile.reactionTime + Math.random() * this.profile.reactionJitter;
    } else {
      this.decisionState = 'holding current input';
    }
    game.input.setVirtualKeys(this.source, this.keys);
  }

  observeOpponent(opponent, dt) {
    this.observationTime += dt;
    const previous = this.lastOpponentState;
    if (opponent?.stocks > 0 && previous) {
      const jumped = previous.airJumps > opponent.airJumps ||
        (previous.onGround && !opponent.onGround && opponent.vy < -100);
      const dashed = opponent.dashTime > 0 && previous.dashTime <= 0;
      const usedSpecial = opponent.specialCooldown > previous.specialCooldown + Math.max(.015, dt * .5);
      const startedAttack = opponent.currentAttack && opponent.currentAttack !== previous.currentAttack;

      if (jumped) {
        this.lastOpponentJumpTime = this.observationTime;
        this.recordObservation({ type: 'jump', time: this.observationTime });
      }
      if (usedSpecial) this.recordObservation({ type: 'special', time: this.observationTime });
      if (startedAttack) {
        if (!usedSpecial) {
          const jumpBeforeAttack = this.observationTime - this.lastOpponentJumpTime <= 1.25;
          this.recordObservation({
            type: 'attack',
            time: this.observationTime,
            jumpBefore: jumpBeforeAttack
          });
        }
      }
      if (dashed) this.recordObservation({ type: 'dash', time: this.observationTime });
    }

    const oldestAllowed = this.observationTime - this.profile.tendencyWindow;
    this.opponentObservations = this.opponentObservations.filter(event => event.time >= oldestAllowed);
    this.lastOpponentState = opponent ? {
      onGround: opponent.onGround,
      airJumps: opponent.airJumps,
      dashTime: opponent.dashTime,
      currentAttack: opponent.currentAttack,
      specialCooldown: opponent.specialCooldown
    } : null;
  }

  recordObservation(event) {
    this.opponentObservations.push(event);
    if (this.opponentObservations.length > 64) this.opponentObservations.shift();
  }

  getOpponentTendencies() {
    const counts = { jumps: 0, attacks: 0, specials: 0, dashes: 0, jumpAttacks: 0 };
    for (const event of this.opponentObservations) {
      if (event.type === 'jump') counts.jumps++;
      else if (event.type === 'attack') {
        counts.attacks++;
        if (event.jumpBefore) counts.jumpAttacks++;
      } else if (event.type === 'special') counts.specials++;
      else if (event.type === 'dash') counts.dashes++;
    }
    const window = Math.max(.1, this.profile.tendencyWindow);
    return {
      ...counts,
      window: Math.min(this.observationTime, window),
      rates: Object.fromEntries(
        Object.entries(counts).map(([name, count]) => [
          name,
          Math.round(count / Math.max(.1, Math.min(this.observationTime, window)) * 60 * 10) / 10
        ])
      )
    };
  }

  getDebugSnapshot() {
    const tendencies = this.getOpponentTendencies();
    return {
      behavior: this.currentBehavior,
      target: this.currentTarget,
      threatLevel: this.threatLevel,
      threat: this.lastThreat?.source ?? 'none',
      decisionState: this.decisionState,
      tendencies
    };
  }

  distance(fighter, opponent) {
    return Math.abs(centerX(opponent) - centerX(fighter));
  }

  shouldBlock(fighter, opponent) {
    if (fighter.hitstun > 0 || fighter.currentAttack || fighter.landingRecovery > 0) return false;
    const opponentAttacking = opponent.currentAttack &&
      opponent.currentAttack.elapsed >= opponent.currentAttack.startup - .04 &&
      opponent.currentAttack.elapsed <= opponent.currentAttack.startup + opponent.currentAttack.active;
    const comboThreat = this.comboThreat > 0;
    const tendencies = this.getOpponentTendencies();
    const adaptedSpecialRead = this.profile.adaptationLevel >= 1 &&
      tendencies.specials >= 2 && this.opponentObservations.some(event =>
        event.type === 'special' && this.observationTime - event.time < 1.2
      );
    return this.distance(fighter, opponent) < 150 && (opponentAttacking || comboThreat) &&
      Math.random() < Math.min(.9, this.profile.blockChance + (adaptedSpecialRead ? .18 : 0));
  }

  shouldRetreat(fighter) {
    return fighter.damage >= this.profile.retreatDamage &&
      Math.random() > this.profile.aggression * .7;
  }

  opponentUnavailable(opponent, arena) {
    return opponent.stocks <= 0 || opponent.respawnTime > 0 ||
      opponent.y > arena.height + 80 || opponent.x + opponent.width < -180 ||
      opponent.x > arena.width + 180;
  }

  preservePosition(fighter, arena) {
    if (fighter.onGround) {
      const platform = arena.platforms.find(item =>
        fighter.x + fighter.width > item.x && fighter.x < item.x + item.width &&
        Math.abs(fighter.y + fighter.height - item.y) < 10
      );
      if (!platform) return;
      const leftSpace = centerX(fighter) - platform.x;
      const rightSpace = platform.x + platform.width - centerX(fighter);
      if (leftSpace < 48 && (fighter.vx < -35 || leftSpace < 28)) this.act(['right']);
      else if (rightSpace < 48 && (fighter.vx > 35 || rightSpace < 28)) this.act(['left']);
      return;
    }

    const targetPlatform = arena.platforms.reduce((closest, platform) => {
      const horizontalDistance = Math.abs(centerX(fighter) - (platform.x + platform.width / 2));
      const verticalDistance = Math.abs(fighter.y + fighter.height - platform.y);
      const score = horizontalDistance + verticalDistance * .65;
      return !closest || score < closest.score ? { platform, score } : closest;
    }, null)?.platform;
    if (!targetPlatform) return;
    const platformCenter = targetPlatform.x + targetPlatform.width / 2;
    const keys = [];
    if (Math.abs(centerX(fighter) - platformCenter) > 50) {
      keys.push(centerX(fighter) < platformCenter ? 'right' : 'left');
    }
    if (fighter.vy > 120 && fighter.airJumps > 0) keys.push('up');
    if (this.profile.recoveryMixups && fighter.airDashes > 0 && fighter.vy > 250) keys.push('block');
    this.act(keys);
  }

  shouldUseUltimate(fighter, opponent) {
    const ability = fighter.config.abilities.ultimate;
    return fighter.ultimateReady && fighter.hitstun <= 0 &&
      this.distance(fighter, opponent) < ability.radius * .88 &&
      Math.abs(centerY(fighter) - centerY(opponent)) < ability.radius * .65;
  }

  shouldAttack(fighter, opponent) {
    return fighter.attackCooldown <= 0 && fighter.hitstun <= 0 &&
      fighter.landingRecovery <= 0 && !fighter.currentAttack &&
      this.distance(fighter, opponent) <= this.profile.attackRange;
  }

  needsRecovery(fighter, arena) {
    const x = centerX(fighter);
    const nearBlastZone = x < 170 || x > arena.width - 170;
    const outsideStage = fighter.x < 20 || fighter.x + fighter.width > arena.width - 20;
    const edgePlatform = fighter.onGround && arena.platforms.find(platform =>
      fighter.x + fighter.width > platform.x && fighter.x < platform.x + platform.width &&
      Math.abs(fighter.y + fighter.height - platform.y) < 10
    );
    const leftEdgeRisk = edgePlatform && centerX(fighter) - edgePlatform.x < 48 &&
      (fighter.vx < -35 || centerX(fighter) - edgePlatform.x < 28);
    const rightEdgeRisk = edgePlatform && edgePlatform.x + edgePlatform.width - centerX(fighter) < 48 &&
      (fighter.vx > 35 || edgePlatform.x + edgePlatform.width - centerX(fighter) < 28);
    const fallingPastPlatform = !fighter.onGround && fighter.vy > 120 &&
      arena.platforms.every(platform =>
        fighter.x + fighter.width <= platform.x - 30 || fighter.x >= platform.x + platform.width + 30
      );
    return outsideStage || leftEdgeRisk || rightEdgeRisk ||
      (nearBlastZone && !fighter.onGround && fighter.vy > 80) || fallingPastPlatform;
  }

  recover(fighter, arena) {
    const x = centerX(fighter);
    const platform = arena.platforms.reduce((closest, item) => {
      const score = Math.abs(x - (item.x + item.width / 2)) +
        Math.abs(fighter.y + fighter.height - item.y) * .65;
      return !closest || score < closest.score ? { platform: item, score } : closest;
    }, null)?.platform;
    const targetX = x < 100 ? 180 : x > arena.width - 100 ? arena.width - 180 :
      platform ? platform.x + platform.width / 2 : arena.width / 2;
    const direction = targetX < x ? 'left' : 'right';
    const keys = [direction];
    if (!fighter.onGround && (fighter.vy > 120 || fighter.y + fighter.height > (platform?.y ?? arena.height * .65))) keys.push('up');
    if (this.profile.recoveryMixups && !fighter.onGround && fighter.airDashes > 0 &&
        (fighter.y > arena.height * .75 || fighter.x < 5 || fighter.x + fighter.width > arena.width - 5)) {
      keys.push('block');
    }
    return this.act(keys, 'recovery');
  }

  shouldAvoidHazard(fighter, arena, game) {
    return Boolean(this.findHazard(fighter, arena, game.time, game));
  }

  findHazard(fighter, arena, time, game) {
    const threats = this.getCombatThreats(arena, game);
    const nearbyThreats = threats.map(threat => {
      const horizontalGap = distanceToRange(centerX(fighter), threat.x - 25, threat.x + threat.width + 25);
      const verticalGap = distanceToRange(centerY(fighter), threat.y - 90, threat.y + threat.height + 25);
      return { threat, score: horizontalGap + verticalGap * .75 };
    }).filter(candidate => candidate.score < 100)
      .sort((first, second) => first.score - second.score);
    if (nearbyThreats.length) return nearbyThreats[0].threat;
    return arena.hazards.find(item => {
      const active = time % item.period < item.activeTime;
      const withinLane = fighter.x + fighter.width > item.x - 25 && fighter.x < item.x + item.width + 25;
      return active && withinLane && fighter.y + fighter.height >= item.y - 90;
    });
  }

  getCombatThreats(arena, game) {
    const eventThreats = game?.arenaEvents?.getThreats().map(threat => ({
      ...threat,
      source: 'arena event'
    })) ?? [];
    const bossAttackThreats = (game?.bossAttacks ?? [])
      .filter(attack => attack.active !== false && attack.life > 0)
      .map(attack => ({
        x: attack.x,
        y: attack.y,
        width: attack.width,
        height: attack.height,
        warning: attack.delay > 0,
        source: attack.delay > 0 ? 'boss telegraph' : 'boss attack'
      }));
    const bossHazardThreats = (game?.bossHazards ?? [])
      .filter(hazard => hazard.warningTime > 0 || hazard.activeTime > 0)
      .map(hazard => ({
        x: hazard.x,
        y: hazard.y,
        width: hazard.width,
        height: hazard.height,
        warning: hazard.warningTime > 0,
        source: hazard.warningTime > 0 ? 'boss telegraph' : 'boss hazard'
      }));
    return [
      ...eventThreats,
      ...bossAttackThreats,
      ...bossHazardThreats,
      ...this.getBossTelegraphThreats(game)
    ].filter(threat =>
      Number.isFinite(threat.x) && Number.isFinite(threat.y) &&
      Number.isFinite(threat.width) && Number.isFinite(threat.height)
    );
  }

  getBossTelegraphThreats(game) {
    const boss = game?.boss;
    const telegraph = boss?.telegraph;
    if (!boss || !telegraph) return [];
    const bossCenterX = boss.x + boss.width / 2;
    const bossCenterY = boss.y + boss.height / 2;
    if (telegraph.style === 'beam') {
      const direction = Number.isFinite(telegraph.direction) ? telegraph.direction : 1;
      const endX = bossCenterX + direction * (telegraph.range ?? 240);
      return [{
        x: Math.min(bossCenterX, endX),
        y: bossCenterY - 45,
        width: Math.abs(endX - bossCenterX),
        height: 90,
        warning: true,
        source: 'boss telegraph'
      }];
    }
    if (telegraph.style === 'area' && Number.isFinite(telegraph.targetX)) {
      const radius = telegraph.radius ?? 72;
      return [{
        x: telegraph.targetX - radius,
        y: (telegraph.targetY ?? bossCenterY) - radius,
        width: radius * 2,
        height: radius * 2,
        warning: true,
        source: 'boss telegraph'
      }];
    }
    if (telegraph.style === 'lanes' && telegraph.platform && Number.isFinite(telegraph.targetX)) {
      const { platform, laneCount = 2, laneWidth = 110, laneHeight = 25, laneY } = telegraph;
      return Array.from({ length: laneCount }, (_, index) => {
        const offset = laneCount === 1 ? 0 : (index - (laneCount - 1) / 2) * (laneWidth + 22);
        return {
          x: Math.max(platform.x, Math.min(
            platform.x + platform.width - laneWidth,
            telegraph.targetX + offset - laneWidth / 2
          )),
          y: laneY ?? platform.y,
          width: laneWidth,
          height: laneHeight,
          warning: true,
          source: 'boss telegraph'
        };
      });
    }
    const radius = telegraph.radius ?? Math.min(120, telegraph.range ?? 120);
    const direction = Number.isFinite(telegraph.direction) ? telegraph.direction : 1;
    return [{
      x: (telegraph.targetX ?? bossCenterX + direction * 120) - radius,
      y: (telegraph.targetY ?? bossCenterY) - radius,
      width: radius * 2,
      height: radius * 2,
      warning: true,
      source: 'boss telegraph'
    }];
  }

  getThreatLevel(fighter, arena, game) {
    const threats = this.getCombatThreats(arena, game);
    const center = { x: centerX(fighter), y: centerY(fighter) };
    let nearest = Infinity;
    for (const threat of threats) {
      const dx = distanceToRange(center.x, threat.x, threat.x + threat.width);
      const dy = distanceToRange(center.y, threat.y, threat.y + threat.height);
      const distance = Math.hypot(dx, dy);
      if (distance === 0) return threat.warning ? 'HIGH' : 'CRITICAL';
      nearest = Math.min(nearest, distance);
    }
    if (nearest < 90) return 'MEDIUM';
    return 'LOW';
  }

  avoidHazard(fighter, arena, game) {
    const hazard = this.findHazard(fighter, arena, game.time, game);
    if (!hazard) return false;
    const escape = centerX(fighter) < hazard.x + hazard.width / 2 ? 'left' : 'right';
    this.act([escape, 'up'], 'hazard avoidance');
    return true;
  }

  attack(fighter, opponent, arena) {
    const keys = [];
    const dx = centerX(opponent) - centerX(fighter);
    const dy = centerY(opponent) - centerY(fighter);
    const close = Math.abs(dx) < 72;
    let antiAirRead = false;
    if (this.profile.useDirectionalAttacks) {
      const tendencies = this.getOpponentTendencies();
      antiAirRead = this.profile.adaptationLevel >= 2 &&
        tendencies.jumpAttacks >= 2 &&
        (!opponent.onGround || this.observationTime - this.lastOpponentJumpTime < .45) &&
        Boolean(fighter.config.attacks.up || fighter.config.attacks.uair);
      if (antiAirRead && (fighter.config.attacks.up || fighter.config.attacks.uair)) {
        keys.push('up');
      } else if (fighter.onGround && !close && Math.abs(dx) > 90) keys.push(dx > 0 ? 'right' : 'left');
      if (!antiAirRead) {
        if (!fighter.onGround && dy < -30) keys.push('up');
        else if (!fighter.onGround && dy > 45) keys.push('down');
        else if (fighter.onGround && !close && Math.abs(dy) > 65) keys.push(dy < 0 ? 'up' : 'down');
      }
    }
    keys.push('attack');
    return this.act(keys, antiAirRead ? 'adaptive anti-air attack' : 'attack');
  }

  shouldUseSpecial(fighter, opponent) {
    if (fighter.specialCooldown > 0 || fighter.hitstun > 0) return false;
    const primary = fighter.config.abilities.special;
    if (primary.kind === 'hover' && !fighter.onGround && fighter.vy > 100) {
      this.useSecondary = false;
      return true;
    }
    const distance = this.distance(fighter, opponent);
    const secondary = fighter.config.abilities.secondary;
    this.useSecondary = Boolean(secondary && this.secondaryIsUseful(secondary, fighter, opponent, distance));
    const ability = this.useSecondary ? secondary : fighter.config.abilities.special;
    if (this.useSecondary && ability.kind === 'barrier') return true;
    const range = this.abilityRange(ability);
    return range > 0 && distance < range * this.profile.specialRange &&
      Math.random() < this.profile.aggression;
  }

  abilityRange(ability) {
    return ability.radius ?? ability.distance ?? ability.width ?? ability.attack?.width ??
      (ability.kind === 'projectile' || ability.kind === 'spread' ? 500 : ability.kind === 'barrier' ? 145 : 0);
  }

  secondaryIsUseful(ability, fighter, opponent, distance) {
    if (ability.kind === 'melee') return distance <= (ability.attack?.width ?? 80) * .8;
    if (ability.kind === 'beam') return distance <= ability.width * this.profile.specialRange;
    if (ability.kind === 'barrier') {
      return distance < 145 && (opponent.currentAttack || this.comboThreat > 0 || fighter.damage > 70);
    }
    if (ability.kind === 'blink') return distance > this.profile.attackRange && distance < (ability.distance ?? 0) * 2;
    return false;
  }

  useSpecial() {
    return this.act([this.useSecondary ? 'secondary' : 'special'],
      this.useSecondary ? 'secondary ability' : 'special ability');
  }

  position(fighter, opponent, arena, retreat) {
    const dx = centerX(opponent) - centerX(fighter);
    const distance = Math.abs(dx);
    let desiredX = centerX(opponent);
    if (this.profile.predictOpponent) desiredX += opponent.vx * .22;
    if (retreat) desiredX = centerX(fighter) - Math.sign(dx || 1) * 230;
    else if (distance < this.profile.attackRange * .62) {
      const tendencies = this.getOpponentTendencies();
      const dashSpacing = this.profile.adaptationLevel >= 1 && tendencies.dashes >= 2 ? 55 : 0;
      desiredX = centerX(fighter) - Math.sign(dx || 1) * (135 + dashSpacing);
    }
    const direction = desiredX > centerX(fighter) ? 'right' : 'left';
    const keys = distance > (retreat ? 35 : this.profile.attackRange * .78) ? [direction] : [];
    if (this.needsPlatformNavigation(fighter, opponent, arena)) keys.push('up');
    else if (!retreat && fighter.onGround && this.isNearPlatformEdge(fighter, arena)) keys.push('up');
    if (!keys.length) keys.push(direction);
    return this.act(keys, retreat ? 'adaptive spacing / retreat' : 'adaptive positioning');
  }

  needsPlatformNavigation(fighter, opponent, arena) {
    const target = arena.platforms.find(platform =>
      centerX(opponent) >= platform.x && centerX(opponent) <= platform.x + platform.width &&
      Math.abs(opponent.y + opponent.height - platform.y) < 24
    );
    return Boolean(target && fighter.onGround && target.y < fighter.y + fighter.height - 30 &&
      centerX(fighter) >= target.x - 100 && centerX(fighter) <= target.x + target.width + 100);
  }

  isNearPlatformEdge(fighter, arena) {
    const platform = arena.platforms.find(item =>
      fighter.x + fighter.width > item.x && fighter.x < item.x + item.width &&
      Math.abs(fighter.y + fighter.height - item.y) < 8
    );
    if (!platform) return false;
    const center = centerX(fighter);
    return center - platform.x < 45 || platform.x + platform.width - center < 45;
  }

  act(actions, behavior = 'positioning') {
    const controls = this.currentControls;
    this.keys = new Set(actions.map(action => {
      const key = controls[action];
      if (!key) throw new Error(`Unknown AI action: ${action}`);
      return key;
    }));
    this.currentBehavior = behavior;
    return true;
  }
}
