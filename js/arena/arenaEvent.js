export class ArenaEvent {
  constructor(definition) {
    if (!definition.id || !definition.type) {
      throw new Error('An arena event requires an id and type.');
    }
    this.id = definition.id;
    this.type = definition.type;
    this.name = definition.name ?? definition.type;
    this.severity = definition.severity ?? 'medium';
    this.warningTime = definition.warningTime ?? 1;
    this.duration = definition.duration ?? 3;
    this.cooldown = definition.cooldown ?? 8;
    this.initialDelay = definition.initialDelay ?? 0;
    this.repeat = definition.repeat ?? true;
    this.definition = Object.freeze({ ...definition });
    this.state = 'waiting';
    this.timer = this.initialDelay;
    this.elapsed = 0;
    this.activation = 0;
    this.hitTimers = new Map();
  }

  update(dt, context) {
    for (const [fighterId, time] of this.hitTimers) {
      const remaining = Math.max(0, time - dt);
      if (remaining === 0) this.hitTimers.delete(fighterId);
      else this.hitTimers.set(fighterId, remaining);
    }

    if (this.state === 'waiting' || this.state === 'cooldown') {
      this.timer = Math.max(0, this.timer - dt);
      if (this.timer === 0) this.begin(context);
      return;
    }

    if (this.state === 'warning') {
      this.onUpdate(dt, context);
      this.timer = Math.max(0, this.timer - dt);
      if (this.timer === 0) {
        this.state = 'active';
        this.elapsed = 0;
      }
      return;
    }

    if (this.state === 'active') {
      this.onUpdate(dt, context);
      this.elapsed += dt;
      if (this.elapsed >= this.duration) this.complete(context);
    }
  }

  begin(context) {
    this.activation++;
    this.elapsed = 0;
    this.hitTimers.clear();
    this.state = this.warningTime > 0 ? 'warning' : 'active';
    this.timer = this.warningTime;
    this.onStart(context);
    context.game.ui.announce(`${this.name.toUpperCase()} // WARNING`, Math.max(.8, this.warningTime));
  }

  complete(context) {
    this.onComplete(context);
    if (this.repeat) {
      this.state = 'cooldown';
      this.timer = this.cooldown;
    } else {
      this.state = 'complete';
    }
  }

  canHit(fighter, cooldown = .25) {
    return !this.hitTimers.has(fighter.id) && cooldown >= 0;
  }

  hit(fighter, attack, sourceX, context, cooldown = .25) {
    if (!this.canHit(fighter, cooldown)) return false;
    if (!fighter.receiveHit(attack, sourceX)) return false;
    this.hitTimers.set(fighter.id, cooldown);
    context.game.onArenaEventHit(fighter, this, attack);
    return true;
  }

  get isWarning() { return this.state === 'warning'; }
  get isActive() { return this.state === 'active'; }

  onStart() {}
  onUpdate() {}
  onComplete() {}
  draw() {}
  getThreats() { return []; }
}
