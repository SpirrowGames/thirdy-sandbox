class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // カメラスクロール状態管理
    this.scrollLocked = false;
    this.lockedCameraX = 0;
    this.followConfig = {
      lerp: { x: 0.1, y: 0 },
      offset: { x: 0, y: 0 }
    };
  }

  create() {
    // プレイヤー、敵、その他エンティティの初期化...
    this.player = new Player(this, 100, 440);
    this.enemies = this.physics.add.group();
    
    // カメラ設定
    this.cameras.main.setBounds(0, 0, 3000, 540);
    this.setupCameraFollow();
    
    // SpawnSystemの初期化
    this.spawnSystem = new SpawnSystem(this, STAGE1.spawnEvents);
  }

  /**
   * プレイヤー追従カメラの初期設定
   */
  setupCameraFollow() {
    this.cameras.main.startFollow(
      this.player.sprite, 
      true, 
      this.followConfig.lerp.x, 
      this.followConfig.lerp.y,
      this.followConfig.offset.x,
      this.followConfig.offset.y
    );
  }

  /**
   * カメラスクロールをロックし、現在位置で固定
   * ウェーブ出現時に呼び出される
   */
  lockScroll() {
    if (this.scrollLocked) {
      console.warn('Camera scroll is already locked');
      return;
    }

    // 現在のカメラX座標を保存
    this.lockedCameraX = this.cameras.main.scrollX;
    
    // プレイヤー追従を停止
    this.cameras.main.stopFollow();
    
    // カメラ位置を固定位置に設定
    this.cameras.main.setScroll(this.lockedCameraX, 0);
    
    // ロック状態を記録
    this.scrollLocked = true;
    
    // デバッグ用ログ
    console.log(`Camera scroll locked at X: ${this.lockedCameraX}`);
    
    // UIシーンにロック状態を通知
    this.events.emit('scrollLocked', { locked: true, cameraX: this.lockedCameraX });
  }

  /**
   * カメラスクロールロックを解除し、プレイヤー追従を再開
   * ウェーブ全滅時に呼び出される
   */
  unlockScroll() {
    if (!this.scrollLocked) {
      console.warn('Camera scroll is not locked');
      return;
    }

    // プレイヤー追従を再開
    this.setupCameraFollow();
    
    // ロック状態を解除
    this.scrollLocked = false;
    this.lockedCameraX = 0;
    
    // デバッグ用ログ
    console.log('Camera scroll unlocked, following player');
    
    // UIシーンにロック解除を通知
    this.events.emit('scrollLocked', { locked: false, cameraX: 0 });
  }

  /**
   * カメラスクロールのロック状態を取得
   * @returns {boolean} ロック状態
   */
  isScrollLocked() {
    return this.scrollLocked;
  }

  /**
   * 現在のロック位置を取得
   * @returns {number} ロックされたカメラX座標
   */
  getLockedPosition() {
    return this.lockedCameraX;
  }

  /**
   * 強制的にカメラ位置を設定（デバッグ用）
   * @param {number} x - X座標
   */
  forceCameraPosition(x) {
    if (this.scrollLocked) {
      this.lockedCameraX = x;
      this.cameras.main.setScroll(x, 0);
      console.log(`Force camera position to X: ${x}`);
    } else {
      console.warn('Cannot force camera position while scroll is not locked');
    }
  }

  update(time, delta) {
    // プレイヤー更新
    this.player.update(time, delta);
    
    // SpawnSystem更新（カメラ位置を渡す）
    const currentCameraX = this.scrollLocked ? this.lockedCameraX : this.cameras.main.scrollX;
    this.spawnSystem.update(currentCameraX);
    
    // スクロールロック中は手動でカメラ位置を維持
    if (this.scrollLocked) {
      this.cameras.main.setScroll(this.lockedCameraX, 0);
    }
    
    // 敵の更新
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.active) {
        enemy.update(this.player, delta);
      }
    });
  }

  /**
   * ウェーブクリア時のコールバック
   */
  onWaveClear() {
    this.unlockScroll();
    
    // スコアボーナス等の処理
    this.events.emit('waveClear', { 
      bonus: 500,
      timestamp: Date.now()
    });
  }

  /**
   * ステージクリア時のコールバック
   */
  onStageClear() {
    // 最終的にスクロールロックを解除
    if (this.scrollLocked) {
      this.unlockScroll();
    }
    
    // クリア演出
    this.events.emit('stageClear', {
      totalScore: this.calculateTotalScore(),
      clearTime: this.getClearTime()
    });
  }

  calculateTotalScore() {
    // スコア計算ロジック（仮実装）
    return 10000;
  }

  getClearTime() {
    // クリア時間計算（仮実装）
    return 120; // 秒
  }
}