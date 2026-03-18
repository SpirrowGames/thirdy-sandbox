/**
 * ゲーム内コマンド定義
 * 鉄拳師の必殺技コマンド
 */
export const PLAYER_COMMANDS = {
  steamBlow: {
    sequence: ['RIGHT', 'RIGHT', 'Z'],
    priority: 10
  },
  boilerUpper: {
    sequence: ['DOWN', 'RIGHT', 'Z'], 
    priority: 10
  },
  backdraft: {
    sequence: ['LEFT', 'LEFT', 'Z'],
    priority: 10
  },
  // 将来の拡張用
  steamDash: {
    sequence: ['RIGHT', 'RIGHT', 'X'],
    priority: 8
  },
  counterAttack: {
    sequence: ['LEFT', 'RIGHT', 'Z'],
    priority: 12
  }
};

// 共通コマンド（全キャラ共通）
export const COMMON_COMMANDS = {
  grab: {
    sequence: ['Z', 'X'], // 同時押しではなく連続押し
    priority: 5
  },
  dashCancel: {
    sequence: ['X', 'X'],
    priority: 7
  }
};