export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('📦 アセット読み込み開始');
        
        // プログレスバー作成
        this.createProgressBar();
        
        // 現在は矩形ボックスで開発するため、基本的な色データのみ作成
        this.createBasicAssets();
        
        // ローディングイベント
        this.load.on('progress', (progress) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0x00ff00);
            this.progressBar.fillRect(
                this.cameras.main.centerX - 200,
                this.cameras.main.centerY - 10,
                400 * progress,
                20
            );
        });

        this.load.on('complete', () => {
            console.log('✅ アセット読み込み完了');
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
    }

    createProgressBar() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // ローディング背景
        this.add.rectangle(centerX, centerY - 50, 500, 100, 0x000000, 0.8);
        this.add.text(centerX, centerY - 80, 'Loading Assets...', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // プログレスバー枠
        this.add.rectangle(centerX, centerY, 404, 24, 0x333333);
        this.progressBar = this.add.graphics();
    }

    createBasicAssets() {
        // 開発用の基本色データを作成（矩形表示用）
        const graphics = this.add.graphics();
        
        // 1x1の白いピクセルを作成（ヒットボックス等に使用）
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 1, 1);
        graphics.generateTexture('__WHITE', 1, 1);
        
        // プレイヤー用青色矩形
        graphics.clear();
        graphics.fillStyle(0x3399ff);
        graphics.fillRect(0, 0, 48, 64);
        graphics.generateTexture('player_rect', 48, 64);
        
        // 敵用赤色矩形
        graphics.clear();
        graphics.fillStyle(0xff3333);
        graphics.fillRect(0, 0, 40, 56);
        graphics.generateTexture('enemy_rect', 40, 56);
        
        // ボス用大きな赤色矩形
        graphics.clear();
        graphics.fillStyle(0xff1111);
        graphics.fillRect(0, 0, 80, 96);
        graphics.generateTexture('boss_rect', 80, 96);
        
        // 武器用黄色矩形
        graphics.clear();
        graphics.fillStyle(0xffff33);
        graphics.fillRect(0, 0, 32, 8);
        graphics.generateTexture('weapon_rect', 32, 8);
        
        graphics.destroy();
    }
}