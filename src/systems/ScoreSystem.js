/**
 * スコアシステム - 敵撃破、コンボ、タイムボーナスの管理
 */
export class ScoreSystem {
  constructor(scene) {
    this.scene = scene;
    
    // スコア状態
    this.state = {
      base: 0,           // 敵撃破スコア
      combo: 0,          // コンボボーナス累計
      time: 0,           // タイムボーナス
      total: 0,          // 合計スコア
      currentCombo: 0,   // 現在のコンボ数
      comboTimer: 0,     // コンボリセットタイマー
    };

    // 設定値
    this.config = {
      COMBO_RESET_TIME: 1500,    // ms - コンボリセット時間
      COMBO_THRESHOLD: 5,        // コンボボーナス発動閾値
      COMBO_MULTIPLIER: 0.5,     // コンボボーナス倍率
      TIME_BONUS_PER_SEC: 10,    // 1秒あたりのタイムボーナス
    };

    // 敵種別スコア
    this.enemyScores = {
      grunt: 100,
      boss: 1000,
    };

    // ステージ開始時間
    this.stageStartTime = Date.now();
  }

  /**
   * 敵撃破時のスコア加算
   * @param {string} enemyType - 敵の種類
   * @param {boolean} resetCombo - コンボをリセットするか
   */
  addEnemyScore(enemyType, resetCombo = false) {
    const baseScore = this.enemyScores[enemyType] || 50;
    this.state.base += baseScore;

    if (resetCombo) {
      this.resetCombo();
    } else {
      this.incrementCombo();
      // コンボボーナス計算
      if (this.state.currentCombo >= this.config.COMBO_THRESHOLD) {
        const comboBonus = Math.floor(baseScore * this.config.COMBO_MULTIPLIER);
        this.state.combo += comboBonus;
      }
    }

    this.updateTotal();
    this.notifyScoreChange();
  }

  /**
   * コンボカウンタを増加
   */
  incrementCombo() {
    this.state.currentCombo++;
    this.state.comboTimer = this.config.COMBO_RESET_TIME;
    this.notifyComboChange();
  }

  /**
   * コンボをリセット
   */
  resetCombo() {
    this.state.currentCombo = 0;
    this.state.comboTimer = 0;
    this.notifyComboChange();
  }

  /**
   * 毎フレーム更新
   * @param {number} delta - フレーム間隔（ms）
   */
  update(delta) {
    // コンボタイマー更新
    if (this.state.comboTimer > 0) {
      this.state.comboTimer -= delta;
      if (this.state.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }

  /**
   * ステージクリア時のタイムボーナス計算
   */
  calculateTimeBonus() {
    const elapsedSeconds = Math.floor((Date.now() - this.stageStartTime) / 1000);
    const maxTime = 300; // 5分
    const remainingTime = Math.max(0, maxTime - elapsedSeconds);
    
    this.state.time = remainingTime * this.config.TIME_BONUS_PER_SEC;
    this.updateTotal();
    this.notifyScoreChange();
  }

  /**
   * 合計スコア更新
   */
  updateTotal() {
    this.state.total = this.state.base + this.state.combo + this.state.time;
  }

  /**
   * スコア変更をUISceneに通知
   */
  notifyScoreChange() {
    this.scene.events.emit('scoreUpdate', {
      base: this.state.base,
      combo: this.state.combo,
      time: this.state.time,
      total: this.state.total,
    });
  }

  /**
   * コンボ変更をUISceneに通知
   */
  notifyComboChange() {
    this.scene.events.emit('comboUpdate', {
      count: this.state.currentCombo,
      timer: this.state.comboTimer,
      maxTime: this.config.COMBO_RESET_TIME,
    });
  }

  /**
   * プレイヤー被弾時のコンボリセット
   */
  onPlayerHit() {
    this.resetCombo();
  }

  /**
   * ウェーブクリア時のコンボリセット
   */
  onWaveClear() {
    this.resetCombo();
  }

  /**
   * 現在のスコア状態を取得
   * @returns {Object} スコア状態
   */
  getState() {
    return { ...this.state };
  }

  /**
   * スコアをリセット（新ゲーム開始時）
   */
  reset() {
    this.state = {
      base: 0,
      combo: 0,
      time: 0,
      total: 0,
      currentCombo: 0,
      comboTimer: 0,
    };
    this.stageStartTime = Date.now();
    this.notifyScoreChange();
    this.notifyComboChange();
  }

  /**
   * デバッグ用：スコア情報をコンソール出力
   */
  debugLog() {
    console.log('Score System State:', {
      base: this.state.base,
      combo: this.state.combo,
      time: this.state.time,
      total: this.state.total,
      currentCombo: this.state.currentCombo,
      comboTimer: Math.floor(this.state.comboTimer),
    });
  }
}