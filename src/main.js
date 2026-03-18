import * as GameConstants from './constants/GameConstants.js';

/**
 * メインゲームクラス - Phaserの設定とシーン管理
 */
class SteamPunkBeltScroller {
    constructor() {
        this.game = null;
        this.init();
    }

    /**
     * Phaserゲームインスタンスの初期化
     */
    init() {
        const config = {
            type: Phaser.AUTO,
            width: GameConstants.GAME_WIDTH,
            height: GameConstants.GAME_HEIGHT,
            backgroundColor: GameConstants.COLORS.BACKGROUND,
            
            // 物理エンジン設定
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 }, // 重力なし（2.5D横スクロール）
                    debug: GameConstants.DEBUG_PHYSICS,
                    debugShowBody: GameConstants.DEBUG_HITBOXES,
                    debugShowStaticBody: GameConstants.DEBUG_HITBOXES,
                    debugShowVelocity: GameConstants.DEBUG_HITBOXES
                }
            },

            // レンダリング設定
            render: {
                antialias: false,  // ドット絵対応
                pixelArt: true,    // ピクセルパーフェクト
                roundPixels: true  // ピクセル境界に合わせる
            },

            // スケール設定
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: GameConstants.GAME_WIDTH * 0.5,
                    height: GameConstants.GAME_HEIGHT * 0.5
                },
                max: {
                    width: GameConstants.GAME_WIDTH * 2,
                    height: GameConstants.GAME_HEIGHT * 2
                }
            },

            // シーン登録（現在は空の配列、後で追加予定）
            scene: [],

            // DOM要素設定
            parent: document.body,
            
            // オーディオ設定
            audio: {
                disableWebAudio: false
            }
        };

        try {
            this.game = new Phaser.Game(config);
            this.setupGlobalErrorHandling();
            console.log('🎮 Steam-Punk Belt Scroller initialized successfully');
            console.log(`📐 Game resolution: ${GameConstants.GAME_WIDTH}x${GameConstants.GAME_HEIGHT}`);
            console.log(`🏭 Stage size: ${GameConstants.STAGE_WIDTH}x${GameConstants.STAGE_HEIGHT}`);
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showErrorMessage('ゲームの初期化に失敗しました。ブラウザを更新してください。');
        }
    }

    /**
     * グローバルエラーハンドリングの設定
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('❌ Global error:', event.error);
            this.showErrorMessage('予期しないエラーが発生しました。');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled promise rejection:', event.reason);
            this.showErrorMessage('非同期処理でエラーが発生しました。');
        });
    }

    /**
     * エラーメッセージの表示
     * @param {string} message - エラーメッセージ
     */
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        `;
        errorDiv.innerHTML = `
            <h3>⚠️ エラー</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: #fff;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-family: inherit;
                margin-top: 10px;
            ">再読み込み</button>
        `;
        document.body.appendChild(errorDiv);
    }

    /**
     * ゲームの破棄
     */
    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
            console.log('🗑️ Game destroyed');
        }
    }

    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            gameWidth: GameConstants.GAME_WIDTH,
            gameHeight: GameConstants.GAME_HEIGHT,
            stageWidth: GameConstants.STAGE_WIDTH,
            depthRange: `${GameConstants.GROUND_Y_MIN} - ${GameConstants.GROUND_Y_MAX}`,
            depthThreshold: GameConstants.DEPTH_THRESHOLD,
            commandWindow: GameConstants.COMMAND_WINDOW,
            isRunning: this.game && this.game.isRunning,
            scenes: this.game ? this.game.scene.keys : []
        };
    }
}

// グローバルスコープでゲームインスタンスを作成
const game = new SteamPunkBeltScroller();

// デバッグ用のグローバル関数
window.getGameDebugInfo = () => game.getDebugInfo();
window.destroyGame = () => game.destroy();

// モジュールとしてエクスポート
export default game;