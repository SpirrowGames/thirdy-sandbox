// ステージ関連の定数を定義

export const STAGE_CONSTANTS = {
  // 奥行き制限
  GROUND_Y_MIN: 360,
  GROUND_Y_MAX: 480,
  DEPTH_THRESHOLD: 40,

  // ステージ寸法
  DEFAULT_STAGE_WIDTH: 3000,
  SCREEN_WIDTH: 960,
  SCREEN_HEIGHT: 540,

  // スポーン設定
  SPAWN_OFFSET_FROM_CAMERA: 900, // カメラ右端からのオフセット
  ENEMY_SPAWN_SPACING: 80,       // 敵同士の間隔

  // ウェーブ管理
  WAVE_CLEAR_DELAY: 1000,        // ウェーブクリア後の待機時間(ms)
  SCROLL_UNLOCK_DELAY: 500,      // スクロールアンロックの遅延(ms)
};

// 敵タイプ定義
export const ENEMY_TYPES = {
  GRUNT: 'grunt',
  BOSS: 'boss',
};

// 武器タイプ定義
export const WEAPON_TYPES = {
  STEAM_PIPE: 'steam_pipe',
  GEAR_STAR: 'gear_star',
  SPARK_LANTERN: 'spark_lantern',
};

// ステージ背景タイプ
export const BACKGROUND_TYPES = {
  ALLEY: 'bg_alley',
  FACTORY: 'bg_factory',
  AIRSHIP: 'bg_airship',
};