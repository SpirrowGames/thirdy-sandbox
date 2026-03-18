export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // ローディング画面の表示
        this.add.text(480, 270, 'スチームパンク ベルトスクロール', {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(480, 320, 'ロード中...', {
            fontSize: '16px',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        // プログレスバー
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(340, 370, 280, 30);

        // ローディング進捗のイベント処理
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x3498db, 1);
            progressBar.fillRect(350, 380, 260 * value, 10);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });

        // 開発用の矩形テクスチャを生成
        this.createDevelopmentTextures();
    }

    create() {
        // ゲームシーンとUIシーンを開始
        this.scene.start('GameScene');
        this.scene.start('UIScene');
    }

    createDevelopmentTextures() {
        // 開発用の色付き矩形テクスチャを生成
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
        
        // 攻撃判定用（透明度のある白）
        graphics.clear();
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRect(0, 0, 1, 1);
        graphics.generateTexture('hitbox', 1, 1);
        
        // UI用
        graphics.clear();
        graphics.fillStyle(0x2ecc71);
        graphics.fillRect(0, 0, 1, 1);
        graphics.generateTexture('hp_bar', 1, 1);
        
        graphics.destroy();
    }
}