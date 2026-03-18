/**
 * ゲーム内イベントの定義とタイプ情報
 */

export const GAME_EVENTS = {
  // プレイヤー関連
  PLAYER_HP_CHANGE: 'playerHpChange',
  PLAYER_DAMAGE: 'playerDamage',
  PLAYER_HEAL: 'playerHeal',
  
  // コンボ関連
  COMBO_UPDATE: 'comboUpdate',
  COMBO_RESET: 'comboReset',
  
  // 武器関連
  WEAPON_CHANGE: 'weaponChange',
  WEAPON_DURABILITY_CHANGE: 'weaponDurabilityChange',
  WEAPON_BREAK: 'weaponBreak',
  
  // ボス関連
  BOSS_HP_CHANGE: 'bossHpChange',
  BOSS_PHASE_CHANGE: 'bossPhaseChange',
  BOSS_SPAWN: 'bossSpawn',
  BOSS_DEFEAT: 'bossDefeat',
  
  // スコア関連
  SCORE_UPDATE: 'scoreUpdate',
  SCORE_BONUS: 'scoreBonus',
  
  // ゲーム進行関連
  WAVE_START: 'waveStart',
  WAVE_CLEAR: 'waveClear',
  STAGE_CLEAR: 'stageClear',
  GAME_OVER: 'gameOver',
};

/**
 * イベントデータの構造定義（JSDocでタイプ情報を提供）
 */
export const EventDataTypes = {
  /**
   * @typedef {Object} PlayerHpChangeData
   * @property {number} current - 現在HP
   * @property {number} max - 最大HP
   * @property {number} percentage - HP割合 (0-1)
   */
  
  /**
   * @typedef {Object} ComboUpdateData
   * @property {number} count - コンボ数
   * @property {number} multiplier - コンボ倍率
   * @property {boolean} isNewRecord - 新記録かどうか
   */
  
  /**
   * @typedef {Object} WeaponChangeData
   * @property {string|null} name - 武器名（null = 素手）
   * @property {string|null} type - 武器タイプ
   * @property {number} durability - 現在耐久度
   * @property {number} maxDurability - 最大耐久度
   * @property {boolean} isSpecialReady - 特殊技使用可能か
   */
  
  /**
   * @typedef {Object} BossHpChangeData
   * @property {number} current - 現在HP
   * @property {number} max - 最大HP
   * @property {number} percentage - HP割合 (0-1)
   * @property {number} phase - 現在フェーズ
   */
  
  /**
   * @typedef {Object} ScoreUpdateData
   * @property {number} total - 総スコア
   * @property {number} base - 基本スコア
   * @property {number} combo - コンボボーナス
   * @property {number} time - タイムボーナス
   * @property {number} recent - 最近の獲得スコア
   */
};