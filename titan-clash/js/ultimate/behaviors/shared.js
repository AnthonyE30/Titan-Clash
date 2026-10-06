import { overlaps } from '../../collision.js';

export function targetsFor(owner, context) {
  return [
    ...context.game.fighters.filter(fighter => fighter !== owner && fighter.stocks > 0),
    ...(context.game.boss?.state === 'active' ? [context.game.boss] : [])
  ];
}

export function targetCenter(target) {
  return { x: target.x + target.width / 2, y: target.y + target.height / 2 };
}

export function distanceTo(x, y, target) {
  const center = targetCenter(target);
  return Math.hypot(center.x - x, center.y - y);
}

export function attackDefinition(definition) {
  const damage = definition.damage ?? 20;
  return {
    damage,
    knockback: definition.knockback ?? 340,
    scale: definition.scale ?? 4,
    launch: definition.launch ?? 300,
    launchRatio: definition.launchRatio ?? .55,
    hitstun: definition.hitstun ?? .4,
    weightReference: 1,
    ...definition.attack
  };
}

export function drawTelegraph(ctx, x, y, radius, color, progress = 0) {
  ctx.save();
  ctx.globalAlpha = .35 + Math.sin(performance.now() / 65) * .16;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(x, y, radius * (.75 + progress * .25), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function targetsInBox(box, owner, context) {
  return targetsFor(owner, context).filter(target => overlaps(box, target));
}

export function ownerCenter(owner) {
  return { x: owner.x + owner.width / 2, y: owner.y + owner.height / 2 };
}

export function activeColor(behavior) {
  return behavior.definition.color ?? behavior.owner.config.visual.accent;
}
