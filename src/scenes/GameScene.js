export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // ゲーム状態
    this.player = null;
    this.enemies = null;
    this.weapons = null;
    this.spawnSystem = null;
    
    // スクロール制御
    this.scrollLocked = false;
    
    // ゲーム定数
    this.GAME_WIDTH = 960;
    this.GAME_HEIGHT = 540;
    this.STAGE_WIDTH = 3000;
    this.GROUND_Y_MIN = 360;
    this.GROUND_Y_MAX = 480;
    this.DEPTH_THRESHOLD = 40;
  }

  create() {
    try {
      this.initializePhysics();
      this.setupCamera();
      this.createGroups();
      this.setupBackground();
      this.initializeEntities();
      this.setupEventListeners();
      
      console.log('GameScene initialized successfully');
    } catch (error) {
      console.error('Error initializing GameScene:', error);
      throw error;
    }
  }

  initializePhysics() {
    // 物理ワールドの設定
    this.physics.world.setBounds(0, 0, this.STAGE_WIDTH, this.GAME_HEIGHT);
    this.physics.world.gravity.y = 0; // 横スクロールなので重力なし
    
    // デバッグモード（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      this.physics.world.drawDebug = false; // 必要時にtrueに変更
    }
  }

  setupCamera() {
    // カメラの境界設定（ステージ全幅をスクロール可能に）
    this.cameras.main.setBounds(0, 0, this.STAGE_WIDTH, this.GAME_HEIGHT);
    
    // カメラのデッドゾーン設定（プレイヤーが中央付近にいる時はスクロールしない）
    this.cameras.main.setDeadzone(100, 0);
    
    // スムーズスクロール設定
    this.cameras.main.setLerp(0.1, 0); // X軸のみスムーズに追従
  }

  createGroups() {
    // エンティティグループの作成（物理オブジェクト管理用）
    this.enemies = this.physics.add.group({
      runChildUpdate: true, // 子オブジェクトのupdate()を自動実行
      maxSize: 20 // 同時出現敵数の上限
    });

    this.weapons = this.physics.add.group({
      runChildUpdate: false // 武器は静的オブジェクト
    });

    // 攻撃判定用の一時グループ
    this.attackHitboxes = this.physics.add.group();
  }

  setupBackground() {
    // 背景の設定（現在は仮の色で実装）
    this.add.rectangle(
      this.STAGE_WIDTH / 2, 
      this.GAME_HEIGHT / 2, 
      this.STAGE_WIDTH, 
      this.GAME_HEIGHT, 
      0x2c1810 // 暗いブラウン（スチームパンク調）
    );

    // 地面の視覚的な境界線
    const groundTop = this.add.line(
      this.STAGE_WIDTH / 2, this.GROUND_Y_MIN, 
      0, 0, this.STAGE_WIDTH, 0, 
      0x8b4513
    ).setLineWidth(2);

    const groundBottom = this.add.line(
      this.STAGE_WIDTH / 2, this.GROUND_Y_MAX,
      0, 0, this.STAGE_WIDTH, 0,
      0x8b4513
    ).setLineWidth(2);
  }

  initializeEntities() {
    // プレイヤーの初期化（仮実装 - 後でPlayer.jsに移行）
    this.createPlayer();
    
    // SpawnSystemの初期化（後で実装）
    // this.spawnSystem = new SpawnSystem(this, STAGE1.spawnEvents);
  }

  createPlayer() {
    // 仮のプレイヤー実装（矩形ボックス）
    const playerSprite = this.add.rectangle(100, 420, 48, 64, 0x3399ff);
    this.physics.add.existing(playerSprite);
    
    // プレイヤーオブジェクトの基本設定
    playerSprite.body.setCollideWorldBounds(true);
    playerSprite.body.setSize(40, 60); // 当たり判定サイズ
    
    // カメラをプレイヤーに追従させる
    this.cameras.main.startFollow(playerSprite, true, 0.1, 0);
    
    // プレイヤー参照を保存
    this.player = {
      sprite: playerSprite,
      hp: 100,
      maxHp: 100,
      groundY: 420,
      alive: true
    };
  }

  setupEventListeners() {
    // UISceneとの通信用イベントリスナー
    this.events.on('playerDamage', this.handlePlayerDamage, this);
    this.events.on('enemySpawn', this.handleEnemySpawn, this);
    
    // ゲーム終了条件の監視
    this.events.on('playerDeath', this.handleGameOver, this);
    this.events.on('stageClear', this.handleStageClear, this);
  }

  update(time, delta) {
    try {
      // メインゲームループ
      this.updatePlayer(time, delta);
      this.updateEnemies(time, delta);
      this.updateSpawnSystem(time, delta);
      this.updateCollisions();
      
      // UI更新イベントの送信
      this.emitUIUpdates();
    } catch (error) {
      console.error('Error in GameScene update:', error);
    }
  }

  updatePlayer(time, delta) {
    if (!this.player || !this.player.alive) return;
    
    // プレイヤーの更新処理（後でPlayer.jsに移行）
    // 現在は基本的な存在チェックのみ
  }

  updateEnemies(time, delta) {
    // 敵グループの更新は runChildUpdate: true で自動実行される
    // ここでは死亡した敵の削除処理を行う
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.hp <= 0) {
        this.handleEnemyDeath(enemy);
      }
    });
  }

  updateSpawnSystem(time, delta) {
    if (this.spawnSystem) {
      const cameraX = this.cameras.main.scrollX;
      this.spawnSystem.update(cameraX);
    }
  }

  updateCollisions() {
    // 衝突判定の処理
    // プレイヤー vs 敵攻撃
    // プレイヤー攻撃 vs 敵
    // プレイヤー vs 武器（拾う）
  }

  emitUIUpdates() {
    // UISceneへの状態通知
    if (this.player) {
      this.events.emit('playerHpChange', {
        current: this.player.hp,
        max: this.player.maxHp
      });
    }
  }

  // スクロール制御メソッド
  lockScroll() {
    if (this.scrollLocked) return;
    
    this.scrollLocked = true;
    this.cameras.main.stopFollow();
    console.log('Camera scroll locked');
  }

  unlockScroll() {
    if (!this.scrollLocked) return;
    
    this.scrollLocked = false;
    if (this.player && this.player.sprite) {
      this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    }
    console.log('Camera scroll unlocked');
  }

  // イベントハンドラー
  handlePlayerDamage(data) {
    if (!this.player) return;
    
    this.player.hp = Math.max(0, this.player.hp - data.damage);
    
    if (this.player.hp <= 0) {
      this.handlePlayerDeath();
    }
  }

  handlePlayerDeath() {
    this.player.alive = false;
    this.events.emit('playerDeath');
    console.log('Player died');
  }

  handleEnemySpawn(data) {
    // 敵生成の処理（後でSpawnSystemと連携）
    console.log('Enemy spawn requested:', data);
  }

  handleEnemyDeath(enemy) {
    // 敵死亡時の処理
    enemy.destroy();
    this.events.emit('enemyKilled', { enemy });
    
    // スコア加算
    this.events.emit('scoreUpdate', { points: 100 });
  }

  handleGameOver() {
    console.log('Game Over');
    // ゲームオーバー処理
    this.scene.pause();
    // TODO: ゲームオーバーシーンへの遷移
  }

  handleStageClear() {
    console.log('Stage Clear');
    // ステージクリア処理
    this.scene.pause();
    // TODO: クリアシーンへの遷移
  }

  // ユーティリティメソッド
  isInDepthRange(obj1, obj2) {
    const y1 = obj1.groundY || obj1.y;
    const y2 = obj2.groundY || obj2.y;
    return Math.abs(y1 - y2) < this.DEPTH_THRESHOLD;
  }

  clampToStage(x, y) {
    return {
      x: Phaser.Math.Clamp(x, 0, this.STAGE_WIDTH),
      y: Phaser.Math.Clamp(y, this.GROUND_Y_MIN, this.GROUND_Y_MAX)
    };
  }

  // デバッグ用メソッド
  debugInfo() {
    return {
      playerAlive: this.player?.alive || false,
      enemyCount: this.enemies.children.size,
      cameraX: this.cameras.main.scrollX,
      scrollLocked: this.scrollLocked
    };
  }
}