import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y_MIN, GROUND_Y_MAX } from '../config/constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // ゲーム状態
    this.player = null;
    this.enemies = null;
    this.weapons = null;
    this.scrollLocked = false;
    this.stageWidth = 3000; // ステージ全幅
  }

  create() {
    this.setupPhysics();
    this.setupCamera();
    this.setupGroups();
    this.setupBackground();
    this.setupInput();
    
    // デバッグ用の仮プレイヤー作成（後で Player.js に移行）
    this.createTempPlayer();
    
    console.log('GameScene created successfully');
  }

  setupPhysics() {
    // 物理エンジンの設定
    this.physics.world.setBounds(0, 0, this.stageWidth, GAME_HEIGHT);
    
    // 重力は使用しない（2Dベルトスクロール）
    this.physics.world.gravity.y = 0;
    
    // デバッグ表示（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      this.physics.world.createDebugGraphic();
    }
  }

  setupCamera() {
    const camera = this.cameras.main;
    
    // カメラの境界設定（ステージ全幅）
    camera.setBounds(0, 0, this.stageWidth, GAME_HEIGHT);
    
    // Y軸スクロールは無効化（横スクロールのみ）
    camera.setLerp(0.1, 0); // X軸のみスムーズ追従
    
    // 初期位置設定
    camera.setScroll(0, 0);
    
    console.log(`Camera bounds set: ${this.stageWidth}x${GAME_HEIGHT}`);
  }

  setupGroups() {
    // エンティティグループの作成（物理オブジェクト管理）
    this.enemies = this.physics.add.group({
      runChildUpdate: true // 子オブジェクトのupdateを自動実行
    });
    
    this.weapons = this.physics.add.group({
      runChildUpdate: true
    });
    
    // 攻撃判定用の一時グループ
    this.playerAttacks = this.physics.add.group();
    this.enemyAttacks = this.physics.add.group();
  }

  setupBackground() {
    // 仮の背景色設定（後でスプライト背景に差し替え）
    this.cameras.main.setBackgroundColor('#2c3e50');
    
    // 地面の視覚的表示（デバッグ用）
    const groundGraphics = this.add.graphics();
    groundGraphics.fillStyle(0x34495e);
    groundGraphics.fillRect(0, GROUND_Y_MIN, this.stageWidth, GROUND_Y_MAX - GROUND_Y_MIN);
    
    // 奥行き境界線の表示（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      const debugGraphics = this.add.graphics();
      debugGraphics.lineStyle(2, 0xff0000, 0.5);
      debugGraphics.lineBetween(0, GROUND_Y_MIN, this.stageWidth, GROUND_Y_MIN);
      debugGraphics.lineBetween(0, GROUND_Y_MAX, this.stageWidth, GROUND_Y_MAX);
    }
  }

  setupInput() {
    // キーボード入力の設定
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // 追加キー設定（Z, X）
    this.keys = this.input.keyboard.addKeys({
      'attack': Phaser.Input.Keyboard.KeyCodes.Z,
      'dash': Phaser.Input.Keyboard.KeyCodes.X,
      'up': Phaser.Input.Keyboard.KeyCodes.UP,
      'down': Phaser.Input.Keyboard.KeyCodes.DOWN,
      'left': Phaser.Input.Keyboard.KeyCodes.LEFT,
      'right': Phaser.Input.Keyboard.KeyCodes.RIGHT
    });
    
    console.log('Input system initialized');
  }

  createTempPlayer() {
    // 仮のプレイヤー作成（矩形ボックス）
    const playerX = 100;
    const playerY = (GROUND_Y_MIN + GROUND_Y_MAX) / 2;
    
    this.player = this.physics.add.rectangle(playerX, playerY, 48, 64, 0x3498db);
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(200, 200);
    
    // カメラをプレイヤーに追従させる
    this.cameras.main.startFollow(this.player, true, 0.1, 0);
    
    console.log(`Temp player created at (${playerX}, ${playerY})`);
  }

  update(time, delta) {
    this.updatePlayer(time, delta);
    this.updateEnemies(time, delta);
    this.updateWeapons(time, delta);
    this.checkScrollLock();
  }

  updatePlayer(time, delta) {
    if (!this.player) return;
    
    // 仮の移動処理（後でPlayer.jsに移行）
    const speed = 200;
    let velocityX = 0;
    let velocityY = 0;
    
    if (this.keys.left.isDown) {
      velocityX = -speed;
    } else if (this.keys.right.isDown) {
      velocityX = speed;
    }
    
    if (this.keys.up.isDown) {
      velocityY = -speed;
    } else if (this.keys.down.isDown) {
      velocityY = speed;
    }
    
    this.player.setVelocity(velocityX, velocityY);
    
    // Y座標の制限（奥行き範囲内に制限）
    if (this.player.y < GROUND_Y_MIN) {
      this.player.y = GROUND_Y_MIN;
      this.player.setVelocityY(0);
    } else if (this.player.y > GROUND_Y_MAX) {
      this.player.y = GROUND_Y_MAX;
      this.player.setVelocityY(0);
    }
  }

  updateEnemies(time, delta) {
    // 敵の更新処理（SpawnSystemから管理される）
    // 現時点では空実装
  }

  updateWeapons(time, delta) {
    // 武器の更新処理
    // 現時点では空実装
  }

  checkScrollLock() {
    // スクロールロック状態の確認
    // SpawnSystemから制御される
  }

  // スクロール制御メソッド
  lockScroll() {
    if (this.scrollLocked) return;
    
    this.scrollLocked = true;
    this.cameras.main.stopFollow();
    
    console.log('Scroll locked');
    
    // UISceneに通知
    this.events.emit('scrollLocked');
  }

  unlockScroll() {
    if (!this.scrollLocked) return;
    
    this.scrollLocked = false;
    
    if (this.player) {
      this.cameras.main.startFollow(this.player, true, 0.1, 0);
    }
    
    console.log('Scroll unlocked');
    
    // UISceneに通知
    this.events.emit('scrollUnlocked');
  }

  // 敵スポーン用メソッド（SpawnSystemから呼び出される）
  spawnEnemy(type, x, y) {
    // 仮の敵作成（後でEnemy.jsに移行）
    const enemy = this.physics.add.rectangle(x, y, 40, 60, 0xe74c3c);
    enemy.enemyType = type;
    enemy.setCollideWorldBounds(true);
    
    this.enemies.add(enemy);
    
    console.log(`Enemy spawned: ${type} at (${x}, ${y})`);
    return enemy;
  }

  // ウェーブクリア処理
  onWaveClear() {
    console.log('Wave cleared');
    this.unlockScroll();
    
    // UISceneに通知
    this.events.emit('waveClear');
  }

  // ステージクリア処理
  onStageClear() {
    console.log('Stage cleared');
    
    // UISceneに通知
    this.events.emit('stageClear');
  }

  // 攻撃ヒット処理
  handleHit(attacker, target) {
    console.log('Hit detected:', attacker, target);
    
    // ヒットストップ効果
    this.hitStop(80);
    
    // UISceneにダメージ通知
    this.events.emit('damageDealt', { 
      attacker: attacker, 
      target: target, 
      damage: 10 
    });
  }

  // ヒットストップ効果
  hitStop(duration = 80) {
    this.physics.world.pause();
    this.time.delayedCall(duration, () => {
      this.physics.world.resume();
    });
  }

  // シーン終了処理
  shutdown() {
    // イベントリスナーのクリーンアップ
    this.events.removeAllListeners();
    console.log('GameScene shutdown');
  }
}