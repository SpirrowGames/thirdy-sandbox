/**
 * ゲーム定数定義
 * BootSceneで初期化され、全体で参照される定数
 */
export const GAME_CONSTANTS = {
  // 画面サイズ
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,

  // ステージ設定
  STAGE_WIDTH: 3000,
  GROUND_Y_MIN: 360,
  GROUND_Y_MAX: 480,
  DEPTH_THRESHOLD: 40,

  // 入力設定
  COMMAND_WINDOW: 400,  // ms
  COMBO_RESET: 1500,    // ms

  // 物理設定
  PLAYER_SPEED: 200,    // px/s
  ENEMY_SPEED: 80,      // px/s
  
  // 戦闘設定
  INVINCIBLE_TIME: 150, // ms
  HIT_STOP_TIME: 80,    // ms
  KNOCKBACK_FORCE: 300, // px/s

  // 開発設定
  DEV_PHASE: 'BOXES',   // 'BOXES' | 'SPRITES'
  DEBUG_MODE: false
};

/**
 * アセットパス定義
 */
export const ASSET_PATHS = {
  sprites: {
    player: 'assets/sprites/player.png',
    enemy: 'assets/sprites/enemy.png',
    boss: 'assets/sprites/boss.png'
  },
  backgrounds: {
    alley: 'assets/backgrounds/alley.png'
  },
  weapons: {
    steam_pipe: 'assets/weapons/steam_pipe.png',
    gear_star: 'assets/weapons/gear_star.png',
    spark_lantern: 'assets/weapons/spark_lantern.png'
  },
  effects: {
    steam: 'assets/effects/steam.png',
    spark: 'assets/effects/spark.png'
  },
  audio: {
    bgm_stage1: 'assets/audio/bgm_stage1.ogg',
    se_punch: 'assets/audio/se_punch.wav',
    se_steam: 'assets/audio/se_steam.wav',
    se_hit: 'assets/audio/se_hit.wav'
  }
};

/**
 * 開発フェーズ判定
 */
export const isBoxPhase = () => {
  return window.GAME_CONSTANTS?.DEV_PHASE === 'BOXES';
};

export const isDebugMode = () => {
  return window.GAME_CONSTANTS?.DEBUG_MODE === true;
};