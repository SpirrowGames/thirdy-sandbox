export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_Y_MIN = 360;
export const GROUND_Y_MAX = 480;
export const DEPTH_THRESHOLD = 40;
export const COMMAND_WINDOW = 400;

// Enemy AI関連定数
export const ENEMY_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  HURT: 'hurt',
  KNOCKDOWN: 'knockdown'
};

export const AI_PARAMS = {
  IDLE_DURATION: 500,        // ms
  ATTACK_DURATION: 600,      // ms
  HURT_DURATION: 150,        // ms
  KNOCKDOWN_DURATION: 1000,  // ms
  ATTACK_COOLDOWN: 1500,     // ms
  KNOCKBACK_FORCE: 200,      // px/s
  Y_SPEED_RATIO: 0.7         // Y軸移動速度の係数
};