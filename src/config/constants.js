export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_Y_MIN = 360;
export const GROUND_Y_MAX = 480;
export const DEPTH_THRESHOLD = 40;
export const COMMAND_WINDOW = 400;

// 物理設定
export const PHYSICS_CONFIG = {
  gravity: { y: 0 },
  debug: process.env.NODE_ENV === 'development'
};

// カメラ設定
export const CAMERA_CONFIG = {
  followLerpX: 0.1,
  followLerpY: 0,
  bounds: {
    width: 3000,
    height: GAME_HEIGHT
  }
};