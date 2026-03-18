/**
 * ゲーム全体で使用する定数定義
 */

// 画面サイズ
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// ステージ設定
export const STAGE_WIDTH = 3000;
export const GROUND_Y_MIN = 360;
export const GROUND_Y_MAX = 480;

// 判定関連
export const DEPTH_THRESHOLD = 40; // 奥行き判定閾値（px）

// タイミング
export const COMMAND_WINDOW = 400; // コマンド入力猶予（ms）
export const COMBO_RESET_TIME = 1500; // コンボリセット時間（ms）

// ダメージ・ノックバック
export const DEFAULT_INVINCIBLE_TIME = 500; // 無敵フレーム（ms）
export const DEFAULT_KNOCKBACK_DURATION = 200; // ノックバック持続時間（ms）

// デバッグ
export const DEBUG_MODE = false;