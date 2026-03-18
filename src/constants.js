// ゲーム全体で使用する定数を定義

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const GROUND_Y_MIN = 360;
export const GROUND_Y_MAX = 480;
export const DEPTH_THRESHOLD = 40;

export const COMMAND_WINDOW = 400; // ms

// レイヤー定数
export const LAYERS = {
  BACKGROUND: 0,
  PLAYER_ATTACKS: 1,
  ENEMY_HITBOXES: 2,
  ENEMY_ATTACKS: 3,
  PLAYER_HITBOX: 4,
  WEAPONS: 5
};

// ゲーム状態
export const GAME_STATES = {
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  STAGE_CLEAR: 'stage_clear'
};

// プレイヤー状態
export const PLAYER_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK_1: 'attack_1',
  ATTACK_2: 'attack_2',
  ATTACK_3: 'attack_3',
  DASH: 'dash',
  GRAB: 'grab',
  THROW: 'throw',
  SPECIAL: 'special',
  HURT: 'hurt',
  KNOCKDOWN: 'knockdown'
};

// 敵状態
export const ENEMY_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  HURT: 'hurt',
  KNOCKDOWN: 'knockdown',
  DEAD: 'dead'
};