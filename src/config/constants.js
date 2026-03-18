// BootSceneで使用する定数定義

export const GAME_CONFIG = {
  WIDTH: 960,
  HEIGHT: 540,
};

export const COLORS = {
  BACKGROUND: 0x000000,
  LOADING_TEXT: '#ffffff',
  PROGRESS_BG: 0x333333,
  PROGRESS_BAR: 0x00ff00,
  
  // エンティティ用カラー（開発フェーズ）
  PLAYER: 0x3399ff,
  ENEMY: 0xff3333,
  BOSS: 0x990000,
  WEAPON: 0x33ff33,
  HITBOX_DEBUG: 0xffff00,
};

export const ASSET_PATHS = {
  // 将来的なアセットパス定義
  SPRITES: {
    PLAYER: 'assets/sprites/player.png',
    ENEMY: 'assets/sprites/enemy.png',
    BOSS: 'assets/sprites/boss.png',
    WEAPONS: 'assets/sprites/weapons.png',
  },
  AUDIO: {
    BGM_STAGE1: 'assets/audio/stage1.mp3',
    SFX_PUNCH: 'assets/audio/punch.wav',
    SFX_SPECIAL: 'assets/audio/special.wav',
    SFX_HIT: 'assets/audio/hit.wav',
  },
  BACKGROUNDS: {
    ALLEY: 'assets/backgrounds/alley.png',
  }
};