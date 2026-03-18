/**
 * ベルトスクロールアクションゲーム メインエントリーポイント
 * Phaser.Gameインスタンスの生成とシーン登録を行う
 */
import { GAME_CONFIG } from './constants.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

/**
 * Phaserゲーム設定オブジェクト
 */
const gameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.GAME_WIDTH,
    height: GAME_CONFIG.GAME_HEIGHT,
    parent: 'game', // HTMLのdiv#gameに描画
    backgroundColor: '#2c1810', // スチームパンクらしいダークブラウン
    
    // 物理エンジン設定
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { 
                x: 0, 
                y: GAME_CONFIG.PHYSICS.GRAVITY_Y 
            },
            debug: GAME_CONFIG.PHYSICS.DEBUG,
            // ベルトスクロール用の最適化
            checkCollision: {
                up: false,    // 上方向の衝突は不要
                down: false,  // 下方向の衝突は不要
                left: true,   // 左右は必要
                right: true,
            },
        },
    },
    
    // シーン登録（起動順序）
    scene: [
        BootScene,  // アセットロード
        GameScene,  // メインゲーム
        UIScene,    // HUD表示
    ],
    
    // 描画設定
    render: {
        antialias: false, // ドット絵に適した設定
        pixelArt: true,   // ピクセルアート最適化
    },
    
    // スケール設定
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // レスポンシブ対応
        min: {
            width: 480,
            height: 270,
        },
        max: {
            width: 1920,
            height: 1080,
        },
    },
    
    // 音声設定
    audio: {
        disableWebAudio: false,
    },
};

/**
 * ゲーム起動処理
 * DOMContentLoaded後にPhaser.Gameインスタンスを生成
 */
function startGame() {
    // ゲームインスタンス生成
    const game = new Phaser.Game(gameConfig);
    
    // グローバルな設定を追加
    game.config.gameSettings = {
        version: '0.1.0-MVP',
        debugMode: false,
        soundEnabled: true,
        musicEnabled: true,
    };
    
    // デバッグ情報の出力
    if (GAME_CONFIG.PHYSICS.DEBUG) {
        console.log('🎮 ベルトスクロールアクション - デバッグモード');
        console.log('📐 解像度:', GAME_CONFIG.GAME_WIDTH, 'x', GAME_CONFIG.GAME_HEIGHT);
        console.log('🎯 ステージ幅:', GAME_CONFIG.STAGE_WIDTH);
        console.log('📏 奥行き範囲:', GAME_CONFIG.GROUND_Y_MIN, '-', GAME_CONFIG.GROUND_Y_MAX);
    }
    
    // ゲームインスタンスをグローバルに保存（デバッグ用）
    window.game = game;
    
    return game;
}

// エラーハンドリング
function handleGameError(error) {
    console.error('❌ ゲーム起動エラー:', error);
    
    // エラー表示用のHTML要素を作成
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            background: #ff4444; 
            color: white; 
            padding: 20px; 
            border-radius: 8px;
            font-family: monospace;
            z-index: 9999;
        ">
            <h3>⚠️ ゲーム読み込みエラー</h3>
            <p>ゲームの初期化に失敗しました</p>
            <details>
                <summary>エラー詳細</summary>
                <pre>${error.message}</pre>
            </details>
            <button onclick="location.reload()" style="
                margin-top: 10px; 
                padding: 8px 16px; 
                background: white; 
                color: #ff4444; 
                border: none; 
                border-radius: 4px;
                cursor: pointer;
            ">
                再読み込み
            </button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// DOM読み込み完了後にゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    try {
        startGame();
    } catch (error) {
        handleGameError(error);
    }
});

// 未処理エラーのキャッチ
window.addEventListener('error', (event) => {
    console.error('🚨 未処理エラー:', event.error);
});

// Promiseの未処理リジェクトをキャッチ
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 未処理Promise拒否:', event.reason);
    event.preventDefault();
});