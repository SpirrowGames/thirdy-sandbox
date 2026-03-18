import { SpawnSystem } from '../systems/SpawnSystem.js';
import { Player } from '../entities/Player.js';
import { STAGE1 } from '../data/stage1.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // ゲーム定数
    this.GAME_WIDTH = 960;
    this.GAME_HEIGHT = 540;
    this.STAGE_WIDTH = 3000;
    this.GROUND_Y_MIN = 360;
    this.GROUND_Y_MAX = 480;
    this.DEPTH_THRESHOLD = 40;
    
    // ゲーム状態
    this.scrollLocked = false;
    this.stageClear = false;
    this.gameStarted = false;
    
    // エンティティ参照
    this.player = null;
    this.enemies = null;
    this.weapons = null;
    this.projectiles = null;
    
    // システム
    this.spawnSystem = null;
  }

  create() {
    try {
      console.log('GameScene: 初期化開始');
      
      // 物理エンジンの設定
      this.setupPhysics();
      
      // カメラの設定
      this.setupCamera();
      
      // エンティティグループの初期化
      this.setupEntityGroups();
      
      // プレイヤーの生成
      this.createPlayer();
      
      // スポーンシステムの初期化
      this.setupSpawnSystem();
      
      // 背景の設定（仮）
      this.setupBackground();
      
      // 入力の設定
      this.setupInput();
      
      // UISceneへの初期状態通知
      this.notifyUIScene();
      
      this.gameStarted = true;
      console.log('GameScene: 初期化完了');
      
    } catch (error) {
      console.error('GameScene初期化エラー:', error);
      this.scene.start('ErrorScene');
    }
  }

  setupPhysics() {
    // 重力は0に設定（2Dベルトスクロールのため）
    this.physics.world.gravity.y = 0;
    
    // デバッグ表示（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      this.physics.world.debugGraphic = this.add.graphics();
    }
  }

  setupCamera() {
    // ステージ全体の境界を設定
    this.cameras.main.setBounds(0, 0, this.STAGE_WIDTH, this.GAME_HEIGHT);
    
    // カメラの初期位置
    this.cameras.main.setScroll(0, 0);
    
    // スムーズスクロール設定（後でプレイヤー追従時に使用）
    this.cameras.main.lerp = 0.1;
    
    console.log(`カメラ境界設定: ${this.STAGE_WIDTH}x${this.GAME_HEIGHT}`);
  }

  setupEntityGroups() {
    // 敵グループ（物理オブジェクト、自動更新有効）
    this.enemies = this.physics.add.group({
      runChildUpdate: true,
      maxSize: 20
    });
    
    // 武器グループ
    this.weapons = this.physics.add.group({
      runChildUpdate: false,
      maxSize: 10
    });
    
    // 弾丸・エフェクトグループ
    this.projectiles = this.physics.add.group({
      runChildUpdate: true,
      maxSize: 50
    });
    
    console.log('エンティティグループ初期化完了');
  }

  createPlayer() {
    // プレイヤーの初期位置
    const startX = 100;
    const startY = 440;
    
    this.player = new Player(this, startX, startY);
    
    // カメラをプレイヤーに追従させる（X軸のみ）
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    
    console.log(`プレイヤー生成: (${startX}, ${startY})`);
  }

  setupSpawnSystem() {
    this.spawnSystem = new SpawnSystem(this, STAGE1.spawnEvents, {
      onWaveStart: () => this.lockScroll(),
      onWaveClear: () => this.unlockScroll(),
      onStageClear: () => this.onStageClear(),
      onSpawn: (type, x, y) => this.spawnEnemy(type, x, y)
    });
    
    console.log('スポーンシステム初期化完了');
  }

  setupBackground() {
    // 仮の背景（開発初期用の矩形）
    const bg = this.add.rectangle(
      this.STAGE_WIDTH / 2, 
      this.GAME_HEIGHT / 2, 
      this.STAGE_WIDTH, 
      this.GAME_HEIGHT, 
      0x2c3e50
    );
    bg.setDepth(-100); // 最背面
    
    // 地面の表示（視覚的なガイド）
    const ground = this.add.rectangle(
      this.STAGE_WIDTH / 2,
      (this.GROUND_Y_MIN + this.GROUND_Y_MAX) / 2,
      this.STAGE_WIDTH,
      this.GROUND_Y_MAX - this.GROUND_Y_MIN,
      0x34495e,
      0.3
    );
    ground.setDepth(-50);
    
    console.log('背景設定完了');
  }

  setupInput() {
    // キーボード入力の設定
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('Z,X,SPACE');
    
    console.log('入力設定完了');
  }

  notifyUIScene() {
    // UISceneに初期状態を通知
    this.events.emit('playerHpChange', { 
      current: this.player.hp, 
      max: this.player.maxHp 
    });
    this.events.emit('scoreUpdate', { score: 0 });
    this.events.emit('comboUpdate', { count: 0 });
  }

  update(time, delta) {
    if (!this.gameStarted || this.stageClear) {
      return;
    }

    try {
      // プレイヤーの更新
      if (this.player && this.player.alive) {
        this.player.update(time, delta);
      }

      // スポーンシステムの更新
      if (this.spawnSystem) {
        this.spawnSystem.update(this.cameras.main.scrollX);
      }

      // 衝突判定の処理
      this.handleCollisions();

      // デバッグ情報の更新（開発時のみ）
      if (process.env.NODE_ENV === 'development') {
        this.updateDebugInfo();
      }

    } catch (error) {
      console.error('GameScene更新エラー:', error);
    }
  }

  handleCollisions() {
    // プレイヤーと武器の衝突（拾う処理）
    this.physics.add.overlap(
      this.player.sprite,
      this.weapons,
      this.handleWeaponPickup,
      null,
      this
    );

    // プレイヤーと敵の攻撃判定は各エンティティ側で管理
    // ここでは基本的な重複チェックのみ行う
  }

  handleWeaponPickup(playerSprite, weaponSprite) {
    // 奥行き判定
    if (Math.abs(this.player.groundY - weaponSprite.groundY) < this.DEPTH_THRESHOLD) {
      this.player.pickupWeapon(weaponSprite.weaponData);
      weaponSprite.destroy();
      
      // UIに通知
      this.events.emit('weaponChange', {
        name: weaponSprite.weaponData.name,
        durability: weaponSprite.weaponData.durability,
        max: weaponSprite.weaponData.maxDurability
      });
    }
  }

  spawnEnemy(type, x, y) {
    // 敵生成の実装は後のタスクで行う
    console.log(`敵生成予定: ${type} at (${x}, ${y})`);
    
    // 仮の実装（矩形で敵を表現）
    const enemy = this.add.rectangle(x, y, 40, 60, 0xff6b6b);
    enemy.groundY = y;
    this.physics.add.existing(enemy);
    this.enemies.add(enemy);
    
    return enemy;
  }

  lockScroll() {
    this.scrollLocked = true;
    this.cameras.main.stopFollow();
    console.log('スクロールロック');
  }

  unlockScroll() {
    this.scrollLocked = false;
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    console.log('スクロールアンロック');
  }

  onWaveClear() {
    console.log('ウェーブクリア');
    this.unlockScroll();
  }

  onStageClear() {
    this.stageClear = true;
    console.log('ステージクリア');
    
    // クリア演出とスコア表示
    this.showClearScreen();
  }

  showClearScreen() {
    // クリア画面表示の実装は後のタスクで行う
    console.log('クリア画面表示予定');
  }

  updateDebugInfo() {
    // デバッグ情報の表示更新
    if (!this.debugText) {
      this.debugText = this.add.text(10, 10, '', {
        fontSize: '14px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      });
      this.debugText.setScrollFactor(0); // カメラに固定
      this.debugText.setDepth(1000);
    }

    const debugInfo = [
      `Player: (${Math.floor(this.player.x)}, ${Math.floor(this.player.groundY)})`,
      `Camera: ${Math.floor(this.cameras.main.scrollX)}`,
      `Enemies: ${this.enemies.children.size}`,
      `ScrollLocked: ${this.scrollLocked}`,
      `FPS: ${Math.floor(this.game.loop.actualFps)}`
    ];

    this.debugText.setText(debugInfo.join('\n'));
  }

  // ヘルパーメソッド
  isInBounds(x, y) {
    return x >= 0 && x <= this.STAGE_WIDTH && 
           y >= this.GROUND_Y_MIN && y <= this.GROUND_Y_MAX;
  }

  getRandomGroundY() {
    return Phaser.Math.Between(this.GROUND_Y_MIN, this.GROUND_Y_MAX);
  }

  // クリーンアップ
  shutdown() {
    console.log('GameScene: シャットダウン');
    
    // イベントリスナーの削除
    this.events.off('playerHpChange');
    this.events.off('scoreUpdate');
    this.events.off('comboUpdate');
    
    // システムのクリーンアップ
    if (this.spawnSystem) {
      this.spawnSystem.destroy();
    }
    
    super.shutdown();
  }
}