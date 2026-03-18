export const GAME_CONFIG = {
  // 画面サイズ
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,
  
  // 奥行き設定
  GROUND_Y_MIN: 360,
  GROUND_Y_MAX: 480,
  DEPTH_THRESHOLD: 40,
  
  // コマンド入力
  COMMAND_WINDOW: 400,
  
  // ステージ設定
  STAGE_WIDTH: 3000,
};

// 敵タイプ別設定
export const ENEMY_CONFIGS = {
  grunt: {
    hp: 30,
    speed: 80,
    attackRange: 60,
    attackDamage: 10,
    attackCooldown: 1500,
  },
  // 将来の敵タイプ拡張用
  heavy: {
    hp: 50,
    speed: 60,
    attackRange: 80,
    attackDamage: 15,
    attackCooldown: 2000,
  }
};