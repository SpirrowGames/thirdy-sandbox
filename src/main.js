/**
 * ベルトスクロールアクションゲーム - メインエントリーポイント
 * Phaser.js 3 設定とグローバル定数定義
 */

// ゲーム定数定義
const GAME_CONFIG = {
    // 画面サイズ
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    
    // 奥行き（Y座標）範囲
    GROUND_Y_MIN: 360,  // 奥行き上限（画面上側）
    GROUND_Y_MAX: 480,  // 奥行き下限（画面下側）
    
    // 判定・システム定数
    DEPTH_THRESHOLD: 40,    // 奥行き判定閾値（px）
    COMMAND_WINDOW: 400,    // コマンド入力猶予（ms）
    COMBO_RESET: 1500,      // コンボリセット時間（ms）
    
    // ステージ設定
    STAGE_WIDTH: 3000,      // ステージ全幅
    
    // プレイヤー設定
    PLAYER_SPEED: 200,      // 移動速度（px/s）
    PLAYER_MAX_HP: 100,     // 最大HP
    
    // 物理設定
    GRAVITY: 0,             // 重力なし（ベルトスクロール）
    PHYSICS_DEBUG: false,   // デバッグモード
};

// グローバルアクセス用にwindowに設定
window.GAME_CONFIG = GAME_CONFIG;

/**
 * Phaser.js 3 ゲーム設定
 */
const phaserConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.GAME_WIDTH,
    height: GAME_CONFIG.GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    
    // 物理エンジン設定
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: GAME_CONFIG.GRAVITY },
            debug: GAME_CONFIG.PHYSICS_DEBUG
        }
    },
    
    // 描画設定
    render: {
        pixelArt: true,         // ピクセルアート対応
        antialias: false,       // アンチエイリアス無効
    },
    
    // シーン設定（現在は空配列、後で追加）
    scene: [],
    
    // スケール設定
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
    },
    
    // 入力設定
    input: {
        keyboard: true,
        mouse: false,
        touch: false
    }
};

/**
 * ゲームインスタンス生成とエラーハンドリング
 */
class GameBootstrap {
    constructor() {
        this.game = null;
        this.initGame();
    }
    
    initGame() {
        try {
            // ローディング表示を非表示
            const loadingElement = document.querySelector('.loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            // Phaserゲームインスタンス生成
            this.game = new Phaser.Game(phaserConfig);
            
            // グローバルアクセス用
            window.game = this.game;
            
            // ゲーム開始ログ
            console.log('🎮 ベルトスクロールアクションゲーム開始');
            console.log('📐 解像度:', GAME_CONFIG.GAME_WIDTH, 'x', GAME_CONFIG.GAME_HEIGHT);
            console.log('🌍 ステージ幅:', GAME_CONFIG.STAGE_WIDTH, 'px');
            console.log('🎯 奥行き範囲:', GAME_CONFIG.GROUND_Y_MIN, '-', GAME_CONFIG.GROUND_Y_MAX);
            
        } catch (error) {
            this.handleGameError(error);
        }
    }
    
    handleGameError(error) {
        console.error('❌ ゲーム初期化エラー:', error);
        
        // エラー表示
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div style="color: #ff6b6b; padding: 20px; text-align: center;">
                <h3>ゲーム読み込みエラー</h3>
                <p>ゲームの初期化に失敗しました。</p>
                <p>ページを再読み込みしてください。</p>
                <button onclick="location.reload()" style="
                    padding: 10px 20px; 
                    background: #3498db; 
                    color: white; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer;
                ">再読み込み</button>
            </div>
        `;
    }
    
    // ゲーム終了処理
    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }
}

/**
 * ユーティリティ関数
 */
const GameUtils = {
    /**
     * 奥行き判定用のY座標が有効範囲内かチェック
     * @param {number} y - チェックするY座標
     * @returns {boolean} 有効範囲内ならtrue
     */
    isValidGroundY(y) {
        return y >= GAME_CONFIG.GROUND_Y_MIN && y <= GAME_CONFIG.GROUND_Y_MAX;
    },
    
    /**
     * Y座標を有効範囲内にクランプ
     * @param {number} y - クランプするY座標
     * @returns {number} クランプされたY座標
     */
    clampGroundY(y) {
        return Phaser.Math.Clamp(y, GAME_CONFIG.GROUND_Y_MIN, GAME_CONFIG.GROUND_Y_MAX);
    },
    
    /**
     * 2つのエンティティが奥行き的に攻撃可能な距離にあるかチェック
     * @param {object} entity1 - エンティティ1（groundYプロパティを持つ）
     * @param {object} entity2 - エンティティ2（groundYプロパティを持つ）
     * @returns {boolean} 攻撃可能ならtrue
     */
    isDepthAligned(entity1, entity2) {
        return Math.abs(entity1.groundY - entity2.groundY) < GAME_CONFIG.DEPTH_THRESHOLD;
    },
    
    /**
     * Y座標に応じたスケール値を計算（遠近感表現）
     * @param {number} y - Y座標
     * @returns {number} スケール値（0.8〜1.2）
     */
    getScaleByDepth(y) {
        const ratio = (y - GAME_CONFIG.GROUND_Y_MIN) / (GAME_CONFIG.GROUND_Y_MAX - GAME_CONFIG.GROUND_Y_MIN);
        return 0.8 + (ratio * 0.4); // 0.8〜1.2のスケール
    }
};

// グローバルアクセス用
window.GameUtils = GameUtils;

/**
 * DOM読み込み完了後にゲーム開始
 */
document.addEventListener('DOMContentLoaded', () => {
    // ゲームブートストラップ開始
    const bootstrap = new GameBootstrap();
    
    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', () => {
        bootstrap.destroy();
    });
});

/**
 * デバッグ用グローバル関数
 */
if (GAME_CONFIG.PHYSICS_DEBUG) {
    window.togglePhysicsDebug = () => {
        if (window.game && window.game.scene.scenes[0]) {
            const scene = window.game.scene.scenes[0];
            if (scene.physics && scene.physics.world) {
                scene.physics.world.debugGraphic.visible = !scene.physics.world.debugGraphic.visible;
            }
        }
    };
    
    window.logGameConfig = () => {
        console.table(GAME_CONFIG);
    };
}