// ゲーム画面設定
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// 奥行き設定
export const GROUND_Y_MIN = 360;
export const GROUND_Y_MAX = 480;
export const DEPTH_THRESHOLD = 40;

// コマンド入力設定
export const COMMAND_WINDOW = 400;

// 敵設定
export const ENEMY_TYPES = {
  grunt: {
    hp: 30,
    speed: 80,
    attackRange: 60,
    attackDamage: 10,
    attackCooldown: 1500
  }
};