/**
 * SpawnSystem - 敵出現管理システム
 * X座標トリガーによる敵の出現、ウェーブ管理、スクロールロック制御を担当
 */
export class SpawnSystem {
  /**
   * @param {Phaser.Scene} scene - GameSceneインスタンス
   * @param {Array} events - ステージのスポーンイベント配列
   * @param {Object} callbacks - コールバック関数群
   * @param {Function} callbacks.onWaveStart - ウェーブ開始時
   * @param {Function} callbacks.onWaveClear - ウェーブクリア時
   * @param {Function} callbacks.onStageClear - ステージクリア時
   * @param {Function} callbacks.onSpawn - 敵生成時
   */
  constructor(scene, events, callbacks = {}) {
    this.scene = scene;
    this.events = [...events]; // 元配列を変更しないようコピー
    this.callbacks = {
      onWaveStart: callbacks.onWaveStart || (() => {}),
      onWaveClear: callbacks.onWaveClear || (() => {}),
      onStageClear: callbacks.onStageClear || (() => {}),
      onSpawn: callbacks.onSpawn || (() => {}),
    };

    // 現在のウェーブ状態
    this.activeWave = null; // { remaining: number, enemies: Array }
    this.scrollLocked = false;
    
    // デバッグ情報
    this.totalWaves = events.length;
    this.currentWaveIndex = 0;
  }

  /**
   * 毎フレーム更新 - カメラX座標を監視してトリガー判定
   * @param {number} cameraX - カメラの現在X座標
   */
  update(cameraX) {
    // スクロールロック中または全イベント消化済みなら何もしない
    if (this.scrollLocked || this.events.length === 0) {
      return;
    }

    // 次のトリガーポイントをチェック
    const nextEvent = this.events[0];
    if (cameraX >= nextEvent.triggerX) {
      // イベントを配列から削除して実行
      this.events.shift();
      this.spawnWave(nextEvent);
    }
  }

  /**
   * ウェーブを開始する
   * @param {Object} event - スポーンイベントデータ
   * @param {number} event.triggerX - トリガーX座標
   * @param {Array} event.enemies - 敵データ配列
   */
  spawnWave(event) {
    if (this.activeWave) {
      console.warn('SpawnSystem: 既にアクティブなウェーブが存在します');
      return;
    }

    console.log(`SpawnSystem: ウェーブ ${this.currentWaveIndex + 1}/${this.totalWaves} 開始`);

    // スクロールをロック
    this.scrollLocked = true;
    this.callbacks.onWaveStart();

    // ウェーブ状態を初期化
    this.activeWave = {
      remaining: event.enemies.length,
      enemies: [...event.enemies], // 敵データのコピーを保持
    };

    // 敵を生成
    this.spawnEnemies(event.enemies);
    this.currentWaveIndex++;
  }

  /**
   * 敵を実際に生成する
   * @param {Array} enemyData - 敵データ配列
   */
  spawnEnemies(enemyData) {
    const cameraX = this.scene.cameras.main.scrollX;
    
    enemyData.forEach((enemyConfig, index) => {
      // 敵の出現位置を計算
      const spawnX = cameraX + 900 + (enemyConfig.offsetX || index * 80);
      const spawnY = enemyConfig.groundY || this.getRandomGroundY();

      // コールバック経由で敵を生成
      try {
        this.callbacks.onSpawn(enemyConfig.type, spawnX, spawnY);
        console.log(`SpawnSystem: ${enemyConfig.type} を (${spawnX}, ${spawnY}) に生成`);
      } catch (error) {
        console.error('SpawnSystem: 敵生成エラー:', error);
        // エラーが発生した場合は残り敵数を調整
        this.activeWave.remaining--;
      }
    });

    // 全ての敵生成に失敗した場合の対処
    if (this.activeWave.remaining <= 0) {
      console.warn('SpawnSystem: 全ての敵生成に失敗しました');
      this.onWaveClear();
    }
  }

  /**
   * 敵が死亡した時に呼ばれる
   * ウェーブの残り敵数を管理し、全滅時にクリア処理を実行
   */
  onEnemyDead() {
    if (!this.activeWave) {
      console.warn('SpawnSystem: アクティブなウェーブが存在しません');
      return;
    }

    this.activeWave.remaining--;
    console.log(`SpawnSystem: 敵撃破 (残り: ${this.activeWave.remaining})`);

    // ウェーブ全滅チェック
    if (this.activeWave.remaining <= 0) {
      this.onWaveClear();
    }
  }

  /**
   * ウェーブクリア処理
   */
  onWaveClear() {
    if (!this.activeWave) {
      return;
    }

    console.log(`SpawnSystem: ウェーブ ${this.currentWaveIndex}/${this.totalWaves} クリア`);

    // ウェーブ状態をリセット
    this.activeWave = null;
    this.scrollLocked = false;

    // スクロールロックを解除
    this.callbacks.onWaveClear();

    // 全ウェーブクリアチェック
    if (this.events.length === 0) {
      console.log('SpawnSystem: 全ウェーブクリア - ステージクリア');
      this.callbacks.onStageClear();
    }
  }

  /**
   * ランダムな地面Y座標を取得
   * @returns {number} Y座標
   */
  getRandomGroundY() {
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    return Phaser.Math.Between(GROUND_Y_MIN, GROUND_Y_MAX);
  }

  /**
   * 強制的にウェーブをクリアする（デバッグ用）
   */
  forceWaveClear() {
    if (this.activeWave) {
      console.log('SpawnSystem: ウェーブを強制クリア');
      this.onWaveClear();
    }
  }

  /**
   * 現在の状態を取得（デバッグ・UI表示用）
   * @returns {Object} 現在の状態
   */
  getStatus() {
    return {
      scrollLocked: this.scrollLocked,
      activeWave: this.activeWave,
      remainingEvents: this.events.length,
      currentWave: this.currentWaveIndex,
      totalWaves: this.totalWaves,
    };
  }

  /**
   * システムをリセット（ステージ再開時など）
   * @param {Array} events - 新しいスポーンイベント配列
   */
  reset(events) {
    this.events = [...events];
    this.activeWave = null;
    this.scrollLocked = false;
    this.currentWaveIndex = 0;
    this.totalWaves = events.length;
    console.log('SpawnSystem: リセット完了');
  }

  /**
   * リソースクリーンアップ
   */
  destroy() {
    this.scene = null;
    this.events = [];
    this.activeWave = null;
    this.callbacks = {};
    console.log('SpawnSystem: 破棄完了');
  }
}