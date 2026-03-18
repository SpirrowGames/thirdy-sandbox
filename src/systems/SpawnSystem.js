/**
 * SpawnSystem - X座標トリガー監視・ウェーブ管理・スクロールロック制御
 * 
 * 責務:
 * - ステージデータに基づいてX座標でのトリガー監視
 * - ウェーブ出現時のカメラスクロールロック
 * - 敵全滅時のスクロールアンロック
 * - ステージクリア判定
 */
export class SpawnSystem {
  /**
   * @param {Phaser.Scene} scene - GameScene インスタンス
   * @param {Array} spawnEvents - ステージのスポーンイベント配列
   * @param {Object} callbacks - コールバック関数群
   */
  constructor(scene, spawnEvents, callbacks = {}) {
    this.scene = scene;
    this.events = [...spawnEvents]; // 元配列を変更しないためコピー
    this.callbacks = {
      onWaveStart: callbacks.onWaveStart || (() => {}),
      onWaveClear: callbacks.onWaveClear || (() => {}),
      onStageClear: callbacks.onStageClear || (() => {}),
      onSpawn: callbacks.onSpawn || (() => {}),
    };

    // 現在のウェーブ状態
    this.activeWave = null; // { enemies: Array, remaining: number }
    this.scrollLocked = false;
    
    // デバッグ用
    this.debug = false;
    
    console.log(`SpawnSystem初期化: ${this.events.length}個のイベント`);
  }

  /**
   * 毎フレーム更新 - カメラX座標を監視してトリガー判定
   * @param {number} cameraX - 現在のカメラX座標
   */
  update(cameraX) {
    // スクロールロック中または全イベント消化済みなら処理スキップ
    if (this.scrollLocked || this.events.length === 0) {
      return;
    }

    // 次のトリガーをチェック
    const nextEvent = this.events[0];
    if (cameraX >= nextEvent.triggerX) {
      this.triggerSpawnEvent(nextEvent);
    }
  }

  /**
   * スポーンイベントを実行
   * @param {Object} event - スポーンイベントデータ
   */
  triggerSpawnEvent(event) {
    // イベント配列から削除
    this.events.shift();
    
    if (this.debug) {
      console.log(`スポーンイベント発動: triggerX=${event.triggerX}, 敵数=${event.enemies.length}`);
    }

    // ウェーブ開始処理
    this.startWave(event);
  }

  /**
   * ウェーブ開始処理
   * @param {Object} event - スポーンイベントデータ
   */
  startWave(event) {
    // スクロールロック
    this.lockScroll();
    
    // アクティブウェーブ設定
    this.activeWave = {
      enemies: [...event.enemies],
      remaining: event.enemies.length,
      startTime: Date.now(),
    };

    // コールバック実行
    this.callbacks.onWaveStart();

    // 敵をスポーン
    this.spawnEnemies(event.enemies);
  }

  /**
   * 敵をスポーン
   * @param {Array} enemyList - 敵定義配列
   */
  spawnEnemies(enemyList) {
    const cameraX = this.scene.cameras.main.scrollX;
    
    enemyList.forEach((enemyDef, index) => {
      // スポーン座標計算
      const spawnX = cameraX + 900 + (enemyDef.offsetX || index * 80);
      const spawnY = enemyDef.groundY || this.getRandomGroundY();
      
      if (this.debug) {
        console.log(`敵スポーン: ${enemyDef.type} at (${spawnX}, ${spawnY})`);
      }

      // GameSceneのスポーン処理を呼び出し
      this.callbacks.onSpawn(enemyDef.type, spawnX, spawnY);
    });
  }

  /**
   * 敵が死亡した時の処理
   */
  onEnemyDead() {
    if (!this.activeWave) return;

    this.activeWave.remaining--;
    
    if (this.debug) {
      console.log(`敵撃破: 残り${this.activeWave.remaining}体`);
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
      console.log('ウェーブクリア');
    }

    // ウェーブ状態リセット
    this.activeWave = null;
    
    // スクロールアンロック
    this.unlockScroll();
    
    // コールバック実行
    this.callbacks.onWaveClear();

    // ステージクリア判定
    if (this.events.length === 0) {
      this.completeStageClear();
    }
  }

  /**
   * ステージクリア処理
   */
  completeStageClear() {
    if (this.debug) {
      console.log('ステージクリア');
    }
    
    this.callbacks.onStageClear();
  }

  /**
   * スクロールロック
   */
  lockScroll() {
    this.scrollLocked = true;
    this.scene.cameras.main.stopFollow();
    
    if (this.debug) {
      console.log('スクロールロック');
    }
  }

  /**
   * スクロールアンロック
   */
  unlockScroll() {
    this.scrollLocked = false;
    
    // プレイヤーが存在する場合のみフォロー再開
    if (this.scene.player && this.scene.player.sprite) {
      this.scene.cameras.main.startFollow(this.scene.player.sprite, true, 0.1, 0);
    }
    
    if (this.debug) {
      console.log('スクロールアンロック');
    }
  }

  /**
   * ランダムなgroundY座標を取得
   * @returns {number} Y座標
   */
  getRandomGroundY() {
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    return Phaser.Math.Between(GROUND_Y_MIN, GROUND_Y_MAX);
  }

  /**
   * 現在の状態を取得（デバッグ用）
   * @returns {Object} 状態オブジェクト
   */
  getState() {
    return {
      remainingEvents: this.events.length,
      scrollLocked: this.scrollLocked,
      activeWave: this.activeWave ? {
        remaining: this.activeWave.remaining,
        total: this.activeWave.enemies.length,
      } : null,
    };
  }

  /**
   * デバッグモード切り替え
   * @param {boolean} enabled - デバッグ有効フラグ
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * システムリセット（ステージ再開時など）
   * @param {Array} newSpawnEvents - 新しいスポーンイベント配列
   */
  reset(newSpawnEvents) {
    this.events = [...newSpawnEvents];
    this.activeWave = null;
    this.scrollLocked = false;
    
    if (this.debug) {
      console.log(`SpawnSystemリセット: ${this.events.length}個のイベント`);
    }
  }

  /**
   * 強制的にウェーブを終了（デバッグ用）
   */
  forceWaveClear() {
    if (this.activeWave) {
      this.activeWave.remaining = 0;
      this.clearWave();
    }
  }
}