export const GAME_CONFIG = {
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,
  GROUND_Y_MIN: 360,    // 奥行き上限（画面奥）
  GROUND_Y_MAX: 480,    // 奥行き下限（画面手前）
  DEPTH_THRESHOLD: 40,  // 奥行き判定閾値
  COMMAND_WINDOW: 400,  // コマンド入力猶予（ms）
  
  // プレイヤー移動関連
  PLAYER_SPEED_X: 200,  // 横移動速度（px/s）
  PLAYER_SPEED_Y: 150,  // 縦移動速度（px/s）
  
  // 遠近感スケール設定
  SCALE_MIN: 0.8,       // 画面奥での最小スケール
  SCALE_MAX: 1.2,       // 画面手前での最大スケール
};