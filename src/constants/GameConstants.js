/**
 * ゲーム全体で使用する定数定義
 */

// 画面設定
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// 奥行き設定（Y座標での疑似3D表現）
export const GROUND_Y_MIN = 360;  // 奥行き上限（画面上側）
export const GROUND_Y_MAX = 480;  // 奥行き下限（画面下側）
export const DEPTH_THRESHOLD = 40; // 奥行き判定閾値（px）

// ステージ設定
export const STAGE_WIDTH = 3000;  // ステージ全幅
export const STAGE_HEIGHT = GAME_HEIGHT;

// 入力・コマンド設定
export const COMMAND_WINDOW = 400; // コマンド入力猶予時間（ms）

// 戦闘設定
export const COMBO_RESET_TIME = 1500; // コンボリセット時間（ms）
export const HIT_STOP_DURATION = 80;  // ヒットストップ時間（ms）
export const INVINCIBLE_TIME = 800;   // 被弾後無敵時間（ms）

// 物理設定
export const PLAYER_SPEED = 200;      // プレイヤー移動速度（px/s）
export const ENEMY_SPEED = 80;        // 敵移動速度（px/s）
export const KNOCKBACK_FORCE = 300;   // ノックバック力

// UI設定
export const UI_MARGIN = 20;          // UI要素の余白
export const HP_BAR_WIDTH = 200;      // HPバーの幅
export const HP_BAR_HEIGHT = 20;      // HPバーの高さ

// カメラ設定
export const CAMERA_FOLLOW_LERP = 0.1; // カメラ追従の滑らかさ（0-1）
export const CAMERA_DEADZONE_WIDTH = 200; // カメラのデッドゾーン幅

// デバッグ設定
export const DEBUG_PHYSICS = false;   // 物理デバッグ表示
export const DEBUG_HITBOXES = false;  // 当たり判定表示

// 色定数（開発初期の矩形表示用）
export const COLORS = {
    PLAYER: 0x3399ff,      // 青
    ENEMY: 0xff3333,       // 赤
    BOSS: 0xff6600,        // オレンジ
    WEAPON: 0x33ff33,      // 緑
    HITBOX: 0xffff00,      // 黄色（デバッグ用）
    BACKGROUND: 0x2d2d2d   // ダークグレー
};

// ゲーム状態
export const GAME_STATES = {
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    STAGE_CLEAR: 'stage_clear'
};

// アセットキー（将来のスプライト対応用）
export const ASSET_KEYS = {
    PLAYER_ATLAS: 'player_atlas',
    ENEMY_ATLAS: 'enemy_atlas',
    BOSS_ATLAS: 'boss_atlas',
    WEAPON_ATLAS: 'weapon_atlas',
    BACKGROUND: 'background',
    UI_ATLAS: 'ui_atlas'
};