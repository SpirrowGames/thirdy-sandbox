export interface PlayerHpChangeEvent {
  current: number;
  max: number;
  percentage: number;
}

export interface ComboUpdateEvent {
  count: number;
  multiplier: number;
  isActive: boolean;
}

export interface ScoreUpdateEvent {
  score: number;
  lastEarnedPoints: number;
  reason: 'enemy_defeat' | 'combo_bonus' | 'time_bonus' | 'weapon_bonus';
}

export interface BossHpChangeEvent {
  current: number;
  max: number;
  percentage: number;
  phase: number;
}

export interface WeaponChangeEvent {
  name: string | null;
  durability: number;
  maxDurability: number;
  type: string | null;
}

export interface GameStateChangeEvent {
  state: 'playing' | 'paused' | 'wave_clear' | 'stage_clear' | 'game_over';
  waveNumber?: number;
}

// イベント名の定数定義
export const GAME_EVENTS = {
  PLAYER_HP_CHANGE: 'playerHpChange',
  COMBO_UPDATE: 'comboUpdate',
  SCORE_UPDATE: 'scoreUpdate',
  BOSS_HP_CHANGE: 'bossHpChange',
  WEAPON_CHANGE: 'weaponChange',
  GAME_STATE_CHANGE: 'gameStateChange',
  WAVE_START: 'waveStart',
  WAVE_CLEAR: 'waveClear',
  STAGE_CLEAR: 'stageClear'
} as const;