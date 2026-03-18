/**
 * ゲーム全体で使用する定数定義
 */

// 画面サイズ
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// 奥行き（Y座標）関連
export const GROUND_Y_MIN = 360;  // 奥行き上限（画面奥側）
export const GROUND_Y_MAX = 480;  // 奥行き下限（画面手前側）
export const DEPTH_THRESHOLD = 40; // 奥行き判定閾値（px）

// コマンド入力
export const COMMAND_WINDOW = 400; // コマンド入力猶予時間（ms）

// プレイヤー関連
export const PLAYER_SPEED = 200;          // 移動速度（px/s）
export const PLAYER_MAX_HP = 100;         // 最大HP
export const COMBO_RESET_TIME = 1500;     // コンボリセット時間（ms）
export const INVINCIBLE_TIME = 300;       // 無敵時間（ms）

// 敵関連
export const ENEMY_HP = 30;               // 雑魚敵HP
export const ENEMY_SPEED = 80;            // 雑魚敵移動速度（px/s）
export const ENEMY_ATTACK_RANGE = 60;     // 攻撃範囲（px）
export const ENEMY_ATTACK_DAMAGE = 10;    // 攻撃力
export const ENEMY_ATTACK_COOLDOWN = 1500; // 攻撃クールダウン（ms）

// ボス関連
export const BOSS_MAX_HP = 200;           // ボス最大HP
export const BOSS_PHASE2_THRESHOLD = 0.5; // フェーズ2移行HP閾値（50%）
export const BOSS_SPEED = 60;            // ボス移動速度（px/s）
export const BOSS_ATTACK_RANGE = 120;     // 近接攻撃範囲（px）
export const BOSS_STEAM_RANGE = 250;      // 蒸気攻撃範囲（px）

// 物理・演出関連
export const HIT_STOP_DURATION = 80;      // ヒットストップ時間（ms）
export const KNOCKBACK_FORCE = 300;       // ノックバック力（px/s）
export const KNOCKBACK_DURATION = 200;    // ノックバック持続時間（ms）

// ステージ関連
export const STAGE_WIDTH = 3000;          // ステージ全幅（px）
export const CAMERA_FOLLOW_LERP = 0.1;    // カメラ追従の滑らかさ

// UI関連
export const UI_MARGIN = 20;              // UI要素のマージン（px）
export const HP_BAR_WIDTH = 200;          // HPバーの幅（px）
export const HP_BAR_HEIGHT = 20;          // HPバーの高さ（px）

// スコア関連
export const SCORE_PER_ENEMY = 100;       // 敵1体あたりの基本スコア
export const COMBO_BONUS_THRESHOLD = 5;   // コンボボーナス発生閾値
export const COMBO_BONUS_RATE = 0.5;      // コンボボーナス倍率

// 武器関連
export const WEAPON_PICKUP_RANGE = 50;    // 武器拾得範囲（px）
export const SPECIAL_DURABILITY_COST = 2; // 特殊技の耐久度消費

// デバッグ・開発関連
export const DEBUG_DRAW_HITBOXES = false; // 当たり判定の可視化
export const DEBUG_SHOW_DEPTH = false;    // 奥行き情報の表示

// アニメーション関連
export const ANIM_FRAME_RATE = 12;        // アニメーションフレームレート（fps）
export const FLASH_DURATION = 100;        // ダメージ点滅時間（ms）

// サウンド関連
export const SFX_VOLUME = 0.7;            // 効果音音量
export const BGM_VOLUME = 0.5;            // BGM音量

/**
 * ゲーム状態の列挙型
 */
export const GAME_STATES = {
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  STAGE_CLEAR: 'stage_clear'
};

/**
 * プレイヤー状態の列挙型
 */
export const PLAYER_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK_1: 'attack_1',
  ATTACK_2: 'attack_2',
  ATTACK_3: 'attack_3',
  DASH: 'dash',
  GRAB: 'grab',
  THROW: 'throw',
  SPECIAL: 'special',
  HURT: 'hurt',
  KNOCKDOWN: 'knockdown'
};

/**
 * 敵状態の列挙型
 */
export const ENEMY_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  HURT: 'hurt',
  KNOCKDOWN: 'knockdown',
  DEAD: 'dead'
};

/**
 * ボス状態の列挙型
 */
export const BOSS_STATES = {
  ...ENEMY_STATES,
  PHASE_TRANSITION: 'phase_transition',
  STEAM_ATTACK: 'steam_attack',
  CHARGE_ATTACK: 'charge_attack'
};

/**
 * コマンドの列挙型
 */
export const COMMANDS = {
  STEAM_BLOW: 'steamBlow',
  BOILER_UPPER: 'boilerUpper',
  BACKDRAFT: 'backdraft'
};

/**
 * 武器タイプの列挙型
 */
export const WEAPON_TYPES = {
  STEAM_PIPE: 'steam_pipe',
  GEAR_STAR: 'gear_star',
  SPARK_LANTERN: 'spark_lantern'
};

/**
 * レイヤー深度の定義（描画順序制御用）
 */
export const LAYERS = {
  BACKGROUND: 0,
  WEAPONS: 100,
  ENEMIES: 200,
  PLAYER: 300,
  EFFECTS: 400,
  UI: 1000
};

/**
 * 色定義（デバッグ・プレースホルダー用）
 */
export const COLORS = {
  PLAYER: 0x3399ff,
  ENEMY: 0xff3333,
  BOSS: 0x990033,
  WEAPON: 0x99ff33,
  HITBOX: 0xff9900,
  BACKGROUND: 0x333333
};