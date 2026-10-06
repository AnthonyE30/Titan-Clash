import { UltimateBehavior } from './ultimateBehavior.js';
import { ULTIMATE_BEHAVIORS } from './behaviors/index.js';

export class UltimateManager {
  constructor() {
    this.active = [];
  }

  activate(owner, definition, context) {
    const type = definition.behavior ?? (definition.kind === 'ultimate' ? 'aoe' : definition.kind);
    const Behavior = ULTIMATE_BEHAVIORS[type];
    if (!Behavior) throw new Error(`Unknown ultimate behavior "${type}".`);
    const behavior = new Behavior(owner, definition);
    this.active.push(behavior);
    behavior.start?.(context);
    context.game.effects.emit({
      x: owner.x + owner.width / 2,
      y: owner.y + owner.height / 2,
      color: definition.color ?? owner.config.visual.accent,
      type: 'explosion',
      size: definition.visual?.burstSize ?? 46,
      life: .42
    });
    return behavior;
  }

  update(dt, context) {
    for (const behavior of this.active) behavior.update(dt, context);
    this.active = this.active.filter(behavior => !behavior.isComplete);
    for (const fighter of context.game.fighters) {
      if (fighter.ultimateModifiers?.remaining > 0) {
        fighter.ultimateModifiers.remaining = Math.max(0, fighter.ultimateModifiers.remaining - dt);
        if (fighter.ultimateModifiers.remaining === 0) fighter.ultimateModifiers = null;
      }
    }
  }

  draw(ctx) {
    for (const behavior of this.active) behavior.draw(ctx);
  }
}
