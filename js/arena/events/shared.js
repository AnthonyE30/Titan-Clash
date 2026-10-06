export const severityColors = Object.freeze({
  low: '#65e9ff',
  medium: '#ffd365',
  high: '#ff7955',
  critical: '#ff3d48'
});

export function eventAttack(event) {
  const definition = event.definition;
  const damage = definition.damage ?? 8;
  return {
    damage,
    knockback: definition.knockback ?? 170 + damage * 5,
    scale: definition.scale ?? 2.5,
    launch: definition.launch ?? 150,
    launchRatio: definition.launchRatio ?? .38,
    hitstun: definition.hitstun ?? .2,
    weightReference: 1
  };
}

export function drawWarningLabel(ctx, event, x, y, text = event.name) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 17px "Barlow Condensed", sans-serif';
  ctx.fillStyle = severityColors[event.severity] ?? severityColors.medium;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 14;
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}
