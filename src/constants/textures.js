// テクスチャキーの定数定義（タイポ防止・IDE補完対応）

export const TEXTURE_KEYS = {
  // 基本テクスチャ（矩形ボックス）
  WHITE: '__WHITE',
  PLAYER_BOX: 'player_box',
  ENEMY_BOX: 'enemy_box',
  BOSS_BOX: 'boss_box',
  WEAPON_BOX: 'weapon_box',
  BG_GRADIENT: 'bg_gradient',
  
  // 将来のスプライトテクスチャ（現在は未使用）
  PLAYER_SPRITE: 'player',
  ENEMY_SPRITE: 'enemy',
  BOSS_SPRITE: 'boss',
  STEAM_PIPE: 'steam_pipe',
  GEAR_STAR: 'gear_star',
  SPARK_LANTERN: 'spark_lantern',
  BG_ALLEY: 'bg_alley',
  
  // 音声
  BGM_STAGE1: 'bgm_stage1',
  SE_PUNCH: 'se_punch',
  SE_SPECIAL: 'se_special'
};

// テクスチャサイズの定数
export const TEXTURE_SIZES = {
  PLAYER: { width: 48, height: 64 },
  ENEMY: { width: 40, height: 56 },
  BOSS: { width: 80, height: 96 },
  WEAPON: { width: 32, height: 16 }
};