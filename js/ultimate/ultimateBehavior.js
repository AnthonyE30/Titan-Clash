export class UltimateBehavior {
  constructor(owner, definition) {
    this.owner = owner;
    this.definition = { ...definition };
    this.state = 'telegraph';
    this.elapsed = 0;
    this.telegraph = definition.telegraph ?? .65;
    this.duration = definition.duration ?? .8;
    this.hitIds = new Set();
  }

  update(dt, context) {
    if (this.owner.stocks <= 0 || this.owner.respawnTime > 0) {
      this.state = 'complete';
      this.onComplete(context);
      return;
    }
    this.elapsed += dt;
    if (this.state === 'telegraph' && this.elapsed >= this.telegraph) {
      this.state = 'active';
      this.elapsed = 0;
      this.onActivate(context);
    }
    if (this.state === 'active') this.onUpdate(dt, context);
    if (this.state === 'active' && this.elapsed >= this.duration) {
      this.state = 'complete';
      this.onComplete(context);
    }
  }

  onActivate() {}
  onUpdate() {}
  onComplete() {}
  draw() {}

  hit(target, sourceX, context, hitIndex = 0) {
    const key = `${target.id}:${hitIndex}`;
    if (this.hitIds.has(key) || target.stocks <= 0) return false;
    if (!context.game.applyUltimateHit(this.owner, target, this.definition.attack, sourceX)) return false;
    this.hitIds.add(key);
    return true;
  }

  get isComplete() { return this.state === 'complete'; }
}
