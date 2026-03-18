export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ロード画面の背景
    this.cameras.main.setBackgroundColor('#1a1a1a');
    
    // ロード進行表示用のバー作成
    this.createLoadingBar();
    
    // 基本テクスチャの生成（矩形ボックス開発用）
    this.createBasicTextures();
    
    // 将来のアセット読み込み用の設定
    this.setupAssetLoading();
  }

  createLoadingBar() {
    const width = 400;
    const height = 20;
    const x = (this.game.config.width - width) / 2;
    const y = this.game.config.height / 2;

    // ロードバーの背景
    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x333333);
    bgBar.fillRect(x, y, width, height);

    // ロードバーの前景
    const loadBar = this.add.graphics();
    
    // ロード進行のテキスト
    const loadText = this.add.text(
      this.game.config.width / 2, 
      y - 40, 
      'Loading...', 
      {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    // ロード進行イベントの監視
    this.load.on('progress', (value) => {
      loadBar.clear();
      loadBar.fillStyle(0x00ff00);
      loadBar.fillRect(x, y, width * value, height);
      
      loadText.setText(`Loading... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadText.setText('Complete!');
      // 0.5秒後にGameSceneに移行
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene');
        this.scene.start('UIScene');
      });
    });
  }

  createBasicTextures() {
    // 白い1x1ピクセルテクスチャ（当たり判定ボックス用）
    this.add.graphics()
      .fillStyle(0xffffff)
      .fillRect(0, 0, 1, 1)
      .generateTexture('__WHITE', 1, 1);

    // プレイヤー用の青い矩形テクスチャ
    this.add.graphics()
      .fillStyle(0x3399ff)
      .fillRect(0, 0, 48, 64)
      .generateTexture('player_box', 48, 64);

    // 雑魚敵用の赤い矩形テクスチャ
    this.add.graphics()
      .fillStyle(0xff3333)
      .fillRect(0, 0, 40, 56)
      .generateTexture('enemy_box', 40, 56);

    // ボス用の大きな赤い矩形テクスチャ
    this.add.graphics()
      .fillStyle(0xcc0000)
      .fillRect(0, 0, 80, 96)
      .generateTexture('boss_box', 80, 96);

    // 武器用の緑い矩形テクスチャ
    this.add.graphics()
      .fillStyle(0x33ff33)
      .fillRect(0, 0, 32, 16)
      .generateTexture('weapon_box', 32, 16);

    // 背景用のグラデーションテクスチャ
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x2c1810, 0x2c1810, 0x4a2c1a, 0x4a2c1a, 1);
    bgGraphics.fillRect(0, 0, this.game.config.width, this.game.config.height);
    bgGraphics.generateTexture('bg_gradient', this.game.config.width, this.game.config.height);
  }

  setupAssetLoading() {
    // 将来のスプライト画像読み込み用の準備
    // 現在はコメントアウトしているが、アセットが用意でき次第有効化する
    
    /*
    // プレイヤースプライト
    this.load.spritesheet('player', 'assets/sprites/player.png', {
      frameWidth: 48,
      frameHeight: 64
    });
    
    // 敵スプライト
    this.load.spritesheet('enemy', 'assets/sprites/enemy.png', {
      frameWidth: 40,
      frameHeight: 56
    });
    
    // ボススプライト
    this.load.spritesheet('boss', 'assets/sprites/boss.png', {
      frameWidth: 80,
      frameHeight: 96
    });
    
    // 武器スプライト
    this.load.image('steam_pipe', 'assets/sprites/steam_pipe.png');
    this.load.image('gear_star', 'assets/sprites/gear_star.png');
    this.load.image('spark_lantern', 'assets/sprites/spark_lantern.png');
    
    // 背景画像
    this.load.image('bg_alley', 'assets/backgrounds/alley.png');
    
    // 音声ファイル
    this.load.audio('bgm_stage1', 'assets/audio/stage1.mp3');
    this.load.audio('se_punch', 'assets/audio/punch.wav');
    this.load.audio('se_special', 'assets/audio/special.wav');
    */
  }

  create() {
    // アセット読み込み完了後の処理
    // 現在は即座にGameSceneとUISceneを起動
    if (this.load.totalComplete === this.load.totalFailed + this.load.totalComplete) {
      // すべてのアセットが読み込まれた場合（現在は基本テクスチャのみ）
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    }
  }

  // 将来のアセット管理用メソッド
  getAssetProgress() {
    return {
      loaded: this.load.totalComplete,
      total: this.load.totalToLoad,
      failed: this.load.totalFailed,
      progress: this.load.progress
    };
  }

  // エラーハンドリング
  handleLoadError(file) {
    console.error(`Failed to load asset: ${file.key}`);
    // 開発環境では詳細なエラー情報を表示
    if (process.env.NODE_ENV === 'development') {
      console.error('Asset load error details:', file);
    }
  }
}