export const GAME_CONFIG = {
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,
  GROUND_Y_MIN: 360,    // 奥行き上限（Y座標）
  GROUND_Y_MAX: 480,    // 奥行き下限（Y座標）
  DEPTH_THRESHOLD: 40,  // 奥行き判定閾値（px）
  COMMAND_WINDOW: 400,  // コマンド入力猶予（ms）
};

export const PLAYER_CONFIG = {
  SPEED: 200,           // px/s
  MAX_HP: 100,
  COMBO_RESET: 1500,    // ms
};