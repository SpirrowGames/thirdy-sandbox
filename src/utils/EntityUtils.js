/**
 * エンティティ関連のユーティリティ関数群
 */

/**
 * 奥行き判定（Y軸）を行う
 * ベルトスクロールゲームの核心となる判定ロジック
 */
export function isDepthAligned(entity1, entity2, threshold = 40) {
  return Math.abs(entity1.groundY - entity2.groundY) < threshold;
}

/**
 * X軸範囲判定
 */
export function isInRangeX(attacker, target, range) {
  return Math.abs(attacker.x - target.x) < range;
}

/**
 * 攻撃判定（X軸 + 奥行き）
 */
export function canAttack(attacker, target, range, depthThreshold = 40) {
  return isInRangeX(attacker, target, range) && 
         isDepthAligned(attacker, target, depthThreshold);
}

/**
 * エンティティタイプ判定
 */
export function isPlayer(entity) {
  return entity.type === 'player';
}

export function isEnemy(entity) {
  return entity.type === 'enemy' || entity.type === 'boss';
}

export function isWeapon(entity) {
  return entity.type === 'weapon';
}

/**
 * ノックバック方向計算
 */
export function calculateKnockbackDirection(source, target) {
  return target.x > source.x ? 1 : -1;
}

/**
 * エンティティグループの生存数カウント
 */
export function countAliveEntities(entities) {
  return entities.filter(entity => entity.alive).length;
}

/**
 * 最も近いエンティティを取得
 */
export function findClosestEntity(source, targets) {
  let closest = null;
  let minDistance = Infinity;
  
  for (const target of targets) {
    if (!target.alive) continue;
    
    const distance = Math.abs(source.x - target.x);
    if (distance < minDistance) {
      minDistance = distance;
      closest = target;
    }
  }
  
  return closest;
}