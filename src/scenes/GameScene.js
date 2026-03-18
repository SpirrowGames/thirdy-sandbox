import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y_MIN, GROUND_Y_MAX } from '../config/constants.js';

/**
 * メインゲームシーンクラス
 * ゲーム全体の進行管理、エンティティ生成・更新、物理演算を担当
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // ゲーム状態管理
    this.gameState = {
      scrollLocked: false,
      stageClear: false,
      paused: false
    };
    
    // エンティティグループ
    this.player = null;
    this.enemies = null;
    this.weapons = null;
    this.projectiles = null;
    
    // システム参照
    this.spawnSystem = null;
    
    // カメラ制御用
    this.cameraTarget = null;
  }

  /**
   * シーン初期化
   * 物理エンジン、カメラ、エンティティグループの設定を行う
   */
  create() {
    console.log('GameScene: create() 開始');
    
    try {
      // 物理エンジンの設定
      this.setupPhysics();
      
      // カメラの設定
      this.setupCamera();
      
      // エンティティグループの初期化
      this.createEntityGroups();
      
      // 背景の設定（仮実装）
      this.createBackground();
      
      // プレイヤーの仮生成（後続タスクで詳細実装予定）
      this.createTemporaryPlayer();
      
      // デバッグ用UI
      this.createDebugUI();
      
      console.log('GameScene: create() 完了');
      
      // UISceneに初期化完了を通知
      this.events.emit('sceneReady');
      
    } catch (error) {
      console.error('GameScene create() でエラーが発生:', error);
      throw error;
    }
  }

  /**
   * 物理エンジンの詳細設定
   */
  setupPhysics() {
    // 重力は使用しない（2.5D横スクロールのため）
    this.physics.world.gravity.y = 0;
    
    // デバッグ表示の設定（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      this.physics.world.createDebugGraphic();
      this.physics.world.debugGraphic.setAlpha(0.7);
    }
    
    // 世界境界の設定（ステージ全幅3000px）
    this.physics.world.setBounds(0, 0, 3000, GAME_HEIGHT);
    
    console.log('物理エンジン設定完了');
  }

  /**
   * カメラの設定
   * 横スクロール対応、Y軸固定、プレイヤー追従
   */
  setupCamera() {
    const camera = this.cameras.main;
    
    // カメラ境界の設定（ステージ全幅3000px）
    camera.setBounds(0, 0, 3000, GAME_HEIGHT);
    
    // Y軸スクロールを無効化（横スクロールのみ）
    camera.setLerp(0.1, 0); // X軸のみスムーズ追従、Y軸は固定
    
    // カメラのデッドゾーン設定
    camera.setDeadzone(100, 0); // X方向のみデッドゾーン設定
    
    console.log('カメラ設定完了: bounds(0, 0, 3000, ' + GAME_HEIGHT + ')');
  }

  /**
   * エンティティグループの作成
   */
  createEntityGroups() {
    // 敵グループ（物理有効、自動更新）
    this.enemies = this.physics.add.group({
      runChildUpdate: true, // 各敵のupdate()を自動実行
      maxSize: 20 // 最大同時出現数
    });
    
    // 武器グループ（拾えるアイテム）
    this.weapons = this.physics.add.group({
      runChildUpdate: false // 武器は静的オブジェクト
    });
    
    // 投射物グループ（手裏剣、弾丸など）
    this.projectiles = this.physics.add.group({
      runChildUpdate: true,
      maxSize: 50
    });
    
    console.log('エンティティグループ作成完了');
  }

  /**
   * 背景の作成（仮実装）
   */
  createBackground() {
    // スチームパンク路地裏の背景（仮）
    const bg = this.add.rectangle(1500, GAME_HEIGHT / 2, 3000, GAME_HEIGHT, 0x2c3e50);
    bg.setOrigin(0.5, 0.5);
    bg.setDepth(-100); // 最背面
    
    // 地面ライン表示（奥行き範囲の可視化）
    const groundTop = this.add.line(1500, GROUND_Y_MIN, 0, 0, 3000, 0, 0x34495e);
    const groundBottom = this.add.line(1500, GROUND_Y_MAX, 0, 0, 3000, 0, 0x34495e);
    groundTop.setDepth(-90);
    groundBottom.setDepth(-90);
    
    console.log('背景作成完了');
  }

  /**
   * 仮プレイヤーの作成（テスト用）
   */
  createTemporaryPlayer() {
    // 青い矩形でプレイヤーを表現
    const playerSprite = this.add.rectangle(200, 440, 48, 64, 0x3498db);
    this.physics.add.existing(playerSprite);
    
    // プレイヤーオブジェクトの仮実装
    this.player = {
      sprite: playerSprite,
      body: playerSprite.body,
      x: 200,
      y: 440,
      groundY: 440,
      alive: true
    };
    
    // 物理プロパティ設定
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(48, 64);
    
    // カメラ追従設定
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    
    console.log('仮プレイヤー作成完了');
  }

  /**
   * デバッグ用UI作成
   */
  createDebugUI() {
    if (process.env.NODE_ENV !== 'development') return;
    
    // カメラ位置表示
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    });
    this.debugText.setScrollFactor(0); // UI固定
    this.debugText.setDepth(1000); // 最前面
  }

  /**
   * 毎フレーム更新処理
   * @param {number} time - 経過時間
   * @param {number} delta - 前フレームからの差分時間
   */
  update(time, delta) {
    try {
      // ゲームが一時停止中なら更新をスキップ
      if (this.gameState.paused) return;
      
      // プレイヤー更新（仮実装）
      this.updateTemporaryPlayer(delta);
      
      // スポーンシステム更新（後続タスクで実装予定）
      if (this.spawnSystem) {
        this.spawnSystem.update(this.cameras.main.scrollX);
      }
      
      // 衝突判定処理
      this.handleCollisions();
      
      // デバッグ情報更新
      this.updateDebugInfo();
      
      // UISceneにゲーム状態を通知
      this.updateUIEvents();
      
    } catch (error) {
      console.error('GameScene update() でエラーが発生:', error);
    }
  }

  /**
   * 仮プレイヤーの更新（基本的な移動のみ）
   */
  updateTemporaryPlayer(delta) {
    if (!this.player || !this.player.alive) return;
    
    // 基本的な移動処理（後続タスクで詳細実装予定）
    const cursors = this.input.keyboard.createCursorKeys();
    const speed = 200;
    
    // X方向移動
    if (cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
    } else {
      this.player.body.setVelocityX(0);
    }
    
    // Y方向移動（奥行き）
    if (cursors.up.isDown && this.player.sprite.y > GROUND_Y_MIN) {
      this.player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown && this.player.sprite.y < GROUND_Y_MAX) {
      this.player.body.setVelocityY(speed);
    } else {
      this.player.body.setVelocityY(0);
    }
    
    // 座標同期
    this.player.x = this.player.sprite.x;
    this.player.y = this.player.sprite.y;
    this.player.groundY = this.player.sprite.y; // 仮実装では同じ
  }

  /**
   * 衝突判定処理
   */
  handleCollisions() {
    // 現時点では基本構造のみ
    // 後続タスクで詳細な衝突判定を実装予定
  }

  /**
   * デバッグ情報の更新
   */
  updateDebugInfo() {
    if (!this.debugText || process.env.NODE_ENV !== 'development') return;
    
    const camera = this.cameras.main;
    const debugInfo = [
      `Camera X: ${Math.floor(camera.scrollX)}`,
      `Camera Y: ${Math.floor(camera.scrollY)}`,
      `Player X: ${Math.floor(this.player.x)}`,
      `Player Y: ${Math.floor(this.player.y)}`,
      `Scroll Locked: ${this.gameState.scrollLocked}`,
      `Enemies: ${this.enemies.children.size}`,
      `Weapons: ${this.weapons.children.size}`
    ];
    
    this.debugText.setText(debugInfo.join('\n'));
  }

  /**
   * UISceneへのイベント通知
   */
  updateUIEvents() {
    // プレイヤー情報の通知（後続タスクで詳細実装）
    this.events.emit('playerPositionUpdate', {
      x: this.player.x,
      y: this.player.y
    });
  }

  /**
   * スクロールロック（ウェーブ戦闘中）
   */
  lockScroll() {
    console.log('スクロールロック');
    this.gameState.scrollLocked = true;
    this.cameras.main.stopFollow();
  }

  /**
   * スクロールアンロック（ウェーブクリア後）
   */
  unlockScroll() {
    console.log('スクロールアンロック');
    this.gameState.scrollLocked = false;
    if (this.player && this.player.alive) {
      this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    }
  }

  /**
   * ウェーブクリア時の処理
   */
  onWaveClear() {
    console.log('ウェーブクリア');
    this.unlockScroll();
    
    // UIに通知
    this.events.emit('waveClear');
  }

  /**
   * ステージクリア時の処理
   */
  onStageClear() {
    console.log('ステージクリア');
    this.gameState.stageClear = true;
    
    // UIに通知
    this.events.emit('stageClear');
  }

  /**
   * ゲーム一時停止
   */
  pauseGame() {
    this.gameState.paused = true;
    this.physics.world.pause();
  }

  /**
   * ゲーム再開
   */
  resumeGame() {
    this.gameState.paused = false;
    this.physics.world.resume();
  }

  /**
   * シーン破棄時のクリーンアップ
   */
  shutdown() {
    console.log('GameScene: shutdown');
    
    // イベントリスナーのクリーンアップ
    this.events.removeAllListeners();
    
    // エンティティグループのクリーンアップ
    if (this.enemies) this.enemies.clear(true, true);
    if (this.weapons) this.weapons.clear(true, true);
    if (this.projectiles) this.projectiles.clear(true, true);
  }
}