import { DEPTH_THRESHOLD } from '../constants/GameConstants.js';

/**
 * ゲーム全体で使用するユーティリティ関数
 */

/**
 * 奥行き判定を行う
 * @param {Object} entity1 - エンティティ1
 * @param {Object} entity2 - エンティティ2
 * @returns {boolean} 奥行きが一致しているかどうか
 */
export function isDepthAligned(entity1, entity2) {
  return Math.abs(entity1.groundY - entity2.groundY) < DEPTH_THRESHOLD;
}

/**
 * 値を指定した範囲内にクランプする
 * @param {number} value - 値
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number} クランプされた値
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * 2点間の距離を計算する
 * @param {number} x1 - 点1のX座標
 * @param {number} y1 - 点1のY座標
 * @param {number} x2 - 点2のX座標
 * @param {number} y2 - 点2のY座標
 * @returns {number} 距離
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 角度を正規化する（-π〜π）
 * @param {number} angle - 角度（ラジアン）
 * @returns {number} 正規化された角度
 */
export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * デバッグ用：オブジェクトの状態をコンソールに出力
 * @param {string} label - ラベル
 * @param {Object} obj - オブジェクト
 */
export function debugLog(label, obj) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${label}]`, obj);
  }
}