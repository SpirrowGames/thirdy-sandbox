/**
 * ゲーム全体で使用する定数定義
 */
const GAME_CONFIG = {
    // 画面サイズ
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    
    // 奥行き設定
    GROUND_Y_MIN: 360,     // 奥行き上限（Y座標）
    GROUND_Y_MAX: 480,     // 奥行き下限（Y座標）
    DEPTH_THRESHOLD: 40,   // 奥行き判定閾値（px）
    
    // 入力設定
    COMMAND_WINDOW: 400,   // コマンド入力猶予（ms）
    
    // ゲームバランス
    COMBO_RESET_TIME: 1500,  // コンボリセット時間（ms）
    HIT_STOP_DURATION: 80,   // ヒットストップ時間（ms）
    INVINCIBLE_TIME: 1000,   // 無敵時間（ms）
    
    // ステージ設定
    STAGE_WIDTH: 3000,     // ステージ全幅
    CAMERA_LERP: 0.1,      // カメラ追従の滑らかさ
    
    // デバッグ設定
    DEBUG_PHYSICS: false,  // 物理デバッグ表示
    DEBUG_COMMANDS: false, // コマンド入力デバッグ
};

// グローバルに公開
window.GAME_CONFIG = GAME_CONFIG;