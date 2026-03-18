export class SpawnSystem {
  constructor(scene, stageData, callbacks = {}) {
    this.scene = scene;
    this.events = [...stageData.spawnEvents]; // ステージデータのコピー
    this.callbacks = {
      onWaveStart: callbacks.onWaveStart || (() => {}),
      onWaveClear: callbacks.onWaveClear || (() => {}),
      onStageClear: callbacks.onStageClear || (() => {}),
      onSpawn: callbacks.onSpawn || (() => {}),
    };
    
    // 現在のウェーブ状態
    this.currentWave = null;
    this.scrollLocked = false;
    this.stageComplete = false;
    
    // デバッグ用
    this.waveIndex = 0;
  }

  /**
   * 毎フレーム更新：カメラX座標を監視してウェーブトリガーをチェック
   */
  update(cameraX) {
    if (this.stageComplete) return;

    // 現在のウェーブが進行中の場合は新しいウェーブを開始しない
    if (this.currentWave && this.currentWave.active) return;

    // 次のイベントがあるかチェック
    if (this.events.length === 0) return;

    const nextEvent = this.events[0];
    if (cameraX >= nextEvent.triggerX) {
      this.startWave(nextEvent);
    }
  }

  /**
   * ウェーブ開始処理
   */
  startWave(eventData) {
    console.log(`Wave ${this.waveIndex + 1} starting at X=${eventData.triggerX}`);
    
    // イベントキューから取り出し
    this.events.shift();
    
    // ウェーブ状態を初期化
    this.currentWave = {
      active: true,
      totalEnemies: eventData.enemies.length,
      remainingEnemies: eventData.enemies.length,
      spawnedEnemies: [], // 生成した敵の参照を保持
    };

    // スクロールロック
    this.lockScroll();
    
    // コールバック実行
    this.callbacks.onWaveStart();

    // 敵を生成
    this.spawnEnemies(eventData.enemies);
    
    this.waveIndex++;
  }

  /**
   * 敵生成処理
   */
  spawnEnemies(enemyData) {
    const cameraX = this.scene.cameras.main.scrollX;
    
    enemyData.forEach((enemyInfo, index) => {
      // 画面右端から少し外側に配置
      const spawnX = cameraX + 900 + (enemyInfo.offsetX || index * 80);
      const spawnY = enemyInfo.groundY;
      
      // 敵を生成（GameSceneのspawnEnemyメソッドを呼び出し）
      const enemy = this.callbacks.onSpawn(enemyInfo.type, spawnX, spawnY);
      
      if (enemy) {
        // 敵にウェーブ管理システムへの参照を設定
        enemy.spawnSystem = this;
        this.currentWave.spawnedEnemies.push(enemy);
      }
    });
  }

  /**
   * 敵が撃破されたときに呼ばれる
   */
  onEnemyDefeated(enemy) {
    if (!this.currentWave || !this.currentWave.active) return;

    this.currentWave.remainingEnemies--;
    
    // 生成済み敵リストから削除
    const index = this.currentWave.spawnedEnemies.indexOf(enemy);
    if (index !== -1) {
      this.currentWave.spawnedEnemies.splice(index, 1);
    }

    console.log(`Enemy defeated. Remaining: ${this.currentWave.remainingEnemies}`);

    // ウェーブクリア判定
    if (this.currentWave.remainingEnemies <= 0) {
      this.onWaveClear();
    }
  }

  /**
   * ウェーブクリア処理
   */
  onWaveClear() {
    console.log(`Wave ${this.waveIndex} cleared!`);
    
    // ウェーブ状態をリセット
    this.currentWave.active = false;
    
    // スクロールアンロック
    this.unlockScroll();
    
    // コールバック実行
    this.callbacks.onWaveClear();

    // 全ウェーブクリア判定
    if (this.events.length === 0) {
      this.onStageClear();
    }
  }

  /**
   * ステージクリア処理
   */
  onStageClear() {
    console.log('Stage cleared!');
    
    this.stageComplete = true;
    this.callbacks.onStageClear();
  }

  /**
   * スクロールロック
   */
  lockScroll() {
    if (this.scrollLocked) return;
    
    this.scrollLocked = true;
    this.scene.cameras.main.stopFollow();
    console.log('Scroll locked');
  }

  /**
   * スクロールアンロック
   */
  unlockScroll() {
    if (!this.scrollLocked) return;
    
    this.scrollLocked = false;
    // プレイヤーの追従を再開
    const player = this.scene.player;
    if (player && player.sprite) {
      this.scene.cameras.main.startFollow(player.sprite, true, 0.1, 0);
    }
    console.log('Scroll unlocked');
  }

  /**
   * 現在のウェーブ情報を取得（デバッグ・UI用）
   */
  getCurrentWaveInfo() {
    if (!this.currentWave) {
      return null;
    }
    
    return {
      waveIndex: this.waveIndex,
      totalEnemies: this.currentWave.totalEnemies,
      remainingEnemies: this.currentWave.remainingEnemies,
      active: this.currentWave.active,
      scrollLocked: this.scrollLocked,
    };
  }

  /**
   * 強制的にウェーブをクリア（デバッグ用）
   */
  forceWaveClear() {
    if (this.currentWave && this.currentWave.active) {
      // 残りの敵を全て撃破扱いにする
      this.currentWave.spawnedEnemies.forEach(enemy => {
        if (enemy.alive) {
          enemy.takeDamage(enemy.hp);
        }
      });
    }
  }

  /**
   * システムリセット（ステージ再開始用）
   */
  reset(stageData) {
    this.events = [...stageData.spawnEvents];
    this.currentWave = null;
    this.scrollLocked = false;
    this.stageComplete = false;
    this.waveIndex = 0;
    
    // カメラのフォローを復元
    this.unlockScroll();
  }
}