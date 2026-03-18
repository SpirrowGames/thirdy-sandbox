/**
 * BootScene - アセット読み込みとゲーム初期化
 * 
 * 責務：
 * - 必要なアセットの読み込み
 * - ゲーム定数の初期化
 * - GameSceneへの遷移
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
    this.loadingProgress = 0;
  }

  preload() {
    this.createLoadingScreen();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  /**
   * ローディング画面の作成
   */
  createLoadingScreen() {
    const { width, height } = this.cameras.main;
    
    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);
    
    // タイトル
    this.add.text(width / 2, height / 2 - 100, 'STEAM FIGHTER', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff6600',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // サブタイトル
    this.add.text(width / 2, height / 2 - 50, '～蒸気機関街の戦い～', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc'
    }).setOrigin(0.5);
    
    // ローディングバー背景
    this.loadingBarBg = this.add.rectangle(
      width / 2, height / 2 + 50, 400, 20, 0x333333
    );
    
    // ローディングバー
    this.loadingBar = this.add.rectangle(
      width / 2 - 200, height / 2 + 50, 0, 16, 0xff6600
    ).setOrigin(0, 0.5);
    
    // ローディングテキスト
    this.loadingText = this.add.text(width / 2, height / 2 + 100, 'Loading... 0%', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  /**
   * ローディングイベントの設定
   */
  setupLoadingEvents() {
    this.load.on('progress', (progress) => {
      this.loadingProgress = progress;
      this.updateLoadingDisplay();
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Complete!');
      // 少し待ってからゲームシーンに遷移
      this.time.delayedCall(500, () => {
        this.startGame();
      });
    });

    this.load.on('loaderror', (file) => {
      console.error('Failed to load file:', file.src);
      this.loadingText.setText('Loading Error!');
      this.loadingText.setColor('#ff0000');
    });
  }

  /**
   * ローディング表示の更新
   */
  updateLoadingDisplay() {
    const percentage = Math.floor(this.loadingProgress * 100);
    this.loadingBar.width = 400 * this.loadingProgress;
    this.loadingText.setText(`Loading... ${percentage}%`);
  }

  /**
   * アセットの読み込み
   */
  loadAssets() {
    // 開発初期：矩形用の1x1白画像を生成
    this.load.image('__WHITE', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // 将来のスプライト読み込み用（現在はコメントアウト）
    /*
    this.load.spritesheet('player', 'assets/sprites/player.png', {
      frameWidth: 48,
      frameHeight: 64
    });
    
    this.load.spritesheet('enemy', 'assets/sprites/enemy.png', {
      frameWidth: 48,
      frameHeight: 64
    });
    
    this.load.spritesheet('boss', 'assets/sprites/boss.png', {
      frameWidth: 96,
      frameHeight: 96
    });
    
    this.load.image('bg_alley', 'assets/backgrounds/alley.png');
    
    // 武器スプライト
    this.load.image('weapon_pipe', 'assets/weapons/steam_pipe.png');
    this.load.image('weapon_gear', 'assets/weapons/gear_star.png');
    this.load.image('weapon_lantern', 'assets/weapons/spark_lantern.png');
    
    // エフェクト
    this.load.spritesheet('steam_effect', 'assets/effects/steam.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // オーディオ
    this.load.audio('bgm_stage1', 'assets/audio/bgm_stage1.ogg');
    this.load.audio('se_punch', 'assets/audio/se_punch.wav');
    this.load.audio('se_steam', 'assets/audio/se_steam.wav');
    */

    // 開発用の遅延（ローディング画面テスト用）
    if (process.env.NODE_ENV === 'development') {
      // 開発時は意図的に読み込みを遅延
      for (let i = 0; i < 10; i++) {
        this.load.image(`dummy_${i}`, '__WHITE');
      }
    }
  }

  /**
   * ゲーム開始
   */
  startGame() {
    // GameSceneとUISceneを同時起動
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  /**
   * アセット読み込み完了後の初期化処理
   */
  create() {
    // アニメーションの定義（将来のスプライト用）
    this.createAnimations();
    
    // グローバル定数の設定
    this.setupGameConstants();
    
    // 開発モード用のデバッグ情報
    if (process.env.NODE_ENV === 'development') {
      console.log('BootScene: Assets loaded successfully');
      console.log('Game constants initialized');
    }
  }

  /**
   * アニメーションの作成（将来のスプライト用）
   */
  createAnimations() {
    // 現在は空実装、将来のスプライト実装時に使用
    /*
    // プレイヤーアニメーション
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: 'player_attack1',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: 20,
      repeat: 0
    });

    // 敵アニメーション
    this.anims.create({
      key: 'enemy_idle',
      frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    // エフェクトアニメーション
    this.anims.create({
      key: 'steam_blast',
      frames: this.anims.generateFrameNumbers('steam_effect', { start: 0, end: 7 }),
      frameRate: 15,
      repeat: 0
    });
    */
  }

  /**
   * ゲーム定数の設定
   */
  setupGameConstants() {
    // グローバル定数をPhaser.Gameオブジェクトに設定
    if (!window.GAME_CONSTANTS) {
      window.GAME_CONSTANTS = {
        GAME_WIDTH: 960,
        GAME_HEIGHT: 540,
        GROUND_Y_MIN: 360,
        GROUND_Y_MAX: 480,
        DEPTH_THRESHOLD: 40,
        COMMAND_WINDOW: 400,
        COMBO_RESET: 1500,
        
        // 開発フェーズ設定
        DEV_PHASE: 'BOXES', // 'BOXES' | 'SPRITES'
        DEBUG_MODE: process.env.NODE_ENV === 'development'
      };
    }
  }

  /**
   * エラーハンドリング
   */
  handleLoadError(error) {
    console.error('BootScene: Asset loading failed', error);
    
    // エラー画面表示
    const { width, height } = this.cameras.main;
    this.add.text(width / 2, height / 2, 'Loading Failed\nPlease refresh the page', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff0000',
      align: 'center'
    }).setOrigin(0.5);
  }
}