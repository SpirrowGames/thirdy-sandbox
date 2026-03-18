/**
 * 衝突判定関連のユーティリティ関数
 */

/**
 * 矩形同士の衝突判定
 */
export function isRectCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

/**
 * 円形衝突判定
 */
export function isCircleCollision(circle1, circle2) {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle1.radius + circle2.radius;
}

/**
 * 点と矩形の衝突判定
 */
export function isPointInRect(point, rect) {
  return point.x >= rect.x &&
         point.x <= rect.x + rect.width &&
         point.y >= rect.y &&
         point.y <= rect.y + rect.height;
}

/**
 * 扇形範囲判定（ボスの蒸気噴射用）
 */
export function isInSectorRange(origin, target, angle, range, sectorAngle) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > range) return false;
  
  const targetAngle = Math.atan2(dy, dx);
  const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(targetAngle - angle));
  
  return angleDiff <= sectorAngle / 2;
}

/**
 * ノックバック方向計算
 */
export function calculateKnockbackDirection(attacker, target) {
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { x: 1, y: 0 };
  
  return {
    x: dx / distance,
    y: dy / distance
  };
}

/**
 * 攻撃範囲内判定
 */
export function isInAttackRange(attacker, target, range, depthThreshold = 40) {
  const xDistance = Math.abs(attacker.x - target.x);
  const yDistance = Math.abs((attacker.groundY || attacker.y) - (target.groundY || target.y));
  
  return xDistance <= range && yDistance < depthThreshold;
}