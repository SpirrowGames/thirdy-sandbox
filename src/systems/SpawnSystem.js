export class SpawnSystem {
  constructor(scene, events, callbacks = {}) {
    this.scene = scene;
    this.events = [...events]; // ステージデータのコピー
    this.active = null; // 現在のウェーブ { remaining: number, enemies: Array }
    this.locked = false; // スクロールロック状態
    
    // コールバック関数
    this.callbacks = {
      onWaveStart: callbacks.onWaveStart || (() => {}),
      onWaveClear: callbacks.onWaveClear || (() => {}),
      onStageClear: callbacks.onStageClear || (() => {}),
      onSpawn: callbacks.onSpawn || (() => {})
    };
    
    // デバッグ用
    this.debug = false;
  }

  /**
   * 毎フレーム更新 - カメラX座標を監視してスポーンイベントをチェック
   * @param {number} cameraX - カメラの現在X座標
   */
  update(cameraX) {
    // ロック中または全イベント消化済みなら何もしない
    if (this.locked || !this.events.length) {
      return;
    }

    const nextEvent = this.events[0];
    if (cameraX >= nextEvent.triggerX) {
      // トリガーX座標に到達したのでウェーブを開始
      this.events.shift();
      this.spawnWave(nextEvent);
    }
  }

  /**
   * ウェーブを開始する
   * @param {Object} event - スポーンイベントデータ
   */
  spawnWave(event) {
    if (this.debug) {
      console.log('SpawnSystem: Starting wave with', event.enemies.length, 'enemies');
    }

    // スクロールロックを開始
    this.locked = true;
    this.callbacks.onWaveStart();

    // アクティブウェーブ情報を設定
    this.active = {
      remaining: event.enemies.length,
      enemies: []
    };

    // 敵を順次スポーン
    event.enemies.forEach((enemyData, index) => {
      // スポーン位置計算（画面右端から少し外側）
      const spawnX = this.scene.cameras.main.scrollX + 900 + (enemyData.offsetX || index * 80);
      const spawnY = enemyData.groundY || this._randomGroundY();

      // 敵をスポーン
      const enemy = this.callbacks.onSpawn(enemyData.type, spawnX, spawnY);
      if (enemy) {
        this.active.enemies.push(enemy);
        
        // 敵にSpawnSystemの参照を設定（死亡時の通知用）
        enemy.spawnSystem = this;
      }

      if (this.debug) {
        console.log(`SpawnSystem: Spawned ${enemyData.type} at (${spawnX}, ${spawnY})`);
      }
    });
  }

  /**
   * 敵が死亡した時に呼ばれる
   * @param {Object} enemy - 死亡した敵オブジェクト
   */
  onEnemyDead(enemy) {
    if (!this.active) {
      return;
    }

    // アクティブウェーブから敵を削除
    const enemyIndex = this.active.enemies.indexOf(enemy);
    if (enemyIndex >= 0) {
      this.active.enemies.splice(enemyIndex, 1);
    }

    this.active.remaining--;

    if (this.debug) {
      console.log(`SpawnSystem: Enemy died, remaining: ${this.active.remaining}`);
    }

    // 全ての敵を倒した場合
    if (this.active.remaining <= 0) {
      this._onWaveClear();
    }
  }

  /**
   * ウェーブクリア時の処理
   * @private
   */
  _onWaveClear() {
    if (this.debug) {
      console.log('SpawnSystem: Wave cleared');
    }

    // アクティブウェーブをリセット
    this.active = null;
    this.locked = false;

    // スクロールロックを解除
    this.callbacks.onWaveClear();

    // 全てのイベントが完了した場合はステージクリア
    if (this.events.length === 0) {
      this._onStageClear();
    }
  }

  /**
   * ステージクリア時の処理
   * @private
   */
  _onStageClear() {
    if (this.debug) {
      console.log('SpawnSystem: Stage cleared');
    }

    this.callbacks.onStageClear();
  }

  /**
   * ランダムな地面Y座標を生成
   * @private
   * @returns {number}
   */
  _randomGroundY() {
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    return Phaser.Math.Between(GROUND_Y_MIN, GROUND_Y_MAX);
  }

  /**
   * 現在の状態を取得（デバッグ用）
   * @returns {Object}
   */
  getState() {
    return {
      locked: this.locked,
      remainingEvents: this.events.length,
      activeWave: this.active ? {
        remaining: this.active.remaining,
        enemyCount: this.active.enemies.length
      } : null
    };
  }

  /**
   * 強制的にウェーブをクリアする（デバッグ用）
   */
  forceWaveClear() {
    if (this.active) {
      // アクティブな敵を全て削除
      this.active.enemies.forEach(enemy => {
        if (enemy.destroy) {
          enemy.destroy();
        }
      });
      this._onWaveClear();
    }
  }

  /**
   * システムをリセット
   * @param {Array} newEvents - 新しいスポーンイベント配列
   */
  reset(newEvents = []) {
    this.events = [...newEvents];
    this.active = null;
    this.locked = false;
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}