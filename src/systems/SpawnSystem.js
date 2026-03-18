/**
 * スポーン管理システム
 * X座標トリガーを監視し、敵ウェーブの生成とスクロールロック制御を行う
 */
export class SpawnSystem {
  /**
   * @param {Phaser.Scene} scene - GameScene インスタンス
   * @param {Array} spawnEvents - ステージのスポーンイベント配列
   * @param {Object} callbacks - コールバック関数群
   */
  constructor(scene, spawnEvents = [], callbacks = {}) {
    this.scene = scene;
    this.events = [...spawnEvents]; // 元データを変更しないようコピー
    this.callbacks = {
      onWaveStart: callbacks.onWaveStart || (() => {}),
      onWaveClear: callbacks.onWaveClear || (() => {}),
      onStageClear: callbacks.onStageClear || (() => {}),
      onSpawn: callbacks.onSpawn || (() => {}),
      ...callbacks
    };
    
    // 現在のウェーブ状態
    this.activeWave = null; // { remaining: number, enemies: Array }
    this.isLocked = false;
    this.isStageComplete = false;
    
    // デバッグ用
    this.debug = false;
  }

  /**
   * 毎フレーム更新処理
   * @param {number} cameraX - カメラのX座標
   */
  update(cameraX) {
    if (this.isLocked || this.isStageComplete || this.events.length === 0) {
      return;
    }

    // 次のスポーンイベントをチェック
    const nextEvent = this.events[0];
    if (cameraX >= nextEvent.triggerX) {
      this.triggerSpawnEvent(nextEvent);
    }
  }

  /**
   * スポーンイベントをトリガー
   * @param {Object} event - スポーンイベントデータ
   */
  triggerSpawnEvent(event) {
    // イベントを消費
    this.events.shift();
    
    if (this.debug) {
      console.log(`SpawnSystem: Triggering event at X=${event.triggerX}`, event);
    }

    // スクロールロック
    this.lockScroll();
    
    // ウェーブ開始
    this.startWave(event);
  }

  /**
   * ウェーブを開始
   * @param {Object} event - スポーンイベント
   */
  startWave(event) {
    const enemies = event.enemies || [];
    
    this.activeWave = {
      remaining: enemies.length,
      enemies: [...enemies],
      startTime: Date.now()
    };

    // コールバック実行
    this.callbacks.onWaveStart(event);

    // 敵を順次スポーン
    enemies.forEach((enemyData, index) => {
      // スポーン位置計算
      const spawnX = this.calculateSpawnX(enemyData, index);
      const spawnY = this.calculateSpawnY(enemyData);
      
      // 少し間隔を空けてスポーン（演出的効果）
      const delay = index * 200; // 200ms間隔
      
      this.scene.time.delayedCall(delay, () => {
        this.spawnEnemy(enemyData, spawnX, spawnY);
      });
    });
  }

  /**
   * 敵のスポーンX座標を計算
   * @param {Object} enemyData - 敵データ
   * @param {number} index - スポーン順序
   * @returns {number} X座標
   */
  calculateSpawnX(enemyData, index) {
    const cameraX = this.scene.cameras.main.scrollX;
    const baseX = cameraX + 900; // 画面右端外
    
    if (enemyData.offsetX !== undefined) {
      return baseX + enemyData.offsetX;
    }
    
    // デフォルトは80px間隔で横並び
    return baseX + (index * 80);
  }

  /**
   * 敵のスポーンY座標を計算
   * @param {Object} enemyData - 敵データ
   * @returns {number} Y座標
   */
  calculateSpawnY(enemyData) {
    if (enemyData.groundY !== undefined) {
      return enemyData.groundY;
    }
    
    // デフォルトはランダムな奥行き
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    return Phaser.Math.Between(GROUND_Y_MIN, GROUND_Y_MAX);
  }

  /**
   * 敵をスポーン
   * @param {Object} enemyData - 敵データ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   */
  spawnEnemy(enemyData, x, y) {
    const enemy = this.callbacks.onSpawn(enemyData.type, x, y, enemyData);
    
    if (enemy && this.activeWave) {
      // 敵にウェーブ参照を設定（死亡時の通知用）
      enemy.waveId = this.activeWave.startTime;
    }

    if (this.debug) {
      console.log(`SpawnSystem: Spawned ${enemyData.type} at (${x}, ${y})`);
    }
  }

  /**
   * 敵が死亡した時の通知
   * @param {Object} enemy - 死亡した敵
   */
  onEnemyDestroyed(enemy) {
    if (!this.activeWave || !enemy.waveId || enemy.waveId !== this.activeWave.startTime) {
      return; // 異なるウェーブの敵または既にウェーブ終了
    }

    this.activeWave.remaining--;
    
    if (this.debug) {
      console.log(`SpawnSystem: Enemy destroyed, remaining: ${this.activeWave.remaining}`);
    }

    // ウェーブクリア判定
    if (this.activeWave.remaining <= 0) {
      this.clearWave();
    }
  }

  /**
   * ウェーブクリア処理
   */
  clearWave() {
    if (this.debug) {
      console.log('SpawnSystem: Wave cleared');
    }

    // ウェーブ状態リセット
    this.activeWave = null;
    
    // スクロールアンロック
    this.unlockScroll();
    
    // コールバック実行
    this.callbacks.onWaveClear();
    
    // ステージクリア判定
    if (this.events.length === 0) {
      this.completeStage();
    }
  }

  /**
   * ステージクリア処理
   */
  completeStage() {
    this.isStageComplete = true;
    
    if (this.debug) {
      console.log('SpawnSystem: Stage completed');
    }
    
    this.callbacks.onStageClear();
  }

  /**
   * スクロールをロック
   */
  lockScroll() {
    if (this.isLocked) return;
    
    this.isLocked = true;
    
    if (this.debug) {
      console.log('SpawnSystem: Scroll locked');
    }
  }

  /**
   * スクロールをアンロック
   */
  unlockScroll() {
    if (!this.isLocked) return;
    
    this.isLocked = false;
    
    if (this.debug) {
      console.log('SpawnSystem: Scroll unlocked');
    }
  }

  /**
   * 強制的にウェーブをクリア（デバッグ用）
   */
  forceWaveClear() {
    if (this.activeWave) {
      this.activeWave.remaining = 0;
      this.clearWave();
    }
  }

  /**
   * 次のスポーンイベントを強制トリガー（デバッグ用）
   */
  forceNextEvent() {
    if (this.events.length > 0) {
      const nextEvent = this.events[0];
      this.triggerSpawnEvent(nextEvent);
    }
  }

  /**
   * システムの状態を取得
   */
  getStatus() {
    return {
      isLocked: this.isLocked,
      isStageComplete: this.isStageComplete,
      remainingEvents: this.events.length,
      activeWave: this.activeWave ? {
        remaining: this.activeWave.remaining,
        enemyCount: this.activeWave.enemies.length
      } : null
    };
  }

  /**
   * システムをリセット
   * @param {Array} newSpawnEvents - 新しいスポーンイベント配列
   */
  reset(newSpawnEvents = []) {
    this.events = [...newSpawnEvents];
    this.activeWave = null;
    this.isLocked = false;
    this.isStageComplete = false;
    
    if (this.debug) {
      console.log('SpawnSystem: Reset with', newSpawnEvents.length, 'events');
    }
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled - デバッグ有効フラグ
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}