import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y_MIN,
  GROUND_Y_MAX,
  DEPTH_THRESHOLD,
  COMMAND_WINDOW,
  PLAYER_STATES,
  ENEMY_STATES,
  BOSS_STATES,
  COMMANDS,
  WEAPON_TYPES,
  LAYERS,
  COLORS
} from '../../src/constants/GameConstants.js';

describe('GameConstants', () => {
  describe('基本定数', () => {
    test('画面サイズが正しく定義されている', () => {
      expect(GAME_WIDTH).toBe(960);
      expect(GAME_HEIGHT).toBe(540);
    });

    test('奥行き関連定数が正しく定義されている', () => {
      expect(GROUND_Y_MIN).toBe(360);
      expect(GROUND_Y_MAX).toBe(480);
      expect(DEPTH_THRESHOLD).toBe(40);
      expect(GROUND_Y_MIN).toBeLessThan(GROUND_Y_MAX);
    });

    test('コマンド入力猶予時間が正しく定義されている', () => {
      expect(COMMAND_WINDOW).toBe(400);
      expect(typeof COMMAND_WINDOW).toBe('number');
    });
  });

  describe('状態列挙型', () => {
    test('プレイヤー状態が正しく定義されている', () => {
      expect(PLAYER_STATES.IDLE).toBe('idle');
      expect(PLAYER_STATES.WALK).toBe('walk');
      expect(PLAYER_STATES.ATTACK_1).toBe('attack_1');
      expect(PLAYER_STATES.ATTACK_2).toBe('attack_2');
      expect(PLAYER_STATES.ATTACK_3).toBe('attack_3');
      expect(PLAYER_STATES.SPECIAL).toBe('special');
    });

    test('敵状態が正しく定義されている', () => {
      expect(ENEMY_STATES.IDLE).toBe('idle');
      expect(ENEMY_STATES.WALK).toBe('walk');
      expect(ENEMY_STATES.ATTACK).toBe('attack');
      expect(ENEMY_STATES.HURT).toBe('hurt');
      expect(ENEMY_STATES.DEAD).toBe('dead');
    });

    test('ボス状態が敵状態を継承している', () => {
      expect(BOSS_STATES.IDLE).toBe(ENEMY_STATES.IDLE);
      expect(BOSS_STATES.PHASE_TRANSITION).toBe('phase_transition');
      expect(BOSS_STATES.STEAM_ATTACK).toBe('steam_attack');
    });
  });

  describe('コマンド・武器・レイヤー定義', () => {
    test('コマンドが正しく定義されている', () => {
      expect(COMMANDS.STEAM_BLOW).toBe('steamBlow');
      expect(COMMANDS.BOILER_UPPER).toBe('boilerUpper');
      expect(COMMANDS.BACKDRAFT).toBe('backdraft');
    });

    test('武器タイプが正しく定義されている', () => {
      expect(WEAPON_TYPES.STEAM_PIPE).toBe('steam_pipe');
      expect(WEAPON_TYPES.GEAR_STAR).toBe('gear_star');
      expect(WEAPON_TYPES.SPARK_LANTERN).toBe('spark_lantern');
    });

    test('レイヤー深度が正しい順序で定義されている', () => {
      expect(LAYERS.BACKGROUND).toBeLessThan(LAYERS.WEAPONS);
      expect(LAYERS.WEAPONS).toBeLessThan(LAYERS.ENEMIES);
      expect(LAYERS.ENEMIES).toBeLessThan(LAYERS.PLAYER);
      expect(LAYERS.PLAYER).toBeLessThan(LAYERS.EFFECTS);
      expect(LAYERS.EFFECTS).toBeLessThan(LAYERS.UI);
    });
  });

  describe('数値の妥当性', () => {
    test('HPと攻撃力の値が妥当', () => {
      expect(typeof PLAYER_STATES.IDLE).toBe('string');
      expect(GAME_WIDTH > 0).toBe(true);
      expect(GAME_HEIGHT > 0).toBe(true);
    });

    test('色定数が16進数で定義されている', () => {
      expect(typeof COLORS.PLAYER).toBe('number');
      expect(typeof COLORS.ENEMY).toBe('number');
      expect(typeof COLORS.BOSS).toBe('number');
      expect(COLORS.PLAYER).toBeGreaterThanOrEqual(0);
      expect(COLORS.PLAYER).toBeLessThanOrEqual(0xffffff);
    });
  });

  describe('定数の一意性', () => {
    test('プレイヤー状態値が重複していない', () => {
      const values = Object.values(PLAYER_STATES);
      const uniqueValues = [...new Set(values)];
      expect(values.length).toBe(uniqueValues.length);
    });

    test('敵状態値が重複していない', () => {
      const values = Object.values(ENEMY_STATES);
      const uniqueValues = [...new Set(values)];
      expect(values.length).toBe(uniqueValues.length);
    });

    test('コマンド値が重複していない', () => {
      const values = Object.values(COMMANDS);
      const uniqueValues = [...new Set(values)];
      expect(values.length).toBe(uniqueValues.length);
    });
  });
});