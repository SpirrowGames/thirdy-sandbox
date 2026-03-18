export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // ローディング画面の設定
        this.createLoadingScreen();
        
        // 開発初期用の基本的な矩形テクスチャを生成
        this.createBasicTextures();
        
        // 将来的にはここでスプライトやオーディオをロード
        // this.load.image('bg_alley', 'assets/backgrounds/alley.png');
        // this.load.audio('bgm_stage1', 'assets/audio/bgm_stage1.mp3');
    }

    create() {
        console.log('BootScene: アセットロード完了');
        
        // GameSceneとUISceneを並行起動
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
    }

    createLoadingScreen() {
        const { width, height } = this.cameras.main;
        
        // ローディングテキスト
        this.add.text(width / 2, height / 2, 'Loading...', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // プログレスバー（将来拡張用）
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 + 50, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 60, 300 * value, 30);
        });
    }

    createBasicTextures() {
        // 開発初期用の基本矩形テクスチャを生成
        const graphics = this.add.graphics();
        
        // プレイヤー用（青色）
        graphics.fillStyle(0x3498db);
        graphics.fillRect(0, 0, 48, 64);
        graphics.generateTexture('player_rect', 48, 64);
        
        // 敵用（赤色）
        graphics.clear();
        graphics.fillStyle(0xe74c3c);
        graphics.fillRect(0, 0, 40, 56);
        graphics.generateTexture('enemy_rect', 40, 56);
        
        // ボス用（暗赤色）
        graphics.clear();
        graphics.fillStyle(0x8b0000);
        graphics.fillRect(0, 0, 80, 96);
        graphics.generateTexture('boss_rect', 80, 96);
        
        // 武器用（黄色）
        graphics.clear();
        graphics.fillStyle(0xf1c40f);
        graphics.fillRect(0, 0, 32, 8);
        graphics.generateTexture('weapon_rect', 32, 8);
        
        // 攻撃判定用（透明）
        graphics.clear();
        graphics.fillStyle(0xff0000, 0.3);
        graphics.fillRect(0, 0, 1, 1);
        graphics.generateTexture('hitbox', 1, 1);
        
        graphics.destroy();
        
        console.log('BootScene: 基本テクスチャ生成完了');
    }
}