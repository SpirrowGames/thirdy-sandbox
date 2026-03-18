/**
 * Phaser.Gameインスタンス生成とゲーム開始
 * エントリーポイント
 */

class GameApplication {
    constructor() {
        this.game = null;
        this.init();
    }
    
    init() {
        // ローディング表示を削除
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Phaser設定
        const config = {
            type: Phaser.AUTO,
            width: GAME_CONFIG.GAME_WIDTH,
            height: GAME_CONFIG.GAME_HEIGHT,
            parent: 'game-container',
            backgroundColor: '#2c1810',  // スチームパンクっぽい暗い茶色
            
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },  // 2Dベルトスクロールなので重力なし
                    debug: GAME_CONFIG.DEBUG_PHYSICS
                }
            },
            
            // シーン登録（読み込み順序重要）
            scene: [
                BootScene,    // アセット読み込み
                GameScene,    // メインゲーム
                UIScene       // HUD表示
            ],
            
            // パフォーマンス設定
            render: {
                pixelArt: true,        // ドット絵向け設定
                antialias: false,      // アンチエイリアス無効
                roundPixels: true      // ピクセルパーフェクト
            },
            
            // オーディオ設定
            audio: {
                disableWebAudio: false,
                context: false
            }
        };
        
        try {
            this.game = new Phaser.Game(config);
            
            // グローバルエラーハンドリング
            this.game.events.on('error', this.handleGameError, this);
            
            // ゲーム一時停止/再開（ブラウザタブ切り替え時）
            this.setupVisibilityHandling();
            
            console.log('🎮 ベルトスクロールアクションゲーム開始');
            console.log(`📐 解像度: ${GAME_CONFIG.GAME_WIDTH}x${GAME_CONFIG.GAME_HEIGHT}`);
            
        } catch (error) {
            this.handleInitError(error);
        }
    }
    
    /**
     * ブラウザタブの可視性変化を監視してゲーム一時停止
     */
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (this.game && this.game.scene) {
                if (document.hidden) {
                    // タブが非アクティブになった時は一時停止
                    this.game.scene.getScenes().forEach(scene => {
                        if (scene.scene.isActive()) {
                            scene.scene.pause();
                        }
                    });
                } else {
                    // タブがアクティブになった時は再開
                    this.game.scene.getScenes().forEach(scene => {
                        if (scene.scene.isPaused()) {
                            scene.scene.resume();
                        }
                    });
                }
            }
        });
    }
    
    /**
     * ゲーム実行時エラーハンドリング
     */
    handleGameError(error) {
        console.error('🚨 ゲーム実行エラー:', error);
        
        // エラー情報をユーザーに表示
        const container = document.getElementById('game-container');
        if (container) {
            container.innerHTML = `
                <div style="color: #ff6b6b; padding: 20px; text-align: center;">
                    <h3>ゲームエラーが発生しました</h3>
                    <p>ページを再読み込みしてください</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px;">
                        再読み込み
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * 初期化エラーハンドリング
     */
    handleInitError(error) {
        console.error('🚨 ゲーム初期化エラー:', error);
        
        const container = document.getElementById('game-container');
        if (container) {
            container.innerHTML = `
                <div style="color: #ff6b6b; padding: 20px; text-align: center;">
                    <h3>ゲームの初期化に失敗しました</h3>
                    <p>ブラウザがWebGLに対応していない可能性があります</p>
                    <p>Chrome、Firefox、Safari等のモダンブラウザをご使用ください</p>
                </div>
            `;
        }
    }
    
    /**
     * ゲーム終了処理
     */
    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
            console.log('🎮 ゲーム終了');
        }
    }
}

// ページ読み込み完了時にゲーム開始
window.addEventListener('load', () => {
    // グローバルに保存（デバッグ用）
    window.gameApp = new GameApplication();
});

// ページアンロード時にゲーム終了
window.addEventListener('beforeunload', () => {
    if (window.gameApp) {
        window.gameApp.destroy();
    }
});