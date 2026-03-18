import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ローディングバーの作成
    this.createLoadingBar();
    
    // 基本的なプレースホルダーアセットの生成
    this.createPlaceholderAssets();
    
    // 将来的なアセット読み込み用のイベントハンドラー設定
    this.setupLoadingEvents();
  }

  create() {
    // ローディング完了後、GameSceneとUISceneを並行起動
    this.scene.start('GameScene');
    this.scene.start('UIScene');
  }

  createLoadingBar() {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // 背景
    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x1a1a1a);
    
    // ローディングテキスト
    this.add.text(centerX, centerY - 50, 'LOADING...', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // プログレスバー背景
    const progressBg = this.add.rectangle(centerX, centerY + 20, 400, 20, 0x333333);
    progressBg.setStrokeStyle(2, 0x666666);

    // プログレスバー
    const progressBar = this.add.rectangle(centerX - 200, centerY + 20, 0, 16, 0x00ff00);
    progressBar.setOrigin(0, 0.5);

    // ローディングイベントリスナー
    this.load.on('progress', (value) => {
      progressBar.width = 400 * value;
    });

    this.load.on('complete', () => {
      this.add.text(centerX, centerY + 60, 'Press any key to start', {
        fontSize: '16px',
        fill: '#cccccc',
        fontFamily: 'Arial'
      }).setOrigin(0.5);

      // キー入力でゲーム開始
      this.input.keyboard.once('keydown', () => {
        this.scene.start('GameScene');
        this.scene.start('UIScene');
      });
    });
  }

  createPlaceholderAssets() {
    // 開発用の矩形プレースホルダーを生成
    this.createColoredRectangle('__WHITE', 1, 1, 0xffffff);
    this.createColoredRectangle('__PLAYER', 48, 64, 0x3399ff);
    this.createColoredRectangle('__ENEMY', 40, 56, 0xff3333);
    this.createColoredRectangle('__BOSS', 80, 96, 0x990000);
    this.createColoredRectangle('__WEAPON', 32, 16, 0xffaa00);
    this.createColoredRectangle('__BACKGROUND', GAME_WIDTH, GAME_HEIGHT, 0x2d1810);

    // 将来のスプライト読み込み用の拡張ポイント
    this.loadFutureAssets();
  }

  createColoredRectangle(key, width, height, color) {
    // Canvas要素を作成して矩形を描画
    const canvas = this.add.renderTexture(0, 0, width, height);
    canvas.fill(color);
    canvas.saveTexture(key);
    canvas.destroy();
  }

  loadFutureAssets() {
    // 将来的なアセット読み込みのプレースホルダー
    // 現在は何も読み込まないが、拡張時にここでスプライトシートやオーディオを読み込む
    
    // 例：
    // this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 48, frameHeight: 64 });
    // this.load.audio('bgm_stage1', 'assets/audio/bgm_stage1.ogg');
    // this.load.image('bg_alley', 'assets/backgrounds/alley.png');
  }

  setupLoadingEvents() {
    // エラーハンドリング
    this.load.on('loaderror', (file) => {
      console.error(`Failed to load asset: ${file.key}`);
      this.showErrorMessage(`Failed to load: ${file.key}`);
    });

    // ファイル読み込み完了時のログ（開発用）
    this.load.on('filecomplete', (key) => {
      console.log(`Loaded asset: ${key}`);
    });
  }

  showErrorMessage(message) {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    
    this.add.text(centerX, centerY + 100, message, {
      fontSize: '16px',
      fill: '#ff0000',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }
}