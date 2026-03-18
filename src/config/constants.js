export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_Y_MIN = 360;
export const GROUND_Y_MAX = 480;
export const DEPTH_THRESHOLD = 40;
export const COMMAND_WINDOW = 400;

// 敵AI関連定数
export const ENEMY_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  HURT: 'hurt',
  KNOCKDOWN: 'knockdown'
};

export const ENEMY_DEFAULTS = {
  hp: 30,
  speed: 80,
  attackRange: 60,
  attackDamage: 10,
  attackCooldown: 1500
};