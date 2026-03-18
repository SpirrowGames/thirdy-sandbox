export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
    this.loadingText = null;
    this.progressBar = null;
    this.progressBox = null;
  }

  preload() {
    this.createLoadingUI();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  create() {
    // ローディング完了後、少し待ってからGameSceneに遷移
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
  }

  createLoadingUI() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 背景
    this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x222222);

    // タイトル
    this.add.text(centerX, centerY - 100, 'STEAM BRAWLER', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(centerX, centerY - 60, '蒸気機関が支配する街の裏路地', {
      fontSize: '16px',
      fill: '#cccccc',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // プログレスバーの背景
    this.progressBox = this.add.rectangle(centerX, centerY + 50, 320, 20, 0x444444);
    this.progressBox.setStrokeStyle(2, 0x888888);

    // プログレスバー（実際の進行度）
    this.progressBar = this.add.rectangle(centerX - 158, centerY + 50, 4, 16, 0x00ff00);
    this.progressBar.setOrigin(0, 0.5);

    // ローディングテキスト
    this.loadingText = this.add.text(centerX, centerY + 100, 'Loading... 0%', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
  }

  setupLoadingEvents() {
    // ローディング進行度の更新
    this.load.on('progress', (value) => {
      const percentage = Math.floor(value * 100);
      this.loadingText.setText(`Loading... ${percentage}%`);
      
      // プログレスバーの幅を更新
      this.progressBar.width = 316 * value; // 320 - 4 (padding)
    });

    // ファイル読み込み完了時
    this.load.on('filoadcomplete', (key) => {
      console.log(`Loaded asset: ${key}`);
    });

    // 全ファイル読み込み完了時
    this.load.on('complete', () => {
      this.loadingText.setText('Loading Complete!');
      console.log('All assets loaded successfully');
    });

    // エラーハンドリング
    this.load.on('loaderror', (file) => {
      console.error(`Failed to load asset: ${file.key}`);
      this.loadingText.setText('Loading Error!');
      this.loadingText.setTint(0xff0000);
    });
  }

  loadAssets() {
    // MVPフェーズでは矩形ボックスを使用するため、最小限のアセットのみ
    
    // プレースホルダー画像（1x1の白いピクセル）
    this.load.image('__WHITE', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // 将来のスプライト用プレースホルダー
    this.createPlaceholderSprites();
    
    // 効果音用の無音ファイル（将来拡張用）
    this.load.audio('silence', ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcJF2m98OScTgwNUarm7blmGgU7k9n1unAoBC13yO/eizEJHWq+8+OWT']);
    
    // ダミーローディング時間（MVPでは即座に完了するため、UX向上のため少し遅延）
    for (let i = 0; i < 10; i++) {
      this.load.image(`dummy_${i}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    }
  }

  createPlaceholderSprites() {
    // 将来のスプライトシート用プレースホルダー
    // 現在は使用しないが、アセット管理の構造を準備
    const placeholders = [
      'player_idle',
      'player_walk', 
      'player_attack',
      'enemy_idle',
      'enemy_walk',
      'enemy_attack',
      'boss_idle',
      'boss_attack',
      'weapon_pipe',
      'weapon_gear',
      'weapon_lantern'
    ];

    placeholders.forEach(key => {
      this.load.image(key, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    });
  }
}