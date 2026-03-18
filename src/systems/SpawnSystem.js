export class SpawnSystem {
  constructor(scene, events, callbacks = {}) {
    this.scene = scene;
    this.events = [...events]; // ステージデータのコピー
    this.active = null;        // 現在のウェーブ { remaining: number, enemies: GameObject[] }
    this.locked = false;       // スクロールロック状態
    this.triggered = new Set(); // 既にトリガーされたイベントID管理
    
    // コールバック関数を設定
    this.callbacks = {
      onWaveStart: callbacks.onWaveStart || (() => {}),
      onWaveClear: callbacks.onWaveClear || (() => {}),
      onStageClear: callbacks.onStageClear || (() => {}),
      onSpawn: callbacks.onSpawn || ((type, x, y) => {}),
    };
    
    // イベントにIDを付与（重複実行防止用）
    this.events.forEach((event, index) => {
      event.id = event.id || `wave_${index}`;
    });
  }

  /**
   * 毎フレーム呼び出される更新処理
   * @param {number} cameraX - カメラのX座標
   */
  update(cameraX) {
    if (this.locked || !this.events.length) return;

    // 次にトリガーすべきイベントを確認
    const nextEvent = this.events[0];
    if (cameraX >= nextEvent.triggerX && !this.triggered.has(nextEvent.id)) {
      this.events.shift();
      this.triggered.add(nextEvent.id);
      this.spawnWave(nextEvent);
    }
  }

  /**
   * ウェーブを生成してスクロールをロック
   * @param {Object} event - スポーンイベントデータ
   */
  spawnWave(event) {
    this.locked = true;
    this.callbacks.onWaveStart();
    
    // アクティブウェーブ情報を設定
    this.active = {
      remaining: event.enemies.length,
      enemies: []
    };

    // 敵を生成
    event.enemies.forEach((enemyData, index) => {
      const spawnX = this.scene.cameras.main.scrollX + 900 + (enemyData.offsetX || index * 80);
      const spawnY = enemyData.groundY || Phaser.Math.Between(360, 480);
      
      const enemy = this.callbacks.onSpawn(enemyData.type, spawnX, spawnY);
      if (enemy) {
        this.active.enemies.push(enemy);
        // 敵の死亡イベントを監視
        enemy.once('destroy', () => this.onEnemyDestroyed(enemy));
      }
    });

    console.log(`SpawnSystem: Wave started with ${this.active.remaining} enemies at X=${event.triggerX}`);
  }

  /**
   * 敵が倒された時の処理
   * @param {GameObject} enemy - 倒された敵
   */
  onEnemyDestroyed(enemy) {
    if (!this.active) return;

    // アクティブリストから削除
    const index = this.active.enemies.indexOf(enemy);
    if (index !== -1) {
      this.active.enemies.splice(index, 1);
      this.active.remaining--;
    }

    console.log(`SpawnSystem: Enemy destroyed, remaining: ${this.active.remaining}`);

    // ウェーブクリア判定
    if (this.active.remaining <= 0) {
      this.onWaveCleared();
    }
  }

  /**
   * ウェーブクリア時の処理
   */
  onWaveCleared() {
    console.log('SpawnSystem: Wave cleared');
    
    this.active = null;
    this.locked = false;
    this.callbacks.onWaveClear();

    // 全てのウェーブが完了した場合
    if (this.events.length === 0) {
      console.log('SpawnSystem: Stage cleared');
      this.callbacks.onStageClear();
    }
  }

  /**
   * 強制的にスクロールロックを解除（デバッグ用）
   */
  forceUnlock() {
    this.locked = false;
    this.active = null;
    console.warn('SpawnSystem: Force unlocked');
  }

  /**
   * システムの状態をリセット
   */
  reset() {
    this.active = null;
    this.locked = false;
    this.triggered.clear();
    console.log('SpawnSystem: Reset');
  }

  /**
   * 現在の状態を取得（デバッグ用）
   */
  getState() {
    return {
      locked: this.locked,
      activeWave: this.active,
      remainingEvents: this.events.length,
      triggeredCount: this.triggered.size
    };
  }

  /**
   * 特定の敵を手動で削除（緊急時用）
   * @param {GameObject} enemy - 削除する敵
   */
  removeEnemy(enemy) {
    if (this.active && this.active.enemies.includes(enemy)) {
      this.onEnemyDestroyed(enemy);
    }
  }
}