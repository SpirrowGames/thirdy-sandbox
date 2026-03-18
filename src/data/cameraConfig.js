/**
 * ステージ別カメラ設定
 */
export const CAMERA_CONFIGS = {
  stage1: {
    followLerpX: 0.08,
    followLerpY: 0,
    stageBounds: { x: 0, y: 0, width: 3000, height: 540 },
    deadzone: { x: 150, y: 0, width: 300, height: 0 }
  },
  
  stage2: {
    followLerpX: 0.1,
    followLerpY: 0,
    stageBounds: { x: 0, y: 0, width: 4000, height: 540 },
    deadzone: { x: 200, y: 0, width: 200, height: 0 }
  },
  
  boss: {
    followLerpX: 0.05,  // ボス戦は追従を緩くして見やすく
    followLerpY: 0,
    stageBounds: { x: 1800, y: 0, width: 800, height: 540 },
    deadzone: { x: 100, y: 0, width: 400, height: 0 }
  }
};

/**
 * カメラエフェクト設定
 */
export const CAMERA_EFFECTS = {
  hit: {
    shake: { duration: 80, intensity: 3 }
  },
  
  specialAttack: {
    shake: { duration: 200, intensity: 8 },
    flash: { duration: 100, red: 255, green: 255, blue: 150 }
  },
  
  bossPhaseChange: {
    shake: { duration: 500, intensity: 12 },
    flash: { duration: 300, red: 255, green: 100, blue: 100 }
  },
  
  waveStart: {
    shake: { duration: 150, intensity: 4 }
  },
  
  waveClear: {
    flash: { duration: 200, red: 150, green: 255, blue: 150 }
  }
};