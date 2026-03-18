import { DEPTH_THRESHOLD } from '../config/constants.js';

/**
 * 2つのエンティティが奥行き方向で攻撃可能範囲にいるかチェック
 */
export function isDepthAligned(entity1, entity2, threshold = DEPTH_THRESHOLD) {
  return Math.abs(entity1.groundY - entity2.groundY) < threshold;
}

/**
 * エンティティ間の距離を計算
 */
export function getDistance(entity1, entity2) {
  const dx = entity1.x - entity2.x;
  const dy = entity1.groundY - entity2.groundY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * エンティティ間の角度を計算（ラジアン）
 */
export function getAngleBetween(from, to) {
  return Math.atan2(to.groundY - from.groundY, to.x - from.x);
}

/**
 * ベクトルを正規化
 */
export function normalize(vector) {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

/**
 * 範囲内のランダムな値を生成
 */
export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}