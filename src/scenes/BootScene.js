export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ローディング画面の基本要素を作成
    this.createLoadingScreen();
    
    // 基本的なアセットをロード
    this.loadBasicAssets();
    
    // ローディングイベントの設定
    this.setupLoadingEvents();
  }

  create() {
    // ロード完了後の処理
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
  }

  createLoadingScreen() {
    const { width, height } = this.game.config;
    
    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);
    
    // タイトル
    this.add.text(width / 2, height / 2 - 100, 'STEAM FIGHTER', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // サブタイトル
    this.add.text(width / 2, height / 2 - 50, 'スチームパンク・ベルトスクロールアクション', {
      fontSize: '18px',
      fill: '#cccccc',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // ローディングバーの背景
    const barBg = this.add.rectangle(width / 2, height / 2 + 50, 400, 20, 0x333333);
    barBg.setStrokeStyle(2, 0x666666);
    
    // ローディングバー
    this.loadingBar = this.add.rectangle(width / 2 - 198, height / 2 + 50, 0, 16, 0x4CAF50);
    this.loadingBar.setOrigin(0, 0.5);
    
    // ローディングテキスト
    this.loadingText = this.add.text(width / 2, height / 2 + 100, 'Loading... 0%', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
  }

  loadBasicAssets() {
    // 開発用の基本アセット（矩形描画用）
    this.load.image('__WHITE', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // 将来的なスプライトアセット用のプレースホルダー
    this.loadPlaceholderAssets();
    
    // オーディオアセット（将来拡張用）
    this.loadAudioAssets();
  }

  loadPlaceholderAssets() {
    // プレイヤー用プレースホルダー
    this.load.image('player_placeholder', 'data:image/png;base64,' + this.createColoredSquare('#3399ff', 48, 64));
    
    // 敵用プレースホルダー
    this.load.image('enemy_placeholder', 'data:image/png;base64,' + this.createColoredSquare('#ff3333', 40, 56));
    
    // ボス用プレースホルダー
    this.load.image('boss_placeholder', 'data:image/png;base64,' + this.createColoredSquare('#ff6600', 80, 96));
    
    // 武器用プレースホルダー
    this.load.image('weapon_pipe', 'data:image/png;base64,' + this.createColoredSquare('#888888', 60, 12));
    this.load.image('weapon_gear', 'data:image/png;base64,' + this.createColoredSquare('#ffaa00', 24, 24));
    this.load.image('weapon_lantern', 'data:image/png;base64,' + this.createColoredSquare('#ffff00', 20, 32));
    
    // 背景用プレースホルダー
    this.load.image('bg_alley', 'data:image/png;base64,' + this.createGradientBackground());
  }

  loadAudioAssets() {
    // 将来のオーディオアセット用
    // 現在は空実装（サイレントモードで開発）
    console.log('Audio assets loading placeholder - implement when needed');
  }

  setupLoadingEvents() {
    this.load.on('progress', (progress) => {
      // ローディングバーの更新
      this.loadingBar.width = 396 * progress;
      
      // パーセンテージの更新
      const percent = Math.round(progress * 100);
      this.loadingText.setText(`Loading... ${percent}%`);
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Complete!');
      console.log('All assets loaded successfully');
    });

    this.load.on('loaderror', (file) => {
      console.error('Failed to load asset:', file.key);
      this.loadingText.setText('Loading Error - Check Console');
    });
  }

  createColoredSquare(color, width, height) {
    // Canvas要素を作成してBase64エンコードされた画像データを生成
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // 背景色を設定
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // 境界線を追加（視認性向上）
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    // Base64データを取得（data:image/png;base64,プレフィックスを除去）
    return canvas.toDataURL('image/png').split(',')[1];
  }

  createGradientBackground() {
    // グラデーション背景の生成
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    
    // グラデーションを作成（スチームパンクっぽい色合い）
    const gradient = ctx.createLinearGradient(0, 0, 0, 540);
    gradient.addColorStop(0, '#2c1810');  // 濃い茶色
    gradient.addColorStop(0.5, '#4a3728'); // 中間色
    gradient.addColorStop(1, '#1a1a1a');   // 黒っぽい
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);
    
    return canvas.toDataURL('image/png').split(',')[1];
  }
}