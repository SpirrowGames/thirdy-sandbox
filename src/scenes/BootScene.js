export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ロード進行状況の表示
    this.createLoadingUI();
    
    // アセットロードの進行状況を監視
    this.load.on('progress', this.updateProgressBar, this);
    this.load.on('complete', this.onLoadComplete, this);
    
    // 基本アセットのロード
    this.loadBasicAssets();
    
    // 将来的な拡張用のロードメソッド
    this.loadSprites();
    this.loadAudio();
  }

  createLoadingUI() {
    const { width, height } = this.scale;
    
    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    
    // タイトル
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'LOADING...', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // プログレスバー背景
    this.progressBg = this.add.rectangle(width / 2, height / 2 + 50, 400, 20, 0x333333);
    
    // プログレスバー
    this.progressBar = this.add.rectangle(width / 2, height / 2 + 50, 0, 16, 0x00ff00);
    
    // パーセンテージテキスト
    this.percentText = this.add.text(width / 2, height / 2 + 100, '0%', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  updateProgressBar(value) {
    // プログレスバーの幅を更新
    this.progressBar.width = 400 * value;
    
    // パーセンテージを更新
    const percent = Math.round(value * 100);
    this.percentText.setText(`${percent}%`);
  }

  loadBasicAssets() {
    // 開発初期用の基本図形テクスチャを生成
    this.load.image('__WHITE', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // 矩形ボックス用のカラーテクスチャを生成
    this.createColorTextures();
  }

  createColorTextures() {
    const colors = {
      'player_box': 0x3399ff,    // プレイヤー用青
      'enemy_box': 0xff3333,     // 敵用赤
      'boss_box': 0x990000,      // ボス用暗赤
      'weapon_box': 0x33ff33,    // 武器用緑
      'hitbox': 0xffff00         // 攻撃判定用黄（デバッグ）
    };

    Object.entries(colors).forEach(([key, color]) => {
      this.createColorTexture(key, color);
    });
  }

  createColorTexture(key, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 64, 64);
    
    this.textures.addCanvas(key, canvas);
  }

  loadSprites() {
    // 将来的なスプライトロード用
    // 現在は空実装（矩形ボックス開発フェーズのため）
    
    // 例：this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 64, frameHeight: 64 });
    // 例：this.load.spritesheet('enemy', 'assets/sprites/enemy.png', { frameWidth: 48, frameHeight: 48 });
    // 例：this.load.spritesheet('boss', 'assets/sprites/boss.png', { frameWidth: 96, frameHeight: 96 });
  }

  loadAudio() {
    // 将来的なオーディオロード用
    // 現在は空実装
    
    // 例：this.load.audio('bgm_stage1', 'assets/audio/stage1.mp3');
    // 例：this.load.audio('sfx_punch', 'assets/audio/punch.wav');
    // 例：this.load.audio('sfx_special', 'assets/audio/special.wav');
  }

  onLoadComplete() {
    // ロード完了演出
    this.loadingText.setText('COMPLETE!');
    
    // 少し待ってからGameSceneに移行
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
    });
  }

  create() {
    // preload完了後に呼ばれるが、今回は特に処理なし
    // onLoadCompleteでシーン遷移を行う
  }
}