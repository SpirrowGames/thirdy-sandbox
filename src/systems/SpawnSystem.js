/**
 * SpawnSystem - X座標トリガー監視・ウェーブ管理・スクロールロック制御
 * 
 * 責務：
 * - ステージデータのスポーンイベントを監視
 * - カメラX座標がトリガーに到達したらウェーブ開始
 * - ウェーブ全滅まで画面スクロールをロック
 * - 全ウェーブクリアでステージクリア通知
 */

export class SpawnSystem {
  constructor(scene, events, callbacks = {}) {
    this.scene = scene;
    this.events = [...events]; // ステージデータのコピー（破壊的操作のため）
    this.callbacks = {
      onWaveStart: callbacks.onWaveStart || (() => {}),
      onWaveClear: callbacks.onWaveClear || (() => {}),
      onStageClear: callbacks.onStageClear || (() => {}),
      onSpawn: callbacks.onSpawn || (() => {}),
    };

    // 現在のウェーブ状態
    this.activeWave = null; // { remaining: number, spawned: Entity[] }
    this.scrollLocked = false;
    
    // デバッグ用
    this.debug = false;
  }

  /**
   * 毎フレーム更新 - カメラX座標を監視してスポーンイベントをトリガー
   * @param {number} cameraX - 現在のカメラX座標
   */
  update(cameraX) {
    // スクロールロック中または全イベント消化済みなら何もしない
    if (this.scrollLocked || this.events.length === 0) {
      return;
    }

    const nextEvent = this.events[0];
    if (cameraX >= nextEvent.triggerX) {
      this.events.shift(); // 消化したイベントを削除
      this.spawnWave(nextEvent);
    }
  }

  /**
   * ウェーブ開始 - 敵を生成してスクロールロック
   * @param {Object} event - スポーンイベント { triggerX, enemies }
   */
  spawnWave(event) {
    if (this.debug) {
      console.log(`SpawnSystem: Starting wave at X=${event.triggerX}`, event);
    }

    this.scrollLocked = true;
    this.callbacks.onWaveStart();

    // ウェーブ状態を初期化
    this.activeWave = {
      remaining: event.enemies.length,
      spawned: []
    };

    // 敵を順次生成（画面右端から少しずつずらして配置）
    event.enemies.forEach((enemyData, index) => {
      const spawnX = this.scene.cameras.main.scrollX + 900 + (enemyData.offsetX || index * 80);
      const spawnY = enemyData.groundY || this.getRandomGroundY();
      
      // コールバック経由で敵を生成（GameSceneに委譲）
      const enemy = this.callbacks.onSpawn(enemyData.type, spawnX, spawnY);
      
      if (enemy) {
        this.activeWave.spawned.push(enemy);
        
        // 敵の死亡イベントを監視
        enemy.once('destroy', () => this.onEnemyDestroyed(enemy));
      }
    });
  }

  /**
   * 敵が倒された時の処理
   * @param {Entity} enemy - 倒された敵
   */
  onEnemyDestroyed(enemy) {
    if (!this.activeWave) return;

    this.activeWave.remaining--;
    
    if (this.debug) {
      console.log(`SpawnSystem: Enemy destroyed, remaining: ${this.activeWave.remaining}`);
    }

    // ウェーブ全滅チェック
    if (this.activeWave.remaining <= 0) {
      this.onWaveClear();
    }
  }

  /**
   * ウェーブクリア処理
   */
  onWaveClear() {
    if (this.debug) {
      console.log('SpawnSystem: Wave cleared');
    }

    this.activeWave = null;
    this.scrollLocked = false;
    this.callbacks.onWaveClear();

    // 全ウェーブ完了チェック
    if (this.events.length === 0) {
      this.onStageClear();
    }
  }

  /**
   * ステージクリア処理
   */
  onStageClear() {
    if (this.debug) {
      console.log('SpawnSystem: Stage cleared');
    }

    this.callbacks.onStageClear();
  }

  /**
   * 手動で敵の死亡を通知（敵が直接destroyされた場合の対応）
   * @param {Entity} enemy - 死亡した敵
   */
  notifyEnemyDeath(enemy) {
    this.onEnemyDestroyed(enemy);
  }

  /**
   * ランダムな地面Y座標を取得
   * @returns {number} GROUND_Y_MIN〜GROUND_Y_MAXの範囲
   */
  getRandomGroundY() {
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    return Phaser.Math.Between(GROUND_Y_MIN, GROUND_Y_MAX);
  }

  /**
   * 現在の状態を取得（デバッグ・UI用）
   * @returns {Object} システム状態
   */
  getState() {
    return {
      scrollLocked: this.scrollLocked,
      activeWave: this.activeWave,
      remainingEvents: this.events.length,
      nextTriggerX: this.events.length > 0 ? this.events[0].triggerX : null
    };
  }

  /**
   * システムをリセット（ステージ再開始用）
   * @param {Array} newEvents - 新しいスポーンイベント配列
   */
  reset(newEvents) {
    this.events = [...newEvents];
    this.activeWave = null;
    this.scrollLocked = false;
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled - デバッグ有効フラグ
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * 強制的にスクロールロックを解除（緊急用）
   */
  forceUnlock() {
    console.warn('SpawnSystem: Force unlocking scroll');
    this.scrollLocked = false;
    this.activeWave = null;
    this.callbacks.onWaveClear();
  }
}