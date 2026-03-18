class SpawnSystem {
  constructor(scene, events) {
    this.scene = scene;
    this.events = [...events]; // ステージデータのコピー
    this.activeWave = null;    // 現在のウェーブ { enemies: [], remaining: number }
    this.processedTriggers = new Set(); // 処理済みトリガーX座標
  }

  /**
   * スポーンシステムの更新
   * @param {number} cameraX - 現在のカメラX座標
   */
  update(cameraX) {
    // アクティブなウェーブがある場合はスポーンをスキップ
    if (this.activeWave || !this.events.length) {
      return;
    }

    // 次のスポーンイベントをチェック
    const nextEvent = this.events[0];
    if (cameraX >= nextEvent.triggerX && !this.processedTriggers.has(nextEvent.triggerX)) {
      this.processedTriggers.add(nextEvent.triggerX);
      this.events.shift();
      this.spawnWave(nextEvent);
    }
  }

  /**
   * ウェーブをスポーンし、カメラをロック
   * @param {Object} event - スポーンイベントデータ
   */
  spawnWave(event) {
    console.log(`Spawning wave at trigger X: ${event.triggerX}`);
    
    // カメラスクロールをロック
    this.scene.lockScroll();
    
    // ウェーブ管理オブジェクトを作成
    this.activeWave = {
      enemies: [],
      remaining: event.enemies.length,
      triggerX: event.triggerX
    };

    // 敵をスポーン
    event.enemies.forEach((enemyData, index) => {
      const spawnX = this.scene.cameras.main.scrollX + 900 + (enemyData.offsetX || index * 80);
      const spawnY = enemyData.groundY || Phaser.Math.Between(360, 480);
      
      const enemy = this.spawnEnemy(enemyData.type, spawnX, spawnY);
      this.activeWave.enemies.push(enemy);
    });

    // デバッグ情報
    console.log(`Wave spawned: ${this.activeWave.remaining} enemies`);
  }

  /**
   * 敵をスポーン
   * @param {string} type - 敵のタイプ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {Enemy} スポーンされた敵
   */
  spawnEnemy(type, x, y) {
    let enemy;
    
    switch (type) {
      case 'grunt':
        enemy = new Enemy(this.scene, x, y);
        break;
      case 'boss':
        enemy = new Boss(this.scene, x, y);
        break;
      default:
        console.error(`Unknown enemy type: ${type}`);
        return null;
    }

    // 敵グループに追加
    this.scene.enemies.add(enemy.sprite);
    
    // 敵の死亡イベントをリッスン
    enemy.on('death', () => this.onEnemyDeath(enemy));
    
    return enemy;
  }

  /**
   * 敵死亡時のコールバック
   * @param {Enemy} enemy - 死亡した敵
   */
  onEnemyDeath(enemy) {
    if (!this.activeWave) {
      return;
    }

    // 残り敵数を減らす
    this.activeWave.remaining--;
    
    console.log(`Enemy died, remaining: ${this.activeWave.remaining}`);

    // ウェーブ全滅チェック
    if (this.activeWave.remaining <= 0) {
      this.onWaveComplete();
    }
  }

  /**
   * ウェーブ完了時の処理
   */
  onWaveComplete() {
    console.log('Wave completed!');
    
    // ウェーブ状態をクリア
    this.activeWave = null;
    
    // GameSceneのウェーブクリアコールバックを呼び出し
    this.scene.onWaveClear();
    
    // 全てのイベントが完了した場合はステージクリア
    if (this.events.length === 0) {
      this.scene.onStageClear();
    }
  }

  /**
   * 現在のウェーブ情報を取得
   * @returns {Object|null} アクティブなウェーブ情報
   */
  getActiveWave() {
    return this.activeWave;
  }

  /**
   * 残りスポーンイベント数を取得
   * @returns {number} 残りイベント数
   */
  getRemainingEvents() {
    return this.events.length;
  }

  /**
   * システムをリセット（デバッグ用）
   */
  reset(events) {
    this.events = [...events];
    this.activeWave = null;
    this.processedTriggers.clear();
    
    // カメラロックが残っている場合は解除
    if (this.scene.isScrollLocked()) {
      this.scene.unlockScroll();
    }
  }
}