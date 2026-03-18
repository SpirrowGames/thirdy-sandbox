import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * BootScene - アセットロード用シーン
 * 
 * 責務:
 * - ゲーム開始前のアセット読み込み
 * - 初期化処理
 * - GameSceneへの遷移制御
 * 
 * MVP段階では矩形ボックスのため実際のアセットロードは最小限とし、
 * 将来のスプライト導入時に拡張する設計
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ロード画面用の簡単な表示要素を作成
    this.createLoadingUI();
    
    // MVP用の最小限アセット（矩形描画用の1px白画像）
    this.loadEssentialAssets();
    
    // 将来拡張用のアセットロード（現在は空実装）
    this.loadGameAssets();
    
    // ロード進捗の監視
    this.setupLoadingProgress();
  }

  create() {
    // ロード完了後の初期化処理
    this.initializeGameData();
    
    // 少し待ってからGameSceneに遷移（ロード画面の表示時間確保）
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
  }

  /**
   * ロード画面のUI要素を作成
   */
  createLoadingUI() {
    // 背景
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a1a);
    
    // タイトル
    this.titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 
      'STEAM FIGHTER', {
        fontSize: '48px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        stroke: '#333333',
        strokeThickness: 2
      }).setOrigin(0.5);
    
    // サブタイトル
    this.subtitleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 
      '〜蒸気機関都市の路地裏〜', {
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#cccccc'
      }).setOrigin(0.5);
    
    // ロード進捗バー
    this.progressBar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 400, 20, 0x333333);
    this.progressFill = this.add.rectangle(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2 + 50, 0, 16, 0x66aaff)
      .setOrigin(0, 0.5);
    
    // ロード状況テキスト
    this.loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 
      'Loading...', {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff'
      }).setOrigin(0.5);
  }

  /**
   * MVP用の必須アセット読み込み
   * 矩形描画用の基本的な要素のみ
   */
  loadEssentialAssets() {
    // 1px白画像（矩形やヒットボックス描画用）
    this.load.image('white-pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // MVP用の仮サウンド（無音）
    this.load.audio('hit-sound', ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=']);
    this.load.audio('bgm', ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=']);
  }

  /**
   * 将来拡張用のゲームアセット読み込み
   * スプライト・サウンド・背景等（現在は空実装）
   */
  loadGameAssets() {
    // TODO: 将来のスプライト実装時にここを拡張
    // this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 48, frameHeight: 64 });
    // this.load.spritesheet('enemy', 'assets/sprites/enemy.png', { frameWidth: 32, frameHeight: 48 });
    // this.load.spritesheet('boss', 'assets/sprites/boss.png', { frameWidth: 96, frameHeight: 128 });
    // this.load.image('bg-alley', 'assets/backgrounds/alley.png');
    // this.load.audio('punch-sound', ['assets/audio/punch.wav']);
    // this.load.audio('steam-sound', ['assets/audio/steam.wav']);
    // this.load.audio('bgm-stage1', ['assets/audio/bgm-stage1.ogg']);
  }

  /**
   * ロード進捗の監視と表示更新
   */
  setupLoadingProgress() {
    this.load.on('progress', (value) => {
      // 進捗バーの更新
      this.progressFill.width = 400 * value;
      
      // パーセント表示
      const percent = Math.floor(value * 100);
      this.loadingText.setText(`Loading... ${percent}%`);
    });

    this.load.on('fileprogress', (file) => {
      // ファイル単位の進捗（デバッグ用）
      console.log(`Loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Complete!');
      console.log('All assets loaded successfully');
    });

    this.load.on('loaderror', (file) => {
      console.error(`Failed to load: ${file.key}`);
      this.loadingText.setText('Loading error occurred');
    });
  }

  /**
   * ゲームデータの初期化
   * 将来的にはセーブデータの読み込みやグローバル設定の初期化を行う
   */
  initializeGameData() {
    // 将来拡張用のプレースホルダー
    // TODO: セーブデータ読み込み
    // TODO: 設定データ読み込み
    // TODO: ハイスコア読み込み
    
    console.log('Game data initialized');
  }
}