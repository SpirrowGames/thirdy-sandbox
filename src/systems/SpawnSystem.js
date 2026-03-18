export class SpawnSystem {
  constructor(scene, spawnEvents, callbacks = {}) {
    this.scene = scene;
    this.events = [...spawnEvents]; // コピーして元データを保護
    this.callbacks = {
      onWaveStart: callbacks.onWaveStart || (() => {}),
      onWaveClear: callbacks.onWaveClear || (() => {}),
      onStageClear: callbacks.onStageClear || (() => {}),
      onSpawn: callbacks.onSpawn || (() => {}),
    };
    
    this.currentWave = null; // { remaining: number, enemies: Enemy[] }
    this.scrollLocked = false;
    this.stageCleared = false;
    this.nextEventIndex = 0;
    
    // デバッグ用
    this.debug = false;
  }

  /**
   * 毎フレーム更新 - カメラX座標を監視してイベントトリガー
   */
  update(cameraX) {
    if (this.stageCleared || this.scrollLocked) {
      return;
    }

    // 次のスポーンイベントをチェック
    if (this.nextEventIndex < this.events.length) {
      const nextEvent = this.events[this.nextEventIndex];
      
      if (cameraX >= nextEvent.triggerX) {
        this.triggerSpawnEvent(nextEvent);
        this.nextEventIndex++;
      }
    }
  }

  /**
   * スポーンイベント実行
   */
  triggerSpawnEvent(event) {
    if (this.debug) {
      console.log(`SpawnSystem: Triggering wave at X=${event.triggerX}`, event);
    }

    this.startWave(event);
  }

  /**
   * ウェーブ開始処理
   */
  startWave(event) {
    this.lockScroll();
    
    const spawnedEnemies = [];
    const baseX = this.scene.cameras.main.scrollX + this.scene.cameras.main.width - 100;

    event.enemies.forEach((enemyDef, index) => {
      const spawnX = baseX + (enemyDef.offsetX || index * 80);
      const spawnY = enemyDef.groundY || 440;
      
      const enemy = this.callbacks.onSpawn(enemyDef.type, spawnX, spawnY);
      if (enemy) {
        spawnedEnemies.push(enemy);
      }
    });

    this.currentWave = {
      remaining: spawnedEnemies.length,
      enemies: spawnedEnemies,
      startTime: Date.now()
    };

    this.callbacks.onWaveStart();

    if (this.debug) {
      console.log(`SpawnSystem: Wave started with ${this.currentWave.remaining} enemies`);
    }
  }

  /**
   * 敵が倒された時の処理
   */
  onEnemyDefeated(enemy) {
    if (!this.currentWave) {
      return;
    }

    // 現在のウェーブの敵かチェック
    const enemyIndex = this.currentWave.enemies.indexOf(enemy);
    if (enemyIndex === -1) {
      return; // このウェーブの敵ではない
    }

    this.currentWave.remaining--;
    
    if (this.debug) {
      console.log(`SpawnSystem: Enemy defeated, remaining: ${this.currentWave.remaining}`);
    }

    // ウェーブクリア判定
    if (this.currentWave.remaining <= 0) {
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

    const waveTime = Date.now() - this.currentWave.startTime;
    this.currentWave = null;
    
    this.unlockScroll();
    this.callbacks.onWaveClear();

    // 全イベント完了チェック
    if (this.nextEventIndex >= this.events.length) {
      this.clearStage();
    }
  }

  /**
   * ステージクリア処理
   */
  clearStage() {
    if (this.stageCleared) {
      return;
    }

    this.stageCleared = true;
    
    if (this.debug) {
      console.log('SpawnSystem: Stage cleared');
    }

    this.callbacks.onStageClear();
  }

  /**
   * スクロールロック
   */
  lockScroll() {
    if (this.scrollLocked) {
      return;
    }

    this.scrollLocked = true;
    this.scene.cameras.main.stopFollow();
    
    if (this.debug) {
      console.log('SpawnSystem: Scroll locked');
    }
  }

  /**
   * スクロールアンロック
   */
  unlockScroll() {
    if (!this.scrollLocked) {
      return;
    }

    this.scrollLocked = false;
    
    // プレイヤーを再度フォロー開始
    if (this.scene.player && this.scene.player.sprite) {
      this.scene.cameras.main.startFollow(
        this.scene.player.sprite, 
        true,  // lerp X
        0.1,   // lerp X amount
        0      // lerp Y amount (Y軸は追従しない)
      );
    }
    
    if (this.debug) {
      console.log('SpawnSystem: Scroll unlocked');
    }
  }

  /**
   * 強制リセット（デバッグ用）
   */
  reset() {
    this.currentWave = null;
    this.scrollLocked = false;
    this.stageCleared = false;
    this.nextEventIndex = 0;
    this.unlockScroll();
  }

  /**
   * 現在の状態取得
   */
  getState() {
    return {
      scrollLocked: this.scrollLocked,
      stageCleared: this.stageCleared,
      currentWave: this.currentWave ? {
        remaining: this.currentWave.remaining,
        total: this.currentWave.enemies.length
      } : null,
      nextEventIndex: this.nextEventIndex,
      totalEvents: this.events.length
    };
  }

  /**
   * デバッグモード切り替え
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}