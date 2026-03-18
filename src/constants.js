/**
 * ゲーム全体で使用する定数を定義
 * 設計書で決定された値を集約管理
 */
export const GAME_CONFIG = {
    // 画面設定
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    
    // ステージ設定
    STAGE_WIDTH: 3000,
    
    // 奥行き（Y座標）設定
    GROUND_Y_MIN: 360,  // 奥行き上限（画面上側）
    GROUND_Y_MAX: 480,  // 奥行き下限（画面下側）
    DEPTH_THRESHOLD: 40, // 奥行き判定閾値（px）
    
    // コマンド入力設定
    COMMAND_WINDOW: 400, // コマンド入力猶予時間（ms）
    
    // プレイヤー設定
    PLAYER: {
        MAX_HP: 100,
        SPEED: 200,        // px/s
        COMBO_RESET: 1500, // コンボリセット時間（ms）
        INVINCIBLE_TIME: 500, // 無敵時間（ms）
    },
    
    // 敵設定
    ENEMY: {
        GRUNT_HP: 30,
        GRUNT_SPEED: 80,
        GRUNT_ATTACK_RANGE: 60,
        GRUNT_DAMAGE: 10,
        GRUNT_COOLDOWN: 1500,
        
        BOSS_HP: 200,
        BOSS_SPEED: 60,
        BOSS_ATTACK_RANGE: 120,
        BOSS_DAMAGE: 20,
        BOSS_PHASE2_THRESHOLD: 0.5,
    },
    
    // 物理設定
    PHYSICS: {
        GRAVITY_Y: 0, // ベルトスクロールなので重力なし
        DEBUG: false, // デバッグ表示
    },
    
    // カメラ設定
    CAMERA: {
        FOLLOW_LERP_X: 0.1, // X軸追従の滑らかさ
        FOLLOW_LERP_Y: 0,   // Y軸は追従しない
    },
    
    // UI設定
    UI: {
        HUD_MARGIN: 20,
        HP_BAR_WIDTH: 200,
        HP_BAR_HEIGHT: 20,
        BOSS_HP_BAR_WIDTH: 400,
        BOSS_HP_BAR_HEIGHT: 30,
    },
};

// キー定数（文字列の誤記を防ぐ）
export const KEYS = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    UP: 'UP',
    DOWN: 'DOWN',
    Z: 'Z',
    X: 'X',
};

// ゲーム状態定数
export const GAME_STATES = {
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    STAGE_CLEAR: 'stage_clear',
};

// エンティティ状態定数
export const ENTITY_STATES = {
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
    KNOCKDOWN: 'knockdown',
    DEAD: 'dead',
};

// レイヤー定数（描画順序）
export const LAYERS = {
    BACKGROUND: 0,
    WEAPONS: 1,
    ENEMIES: 2,
    PLAYER: 3,
    EFFECTS: 4,
    UI: 5,
};