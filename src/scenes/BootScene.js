export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
    this.loadingProgress = 0;
    this.loadingText = null;
    this.progressBar = null;
    this.progressBox = null;
  }

  preload() {
    this.createLoadingUI();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  /**
   * ローディングUIを作成
   */
  createLoadingUI() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 背景
    this.add.rectangle(centerX, centerY, 800, 600, 0x1a1a2e);

    // タイトル
    this.add.text(centerX, centerY - 100, 'STEAM FIGHTER', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff6b6b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(centerX, centerY - 60, '～蒸気機関の路地裏～', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ecdc4'
    }).setOrigin(0.5);

    // プログレスバー背景
    this.progressBox = this.add.rectangle(centerX, centerY + 50, 400, 30, 0x222222);
    this.progressBox.setStrokeStyle(2, 0x888888);

    // プログレスバー
    this.progressBar = this.add.rectangle(centerX - 198, centerY + 50, 0, 26, 0x4ecdc4);
    this.progressBar.setOrigin(0, 0.5);

    // ローディングテキスト
    this.loadingText = this.add.text(centerX, centerY + 100, 'Loading... 0%', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 操作説明
    this.add.text(centerX, centerY + 150, '操作: ←→↑↓ 移動  Z 攻撃  X 回避', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888'
    }).setOrigin(0.5);
  }

  /**
   * ローディングイベントを設定
   */
  setupLoadingEvents() {
    this.load.on('progress', (value) => {
      this.loadingProgress = Math.floor(value * 100);
      this.updateLoadingUI(value);
    });

    this.load.on('fileprogress', (file) => {
      console.log(`Loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Loading Complete!');
      
      // 少し待ってからゲームシーンへ移行
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene');
        this.scene.launch('UIScene'); // UIシーンを並行起動
      });
    });

    this.load.on('loaderror', (file) => {
      console.error(`Failed to load: ${file.key}`);
      this.loadingText.setText(`Error loading: ${file.key}`);
    });
  }

  /**
   * ローディングUIを更新
   * @param {number} progress - 0から1の進捗値
   */
  updateLoadingUI(progress) {
    // プログレスバーの幅を更新
    this.progressBar.width = 396 * progress;
    
    // テキストを更新
    this.loadingText.setText(`Loading... ${this.loadingProgress}%`);

    // 進捗に応じてバーの色を変更
    if (progress < 0.3) {
      this.progressBar.setFillStyle(0xff6b6b); // 赤
    } else if (progress < 0.7) {
      this.progressBar.setFillStyle(0xffd93d); // 黄
    } else {
      this.progressBar.setFillStyle(0x4ecdc4); // 緑
    }
  }

  /**
   * アセットを読み込み
   */
  loadAssets() {
    // 基本的な1x1白ピクセル（ヒットボックス用）
    this.load.image('__WHITE', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');

    // 開発用矩形スプライト（将来的にドット絵に置き換え）
    this.generatePlaceholderSprites();

    // 背景画像（プレースホルダー）
    this.generateBackgroundSprites();

    // 音声ファイル（将来拡張用）
    this.loadAudioAssets();

    // 設定ファイル
    this.loadConfigAssets();
  }

  /**
   * プレースホルダースプライトを生成
   */
  generatePlaceholderSprites() {
    // プレイヤー用矩形
    this.generateColoredRectangle('player_rect', 48, 64, 0x3399ff);
    
    // 敵用矩形
    this.generateColoredRectangle('enemy_rect', 44, 60, 0xff6b6b);
    
    // ボス用矩形
    this.generateColoredRectangle('boss_rect', 80, 100, 0x8b0000);
    
    // 武器用矩形
    this.generateColoredRectangle('weapon_steam_pipe', 60, 12, 0x888888);
    this.generateColoredRectangle('weapon_gear_star', 24, 24, 0xffd700);
    this.generateColoredRectangle('weapon_spark_lantern', 20, 32, 0x00ffff);
    
    // エフェクト用
    this.generateColoredRectangle('effect_steam', 80, 40, 0xcccccc);
    this.generateColoredRectangle('effect_spark', 16, 16, 0xffff00);
    this.generateColoredRectangle('effect_gear', 20, 20, 0xffa500);
  }

  /**
   * 指定色の矩形テクスチャを生成
   * @param {string} key - テクスチャキー
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @param {number} color - 色（16進数）
   */
  generateColoredRectangle(key, width, height, color) {
    const graphics = this.add.graphics();
    graphics.fillStyle(color);
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(2, 0x000000);
    graphics.strokeRect(0, 0, width, height);
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * 背景スプライトを生成
   */
  generateBackgroundSprites() {
    // メイン背景（蒸気管の路地）
    this.generateGradientBackground('bg_alley', 960, 540, 0x2c3e50, 0x34495e);
    
    // ボス戦背景
    this.generateGradientBackground('bg_boss_arena', 960, 540, 0x8b0000, 0x4a0000);
  }

  /**
   * グラデーション背景を生成
   * @param {string} key - テクスチャキー
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @param {number} topColor - 上部の色
   * @param {number} bottomColor - 下部の色
   */
  generateGradientBackground(key, width, height, topColor, bottomColor) {
    const graphics = this.add.graphics();
    
    // 簡易グラデーション（矩形を重ねて表現）
    for (let y = 0; y < height; y++) {
      const ratio = y / height;
      const r1 = (topColor >> 16) & 0xff;
      const g1 = (topColor >> 8) & 0xff;
      const b1 = topColor & 0xff;
      const r2 = (bottomColor >> 16) & 0xff;
      const g2 = (bottomColor >> 8) & 0xff;
      const b2 = bottomColor & 0xff;
      
      const r = Math.floor(r1 + (r2 - r1) * ratio);
      const g = Math.floor(g1 + (g2 - g1) * ratio);
      const b = Math.floor(b1 + (b2 - b1) * ratio);
      
      const color = (r << 16) | (g << 8) | b;
      graphics.fillStyle(color);
      graphics.fillRect(0, y, width, 1);
    }
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * 音声アセットを読み込み（将来拡張用）
   */
  loadAudioAssets() {
    // 現在はプレースホルダー
    // 将来的にここに音声ファイルの読み込みを追加
    /*
    this.load.audio('bgm_stage1', ['assets/audio/bgm_stage1.mp3', 'assets/audio/bgm_stage1.ogg']);
    this.load.audio('bgm_boss', ['assets/audio/bgm_boss.mp3', 'assets/audio/bgm_boss.ogg']);
    this.load.audio('se_punch', ['assets/audio/se_punch.wav']);
    this.load.audio('se_steam', ['assets/audio/se_steam.wav']);
    */
  }

  /**
   * 設定ファイルを読み込み（将来拡張用）
   */
  loadConfigAssets() {
    // 現在はプレースホルダー
    // 将来的にゲーム設定やローカライゼーションファイルを読み込み
    /*
    this.load.json('gameConfig', 'assets/data/gameConfig.json');
    this.load.json('localization_ja', 'assets/data/localization_ja.json');
    */
  }

  /**
   * エラーハンドリング用のフォールバック処理
   */
  handleLoadError() {
    console.warn('Some assets failed to load, using fallbacks');
    
    // 最低限のアセットが読み込めていればゲーム続行
    if (this.textures.exists('__WHITE') && this.textures.exists('player_rect')) {
      this.loadingText.setText('Loading with fallbacks...');
      this.time.delayedCall(1000, () => {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      });
    } else {
      this.loadingText.setText('Critical assets missing. Please refresh.');
    }
  }

  /**
   * 開発モード用：アセット再読み込み機能
   */
  reloadAssets() {
    if (process.env.NODE_ENV === 'development') {
      this.load.reset();
      this.loadAssets();
      this.load.start();
    }
  }
}