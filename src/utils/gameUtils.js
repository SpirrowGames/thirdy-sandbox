import { GAME_CONFIG } from '../main.js';

/**
 * 奥行き判定を行う
 * @param {number} y1 - エンティティ1のY座標
 * @param {number} y2 - エンティティ2のY座標
 * @returns {boolean} 奥行きが一致しているかどうか
 */
export function isDepthAligned(y1, y2) {
  return Math.abs(y1 - y2) < GAME_CONFIG.DEPTH_THRESHOLD;
}

/**
 * Y座標を奥行き範囲内にクランプする
 * @param {number} y - Y座標
 * @returns {number} クランプされたY座標
 */
export function clampGroundY(y) {
  return Phaser.Math.Clamp(y, GAME_CONFIG.GROUND_Y_MIN, GAME_CONFIG.GROUND_Y_MAX);
}

/**
 * 距離に基づいてスケールを計算する（遠近感演出）
 * @param {number} y - Y座標
 * @returns {number} スケール値（0.8〜1.2）
 */
export function calculateDepthScale(y) {
  const normalizedY = (y - GAME_CONFIG.GROUND_Y_MIN) / (GAME_CONFIG.GROUND_Y_MAX - GAME_CONFIG.GROUND_Y_MIN);
  return 0.8 + (normalizedY * 0.4); // 奥側0.8倍、手前側1.2倍
}

/**
 * スコアを計算する
 * @param {number} baseScore - 基本スコア
 * @param {number} comboCount - コンボ数
 * @returns {number} 計算されたスコア
 */
export function calculateScore(baseScore, comboCount = 0) {
  let score = baseScore;
  if (comboCount >= 5) {
    score *= Math.pow(GAME_CONFIG.SCORE_COMBO_MULTIPLIER, Math.floor(comboCount / 5));
  }
  return Math.floor(score);
}

/**
 * 画面座標がゲーム範囲内かチェックする
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @returns {boolean} 範囲内かどうか
 */
export function isInGameBounds(x, y) {
  return x >= 0 && x <= GAME_CONFIG.STAGE_WIDTH &&
         y >= GAME_CONFIG.GROUND_Y_MIN && y <= GAME_CONFIG.GROUND_Y_MAX;
}