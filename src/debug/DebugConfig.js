export const DEBUG_CONFIG = {
  enabled: true,  // 本番では false に変更
  
  // デバッグ表示項目
  showFPS: true,
  showEntityInfo: true,
  showCollisionBoxes: true,
  showDepthZones: true,
  showSpawnTriggers: true,
  showCommandBuffer: true,
  showPerformanceStats: true,
  
  // デバッグ操作
  enableGodMode: true,
  enableTeleport: true,
  enableSpeedControl: true,
  
  // 表示設定
  textStyle: {
    fontSize: '14px',
    fontFamily: 'Courier New',
    fill: '#00ff00',
    backgroundColor: '#000000',
    padding: { x: 4, y: 2 }
  },
  
  boxStyle: {
    lineWidth: 2,
    strokeColor: 0x00ff00,
    fillColor: 0x00ff00,
    fillAlpha: 0.2
  }
};

export const DEBUG_KEYS = {
  TOGGLE_DEBUG: 'F1',
  TOGGLE_COLLISION: 'F2',
  TOGGLE_PERFORMANCE: 'F3',
  GOD_MODE: 'F4',
  KILL_ALL_ENEMIES: 'F5',
  SPAWN_ENEMY: 'F6',
  NEXT_WAVE: 'F7',
  RESET_STAGE: 'F8'
};