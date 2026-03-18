export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_Y_MIN = 360;
export const GROUND_Y_MAX = 480;
export const DEPTH_THRESHOLD = 40;
export const COMMAND_WINDOW = 400;

// 敵AI関連定数
export const ENEMY_CONSTANTS = {
  IDLE_DURATION: 500,        // アイドル状態の持続時間（ms）
  ATTACK_DURATION: 600,      // 攻撃モーションの持続時間（ms）
  HURT_DURATION: 400,        // 被弾状態の持続時間（ms）
  KNOCKBACK_DURATION: 200,   // ノックバック持続時間（ms）
  MOVEMENT_THRESHOLD: 5,     // 移動停止の閾値（px）
  KNOCKBACK_DISTANCE: 50,    // ノックバック距離（px）
  KNOCKBACK_SPEED: 200,      // ノックバック速度（px/s）
};