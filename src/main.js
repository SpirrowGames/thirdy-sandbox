/**
 * Phaser.js 3 メインエントリーポイント
 * ゲームの基本設定とシーン登録を行う
 */

// 定数のインポート
const {
    GAME_WIDTH,
    GAME_HEIGHT,
    DEBUG_PHYSICS
} = window.GAME_CONSTANTS;

/**
 * 仮のBootSceneクラス（アセットロード用）
 * 将来的にアセット管理を実装する際に使用
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // 基本的な白色矩形テクスチャを生成（当たり判定可視化用）
        this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(0, 0, 1, 1)
            .generateTexture('__WHITE', 1, 1);
            
        // 基本色のテクスチャを生成（開発用）
        this.generateColorTexture('__BLUE', 0x3399ff);
        this.generateColorTexture('__RED', 0xff3333);
        this.generateColorTexture('__GREEN', 0x33ff33);
        this.generateColorTexture('__YELLOW', 0xffff33);
        this.generateColorTexture('__PURPLE', 0x9933ff);
    }
    
    /**
     * 色付きテクスチャを生成する
     * @param {string} key - テクスチャキー
     * @param {number} color - 色（16進数）
     */
    generateColorTexture(key, color) {
        this.add.graphics()
            .fillStyle(color)
            .fillRect(0, 0, 1, 1)
            .generateTexture(key, 1, 1);
    }
    
    create() {
        console.log('BootScene: アセット読み込み完了');
        
        // 開発段階では直接GameSceneに移行
        this.scene.start('GameScene');
    }
}

/**
 * 仮のGameSceneクラス（メインゲームループ）
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    create() {
        console.log('GameScene: ゲーム開始');
        
        // 背景色を設定
        this.cameras.main.setBackgroundColor('#2c1810');
        
        // カメラの範囲を設定（ステージ全体をカバー）
        this.cameras.main.setBounds(0, 0, window.GAME_CONSTANTS.STAGE_WIDTH, GAME_HEIGHT);
        
        // 開発用のテキスト表示
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ベルトスクロールアクションゲーム\n\n開発中...', {
            fontSize: '32px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // 地面の可視化（開発用）
        this.drawGroundBounds();
        
        // UISceneを並行起動
        this.scene.launch('UIScene');
        
        console.log('GameScene: 初期化完了');
    }
    
    /**
     * 地面範囲の可視化（開発用）
     */
    drawGroundBounds() {
        const { GROUND_Y_MIN, GROUND_Y_MAX, STAGE_WIDTH } = window.GAME_CONSTANTS;
        
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x00ff00, 0.5);
        
        // 上限ライン
        graphics.moveTo(0, GROUND_Y_MIN);
        graphics.lineTo(STAGE_WIDTH, GROUND_Y_MIN);
        
        // 下限ライン
        graphics.moveTo(0, GROUND_Y_MAX);
        graphics.lineTo(STAGE_WIDTH, GROUND_Y_MAX);
        
        graphics.stroke();
    }
    
    update(time, delta) {
        // メインゲームループ（将来実装）
    }
}

/**
 * 仮のUISceneクラス（HUD表示）
 */
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }
    
    create() {
        console.log('UIScene: UI初期化');
        
        // HUD背景
        const hudBg = this.add.graphics();
        hudBg.fillStyle(0x000000, 0.3);
        hudBg.fillRect(0, 0, GAME_WIDTH, 60);
        
        // 開発用のHUD表示
        this.add.text(20, 20, 'HP: ♥♥♥♥♥', {
            fontSize: '20px',
            fill: '#ff6666'
        });
        
        this.add.text(200, 20, 'SCORE: 00000', {
            fontSize: '20px',
            fill: '#ffffff'
        });
        
        this.add.text(400, 20, 'COMBO: 0x', {
            fontSize: '20px',
            fill: '#ffff66'
        });
        
        // バージョン情報
        this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, 'v0.1.0-dev', {
            fontSize: '12px',
            fill: '#666666'
        }).setOrigin(1, 1);
        
        console.log('UIScene: UI作成完了');
    }
    
    update() {
        // UI更新（将来実装）
    }
}

/**
 * Phaser.Game設定
 */
const gameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    
    // 物理エンジン設定
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },  // 横スクロールなので重力なし
            debug: DEBUG_PHYSICS
        }
    },
    
    // シーン登録
    scene: [BootScene, GameScene, UIScene],
    
    // 描画設定
    render: {
        antialias: false,       // ドット絵向け
        pixelArt: true          // ピクセルアート用設定
    },
    
    // スケール設定
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

/**
 * ゲーム開始処理
 */
function startGame() {
    // 既存のゲームインスタンスがある場合は破棄
    if (window.game) {
        window.game.destroy(true);
    }
    
    // 新しいゲームインスタンスを作成
    window.game = new Phaser.Game(gameConfig);
    
    // ロード完了後に読み込み表示を非表示
    window.game.events.once('ready', () => {
        const loadingElement = document.querySelector('.loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    });
    
    console.log('Phaser Game インスタンス作成完了');
    console.log('設定:', {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        physics: 'arcade',
        scenes: ['BootScene', 'GameScene', 'UIScene']
    });
}

// DOM読み込み完了後にゲームを開始
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}

// グローバルエラーハンドリング
window.addEventListener('error', (event) => {
    console.error('ゲームエラー:', event.error);
});

// デバッグ用のグローバル関数
window.gameDebug = {
    /**
     * ゲーム再起動
     */
    restart: () => {
        startGame();
    },
    
    /**
     * 定数表示
     */
    showConstants: () => {
        console.table(window.GAME_CONSTANTS);
    },
    
    /**
     * シーン情報表示
     */
    showScenes: () => {
        if (window.game) {
            console.log('アクティブシーン:', window.game.scene.keys);
        }
    }
};

console.log('ベルトスクロールアクションゲーム 初期化完了');
console.log('デバッグコマンド: gameDebug.restart(), gameDebug.showConstants(), gameDebug.showScenes()');