/**
 * ゲーム全体で使用する定数定義
 */
window.GAME_CONSTANTS = {
    // 画面サイズ
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    
    // ステージ設定
    STAGE_WIDTH: 3000,
    GROUND_Y_MIN: 360,      // 奥行き上限（Y座標）
    GROUND_Y_MAX: 480,      // 奥行き下限（Y座標）
    
    // 判定設定
    DEPTH_THRESHOLD: 40,    // 奥行き判定閾値（px）
    
    // 入力設定
    COMMAND_WINDOW: 400,    // コマンド入力猶予（ms）
    COMBO_RESET: 1500,      // コンボリセット時間（ms）
    
    // プレイヤー設定
    PLAYER_SPEED: 200,      // プレイヤー移動速度（px/s）
    PLAYER_MAX_HP: 100,     // プレイヤー最大HP
    
    // 敵設定
    ENEMY_SPEED: 80,        // 敵移動速度（px/s）
    ENEMY_HP: 30,           // 敵HP
    ENEMY_DAMAGE: 10,       // 敵攻撃力
    ENEMY_ATTACK_RANGE: 60, // 敵攻撃範囲（px）
    ENEMY_ATTACK_COOLDOWN: 1500, // 敵攻撃クールダウン（ms）
    
    // ボス設定
    BOSS_MAX_HP: 200,       // ボス最大HP
    BOSS_PHASE2_THRESHOLD: 0.5, // フェーズ2移行HP割合
    
    // エフェクト設定
    HIT_STOP_DURATION: 80,  // ヒットストップ時間（ms）
    KNOCKBACK_FORCE: 300,   // ノックバック力
    KNOCKBACK_DURATION: 200, // ノックバック持続時間（ms）
    INVINCIBLE_DURATION: 800, // 無敵時間（ms）
    
    // カメラ設定
    CAMERA_FOLLOW_LERP: 0.1, // カメラ追従の滑らかさ
    
    // デバッグ設定
    DEBUG_PHYSICS: false,   // 物理デバッグ表示
    DEBUG_HITBOXES: false,  // 当たり判定表示
};

// 定数のフリーズ（変更不可にする）
Object.freeze(window.GAME_CONSTANTS);