/**
 * エンティティタイプの定数定義
 */
export const ENTITY_TYPES = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  BOSS: 'boss',
  WEAPON: 'weapon',
  PROJECTILE: 'projectile',
  PICKUP: 'pickup'
};

/**
 * エンティティの共通定数
 */
export const ENTITY_CONSTANTS = {
  // 奥行き判定
  DEPTH_THRESHOLD: 40,
  
  // 無敵時間
  DEFAULT_INVINCIBLE_TIME: 300,
  
  // ノックバック
  DEFAULT_KNOCKBACK_FORCE: 300,
  KNOCKBACK_DURATION: 200,
  
  // エフェクト
  DAMAGE_TEXT_DURATION: 800,
  DEATH_FADE_DURATION: 500,
  HIT_FLASH_DURATION: 100,
  
  // 画面境界
  GROUND_Y_MIN: 360,
  GROUND_Y_MAX: 480,
  
  // スケール調整（遠近感）
  SCALE_FACTOR: 0.0005, // Y座標に応じたスケール変化率
  BASE_SCALE: 1.0
};