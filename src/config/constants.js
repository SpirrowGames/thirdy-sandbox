/**
 * ゲーム全体で使用する定数定義
 */

// 画面サイズ
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// ステージサイズ
export const STAGE_WIDTH = 3000;

// 奥行き範囲（Y座標）
export const GROUND_Y_MIN = 360;
export const GROUND_Y_MAX = 480;

// 奥行き判定閾値
export const DEPTH_THRESHOLD = 40;

// コマンド入力猶予時間
export const COMMAND_WINDOW = 400;

// プレイヤー設定
export const PLAYER_SPEED = 200;
export const PLAYER_MAX_HP = 100;

// コンボ設定
export const COMBO_RESET_TIME = 1500;

// カメラ設定
export const CAMERA_LERP_X = 0.1;
export const CAMERA_DEADZONE_X = 100;