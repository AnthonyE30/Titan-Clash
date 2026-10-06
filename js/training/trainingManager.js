const TRAINING_BEHAVIORS = new Set(['idle', 'walk', 'jump', 'attack', 'block', 'random']);

export class TrainingManager {
  constructor(behavior = 'idle') {
    if (!TRAINING_BEHAVIORS.has(behavior)) throw new Error(`Unknown training dummy behavior "${behavior}".`);
    this.behavior = behavior;
    this.source = 'training-dummy';
    this.keys = new Set();
    this.behaviorTimer = 0;
    this.pulseTimer = 0;
    this.direction = -1;
    this.randomBehavior = 'idle';
    this.highestCombo = 0;
    this.damageEvents = [];
    this.options = {
      infiniteStocks: true,
      infiniteUltimate: true,
      infiniteCooldowns: true
    };
  }

  update(game, dt) {
    const [player, dummy] = game.fighters;
    if (!player || !dummy) return;
    this.highestCombo = Math.max(this.highestCombo, player.combo);
    if (dummy.stocks > 0 && dummy.respawnTime <= 0) {
      this.updateDummy(dummy, game, dt);
    } else {
      this.keys.clear();
    }
    game.input.setVirtualKeys(this.source, this.keys);
  }

  updateDummy(fighter, game, dt) {
    this.behaviorTimer -= dt;
    this.pulseTimer = Math.max(0, this.pulseTimer - dt);
    if (this.behaviorTimer > 0) {
      if (this.activeBehavior === 'jump' || this.activeBehavior === 'attack') {
        if (this.pulseTimer === 0) this.keys.clear();
      }
      return;
    }

    this.keys.clear();
    const behavior = this.behavior === 'random'
      ? this.chooseRandomBehavior()
      : this.behavior;
    this.activeBehavior = behavior;
    if (behavior === 'walk') {
      if (Math.random() < .22) this.direction *= -1;
      const center = fighter.x + fighter.width / 2;
      if (center < 100) this.direction = 1;
      else if (center > game.arena.width - 100) this.direction = -1;
      this.keys.add(fighter.controls[this.direction > 0 ? 'right' : 'left']);
      this.behaviorTimer = .7 + Math.random() * .8;
    } else if (behavior === 'jump') {
      this.keys.add(fighter.controls.up);
      this.pulseTimer = .12;
      this.behaviorTimer = .8 + Math.random() * .7;
    } else if (behavior === 'attack') {
      this.keys.add(fighter.controls.attack);
      this.pulseTimer = .1;
      this.behaviorTimer = .65 + Math.random() * .55;
    } else if (behavior === 'block') {
      this.keys.add(fighter.controls.block);
      this.behaviorTimer = .25;
    } else {
      this.behaviorTimer = this.behavior === 'random' ? .3 + Math.random() * .8 : .25;
    }
  }

  chooseRandomBehavior() {
    const choices = ['idle', 'walk', 'jump', 'attack', 'block'];
    this.randomBehavior = choices[Math.floor(Math.random() * choices.length)];
    return this.randomBehavior;
  }

  recordDamage(damage, time) {
    if (damage <= 0) return;
    this.damageEvents.push({ damage, time });
  }

  getDps(time) {
    const windowStart = time - 5;
    this.damageEvents = this.damageEvents.filter(event => event.time >= windowStart);
    const damage = this.damageEvents.reduce((total, event) => total + event.damage, 0);
    const elapsed = Math.min(5, Math.max(.25, time));
    return damage / elapsed;
  }

  clearInputs(input) {
    this.keys.clear();
    input.setVirtualKeys(this.source, []);
  }
}
