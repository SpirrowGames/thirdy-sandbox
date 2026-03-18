/**
 * スコアシステム - ゲーム全体のスコア管理を担当
 * 基本スコア、コンボボーナス、タイムボーナスの計算と管理
 */
export class ScoreSystem {
  constructor() {
    this.scoreState = {
      base: 0,      // 敵撃破スコア
      combo: 0,     // コンボボーナス
      time: 0,      // タイムボーナス
      total: 0      // 合計スコア
    };

    this.comboState = {
      count: 0,           // 現在のコンボ数
      multiplier: 1.0,    // コンボ倍率
      lastHitTime: 0,     // 最後のヒット時刻
      resetDelay: 1500    // コンボリセット時間（ms）
    };

    this.timeState = {
      startTime: 0,       // ステージ開始時刻
      currentTime: 0,     // 現在時刻
      bonusRate: 10       // 1秒あたりのボーナス係数
    };

    // 敵種別ごとのベーススコア
    this.enemyScores = {
      grunt: 100,
      boss: 1000
    };

    // コンボ閾値とボーナス倍率
    this.comboThresholds = [
      { count: 5,  multiplier: 1.2 },
      { count: 10, multiplier: 1.5 },
      { count: 20, multiplier: 2.0 },
      { count: 30, multiplier: 2.5 }
    ];
  }

  /**
   * ステージ開始時の初期化
   */
  startStage() {
    this.timeState.startTime = Date.now();
    this.timeState.currentTime = this.timeState.startTime;
    this.resetScore();
  }

  /**
   * スコア状態のリセット
   */
  resetScore() {
    this.scoreState.base = 0;
    this.scoreState.combo = 0;
    this.scoreState.time = 0;
    this.scoreState.total = 0;
    this.resetCombo();
  }

  /**
   * コンボ状態のリセット
   */
  resetCombo() {
    this.comboState.count = 0;
    this.comboState.multiplier = 1.0;
    this.comboState.lastHitTime = 0;
  }

  /**
   * 敵撃破時のスコア加算
   * @param {string} enemyType - 敵の種類
   * @param {number} currentTime - 現在時刻（ms）
   */
  addEnemyScore(enemyType, currentTime = Date.now()) {
    const baseScore = this.enemyScores[enemyType] || 50;
    
    // コンボ更新
    this.updateCombo(currentTime);
    
    // コンボ倍率を適用したスコアを加算
    const comboScore = Math.floor(baseScore * this.comboState.multiplier);
    this.scoreState.base += comboScore;
    
    // コンボボーナス計算（5コンボ以上で発生）
    if (this.comboState.count >= 5) {
      const bonusScore = Math.floor(baseScore * 0.5 * (this.comboState.count / 5));
      this.scoreState.combo += bonusScore;
    }
    
    this.updateTotalScore();
    
    return {
      baseScore: comboScore,
      comboBonus: this.comboState.count >= 5 ? Math.floor(baseScore * 0.5 * (this.comboState.count / 5)) : 0,
      comboCount: this.comboState.count,
      totalScore: this.scoreState.total
    };
  }

  /**
   * コンボ状態の更新
   * @param {number} currentTime - 現在時刻（ms）
   */
  updateCombo(currentTime) {
    // コンボリセット判定
    if (this.comboState.lastHitTime > 0 && 
        currentTime - this.comboState.lastHitTime > this.comboState.resetDelay) {
      this.resetCombo();
    }

    // コンボカウント増加
    this.comboState.count++;
    this.comboState.lastHitTime = currentTime;

    // コンボ倍率の更新
    this.updateComboMultiplier();
  }

  /**
   * コンボ倍率の更新
   */
  updateComboMultiplier() {
    let newMultiplier = 1.0;
    
    for (const threshold of this.comboThresholds) {
      if (this.comboState.count >= threshold.count) {
        newMultiplier = threshold.multiplier;
      }
    }
    
    this.comboState.multiplier = newMultiplier;
  }

  /**
   * 毎フレーム更新（主にタイム管理）
   * @param {number} currentTime - 現在時刻（ms）
   */
  update(currentTime = Date.now()) {
    this.timeState.currentTime = currentTime;
    
    // コンボタイムアウト判定
    if (this.comboState.lastHitTime > 0 && 
        currentTime - this.comboState.lastHitTime > this.comboState.resetDelay) {
      this.resetCombo();
    }
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
   * ステージクリア時のタイムボーナス計算
   * @param {number} clearTime - クリア時刻（ms）
   */
  calculateTimeBonus(clearTime = Date.now()) {
    const elapsedSeconds = Math.floor((clearTime - this.timeState.startTime) / 1000);
    
    // 5分以内クリアでボーナス（300秒 - 経過秒数）× ボーナス係数
    const maxBonusTime = 300; // 5分
    if (elapsedSeconds < maxBonusTime) {
      this.scoreState.time = (maxBonusTime - elapsedSeconds) * this.timeState.bonusRate;
    } else {
      this.scoreState.time = 0;
    }
    
    this.updateTotalScore();
    return this.scoreState.time;
  }

  /**
   * 合計スコアの更新
   */
  updateTotalScore() {
    this.scoreState.total = this.scoreState.base + this.scoreState.combo + this.scoreState.time;
  }

  /**
   * 現在のスコア状態を取得
   * @returns {Object} スコア状態
   */
  getScoreState() {
    return { ...this.scoreState };
  }

  /**
   * 現在のコンボ状態を取得
   * @returns {Object} コンボ状態
   */
  getComboState() {
    return {
      count: this.comboState.count,
      multiplier: this.comboState.multiplier,
      isActive: this.comboState.count > 0
    };
  }

  /**
   * 経過時間を取得（秒）
   * @returns {number} 経過時間
   */
  getElapsedTime() {
    return Math.floor((this.timeState.currentTime - this.timeState.startTime) / 1000);
  }

  /**
   * スコアランキング用のフォーマット済み結果を取得
   * @returns {Object} フォーマット済みスコア情報
   */
  getFormattedResult() {
    return {
      baseScore: this.scoreState.base.toLocaleString(),
      comboBonus: this.scoreState.combo.toLocaleString(),
      timeBonus: this.scoreState.time.toLocaleString(),
      totalScore: this.scoreState.total.toLocaleString(),
      maxCombo: this.getMaxComboAchieved(),
      clearTime: this.formatTime(this.getElapsedTime())
    };
  }

  /**
   * 達成した最大コンボ数を取得（将来の拡張用）
   * @returns {number} 最大コンボ数
   */
  getMaxComboAchieved() {
    // 現在は簡易実装、将来的に履歴管理を追加予定
    return this.comboState.count;
  }

  /**
   * 時間をMM:SS形式でフォーマット
   * @param {number} seconds - 秒数
   * @returns {string} フォーマット済み時間
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}