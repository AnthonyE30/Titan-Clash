export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

export function hitboxAt(fighter, attack) {
  const facing = fighter.facing * (attack.facingMultiplier ?? 1);
  const x = attack.offsetX ?? fighter.width / 2;
  const y = attack.offsetY ?? fighter.height / 2;
  return {
    x: fighter.x + fighter.width / 2 + (facing > 0 ? x : -x - attack.width),
    y: fighter.y + y - attack.height / 2,
    width: attack.width,
    height: attack.height
  };
}

export function resolvePlatforms(fighter, platforms, previousY) {
  fighter.onGround = false;
  for (const platform of platforms) {
    if (fighter.vy < 0 || fighter.dropThrough > 0 || previousY + fighter.height > platform.y + 5) continue;
    if (fighter.x + fighter.width > platform.x && fighter.x < platform.x + platform.width &&
        fighter.y + fighter.height >= platform.y && fighter.y + fighter.height <= platform.y + platform.height + 12) {
      fighter.y = platform.y - fighter.height;
      fighter.vy = 0;
      fighter.onGround = true;
    }
  }
}
