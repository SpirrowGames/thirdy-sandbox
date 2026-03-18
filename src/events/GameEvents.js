/**
 * ゲーム内イベント定義
 * GameScene→UISceneの通信で使用するイベント名と型定義
 */
export const GAME_EVENTS = {
  PLAYER_HP_CHANGE: 'playerHpChange',
  COMBO_UPDATE: 'comboUpdate',
  BOSS_HP_CHANGE: 'bossHpChange',
  WEAPON_CHANGE: 'weaponChange',
  SCORE_UPDATE: 'scoreUpdate',
  WAVE_START: 'waveStart',
  WAVE_CLEAR: 'waveClear',
  STAGE_CLEAR: 'stageClear'
};

/**
 * イベントデータの型定義（JSDoc形式）
 */

/**
 * @typedef {Object} PlayerHpChangeData
 * @property {number} current - 現在HP
 * @property {number} max - 最大HP
 * @property {number} percentage - HP割合（0-1）
 */

/**
 * @typedef {Object} ComboUpdateData
 * @property {number} count - コンボ数
 * @property {number} multiplier - コンボ倍率
 * @property {boolean} isMax - 最大コンボ到達フラグ
 */

/**
 * @typedef {Object} BossHpChangeData
 * @property {number} current - 現在HP
 * @property {number} max - 最大HP
 * @property {number} percentage - HP割合（0-1）
 * @property {number} phase - フェーズ番号
 */

/**
 * @typedef {Object} WeaponChangeData
 * @property {string|null} name - 武器名（null=素手）
 * @property {number} durability - 耐久度
 * @property {number} maxDurability - 最大耐久度
 * @property {string} type - 武器タイプ
 */

/**
 * @typedef {Object} ScoreUpdateData
 * @property {number} total - 合計スコア
 * @property {number} base - 基本スコア
 * @property {number} combo - コンボボーナス
 * @property {number} time - タイムボーナス
 */