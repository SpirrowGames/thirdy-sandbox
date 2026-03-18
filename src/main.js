import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { BootScene } from './scenes/BootScene.js';

/**
 * ゲーム全体の定数定義
 */
export const CONSTANTS = {
    // 画面サイズ
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    
    // ゲームエリア（奥行き）
    GROUND_Y_MIN: 360,
    GROUND_Y_MAX: 480,
    DEPTH_THRESHOLD: 40,
    
    // 入力・コマンド
    COMMAND_WINDOW: 400, // ms
    
    // ゲームバランス
    COMBO_RESET_TIME: 1500, // ms
    HIT_STOP_DURATION: 80,  // ms
    KNOCKBACK_FORCE: 300,   // px/s
    INVINCIBLE_TIME: 500,   // ms
    
    // ステージ
    STAGE_WIDTH: 3000,      // px
    CAMERA_FOLLOW_LERP: 0.1,
    
    // 物理
    GRAVITY: 0,             // 横スクロールなので重力なし
    DEBUG_PHYSICS: false    // 開発時はtrueに変更可能
};

/**
 * Phaser.js ゲーム設定
 */
const gameConfig = {
    type: Phaser.AUTO,
    width: CONSTANTS.GAME_WIDTH,
    height: CONSTANTS.GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: CONSTANTS.GRAVITY },
            debug: CONSTANTS.DEBUG_PHYSICS
        }
    },
    
    scene: [BootScene, GameScene, UIScene],
    
    // パフォーマンス設定
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true
    },
    
    // スケール設定（レスポンシブ対応）
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 480,
            height: 270
        },
        max: {
            width: 1920,
            height: 1080
        }
    }
};

/**
 * グローバルゲーム状態管理
 * シーン間でのデータ共有に使用
 */
export const GameState = {
    // プレイヤー状態
    player: {
        hp: 100,
        maxHp: 100,
        score: 0,
        combo: 0,
        weapon: null
    },
    
    // ゲーム進行状態
    stage: {
        current: 1,
        scrollLocked: false,
        wavesCleared: 0
    },
    
    // ボス状態
    boss: {
        hp: 0,
        maxHp: 0,
        active: false,
        phase: 1
    },
    
    // デバッグ・設定
    debug: {
        showHitboxes: false,
        godMode: false,
        skipIntro: true
    }
};

/**
 * ゲームの初期化とエラーハンドリング
 */
function initializeGame() {
    try {
        // Phaserが正常にロードされているかチェック
        if (typeof Phaser === 'undefined') {
            throw new Error('Phaser.js が正常にロードされていません');
        }
        
        // ゲームインスタンス作成
        const game = new Phaser.Game(gameConfig);
        
        // グローバルアクセス用（デバッグ時に使用）
        window.game = game;
        window.GameState = GameState;
        window.CONSTANTS = CONSTANTS;
        
        // ゲーム終了時のクリーンアップ
        window.addEventListener('beforeunload', () => {
            if (game) {
                game.destroy(true);
            }
        });
        
        console.log('ベルトスクロールアクションゲーム 初期化完了');
        console.log(`画面サイズ: ${CONSTANTS.GAME_WIDTH}x${CONSTANTS.GAME_HEIGHT}`);
        
        return game;
        
    } catch (error) {
        console.error('ゲームの初期化に失敗しました:', error);
        
        // エラー表示用のDOM要素を作成
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: monospace;
            text-align: center;
            z-index: 1000;
        `;
        errorDiv.innerHTML = `
            <h3>ゲームの初期化に失敗しました</h3>
            <p>${error.message}</p>
            <p>ページを再読み込みしてください</p>
        `;
        document.body.appendChild(errorDiv);
        
        return null;
    }
}

// DOMContentLoaded後にゲームを初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}