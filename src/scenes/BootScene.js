/**
 * アセットロード・初期化シーン
 * 将来的にスプライトやオーディオのロードを行う
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // ローディングバーの作成
        this.createLoadingBar();
        
        // 基本的な矩形テクスチャを生成（スプライト導入前の開発用）
        this.createBasicTextures();
        
        // 将来的にここで実際のアセットをロード
        // this.load.image('player_idle', 'assets/sprites/player_idle.png');
        // this.load.audio('bgm_stage1', 'assets/audio/stage1.mp3');
    }

    create() {
        console.log('BootScene: アセットロード完了');
        
        // GameSceneに遷移
        this.scene.start('GameScene');
    }

    createLoadingBar() {
        const { width, height } = this.cameras.main;
        
        // ローディングバーの背景
        const bgBar = this.add.rectangle(width / 2, height / 2, 400, 20, 0x666666);
        
        // ローディングバーの進行表示
        const progressBar = this.add.rectangle(width / 2 - 200, height / 2, 0, 20, 0x00ff00);
        
        // ローディングテキスト
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // ロード進行の監視
        this.load.on('progress', (progress) => {
            progressBar.width = 400 * progress;
            loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
        });

        this.load.on('complete', () => {
            loadingText.setText('Complete!');
        });
    }

    createBasicTextures() {
        // 開発用の基本矩形テクスチャを生成
        const graphics = this.add.graphics();
        
        // プレイヤー用（青色）
        graphics.fillStyle(0x3399ff);
        graphics.fillRect(0, 0, 48, 64);
        graphics.generateTexture('player_rect', 48, 64);
        
        // 敵用（赤色）
        graphics.clear();
        graphics.fillStyle(0xff3333);
        graphics.fillRect(0, 0, 40, 56);
        graphics.generateTexture('enemy_rect', 40, 56);
        
        // ボス用（暗赤色・大きめ）
        graphics.clear();
        graphics.fillStyle(0x993333);
        graphics.fillRect(0, 0, 80, 96);
        graphics.generateTexture('boss_rect', 80, 96);
        
        // 武器用（黄色）
        graphics.clear();
        graphics.fillStyle(0xffdd33);
        graphics.fillRect(0, 0, 32, 8);
        graphics.generateTexture('weapon_rect', 32, 8);
        
        // 攻撃ヒットボックス用（半透明白・デバッグ用）
        graphics.clear();
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRect(0, 0, 60, 40);
        graphics.generateTexture('hitbox_rect', 60, 40);
        
        graphics.destroy();
    }
}