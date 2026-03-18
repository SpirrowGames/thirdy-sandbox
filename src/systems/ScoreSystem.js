/**
 * スコア計算・管理システム
 * 基本スコア、コンボボーナス、タイムボーナスを統合管理
 */
export class ScoreSystem {
  constructor(scene) {
    this.scene = scene;
    this.reset();
    
    // コンボ設定
    this.COMBO_THRESHOLD = 5;        // コンボボーナス発動閾値
    this.COMBO_MULTIPLIER = 0.5;     // コンボボーナス倍率
    this.COMBO_RESET_TIME = 1500;    // コンボリセット時間(ms)
    
    // タイム設定
    this.stageStartTime = Date.now();
    this.TIME_BONUS_RATE = 10;       // 残り時間1秒あたりのボーナス
    this.STAGE_TIME_LIMIT = 300;     // ステージ制限時間(秒)
    
    // 敵撃破スコア設定
    this.ENEMY_SCORES = {
      grunt: 100,
      boss: 1000
    };
  }

  reset() {
    this.baseScore = 0;
    this.comboCount = 0;
    this.comboBonus = 0;
    this.timeBonus = 0;
    this.totalScore = 0;
    this.lastHitTime = 0;
    this.stageStartTime = Date.now();
  }

  /**
   * 敵撃破時のスコア加算
   * @param {string} enemyType - 敵の種類
   * @param {boolean} isCombo - コンボ中かどうか
   */
  addEnemyScore(enemyType, isCombo = false) {
    const basePoints = this.ENEMY_SCORES[enemyType] || 50;
    this.baseScore += basePoints;

    if (isCombo) {
      this.comboCount++;
      this.lastHitTime = Date.now();
      
      // コンボボーナス計算
      if (this.comboCount >= this.COMBO_THRESHOLD) {
        const comboPoints = Math.floor(basePoints * this.COMBO_MULTIPLIER);
        this.comboBonus += comboPoints;
      }
    } else {
      this.resetCombo();
    }

    this.calculateTotal();
    this.notifyScoreUpdate();
  }

  /**
   * コンボ更新チェック（毎フレーム呼び出し）
   */
  update() {
    if (this.comboCount > 0 && Date.now() - this.lastHitTime > this.COMBO_RESET_TIME) {
      this.resetCombo();
    }
  }

  /**
   * コンボリセット
   */
  resetCombo() {
    if (this.comboCount > 0) {
      this.comboCount = 0;
      this.notifyComboUpdate();
    }
  }

  /**
   * プレイヤー被弾時のコンボリセット
   */
  onPlayerHit() {
    this.resetCombo();
  }

  /**
   * ステージクリア時のタイムボーナス計算
   */
  calculateTimeBonus() {
    const elapsedTime = (Date.now() - this.stageStartTime) / 1000;
    const remainingTime = Math.max(0, this.STAGE_TIME_LIMIT - elapsedTime);
    this.timeBonus = Math.floor(remainingTime * this.TIME_BONUS_RATE);
    this.calculateTotal();
    this.notifyScoreUpdate();
  }

  /**
   * 総スコア計算
   */
  calculateTotal() {
    this.totalScore = this.baseScore + this.comboBonus + this.timeBonus;
  }

  /**
   * スコア更新をUISceneに通知
   */
  notifyScoreUpdate() {
    this.scene.events.emit('scoreUpdate', {
      base: this.baseScore,
      combo: this.comboBonus,
      time: this.timeBonus,
      total: this.totalScore
    });
  }

  /**
   * コンボ更新をUISceneに通知
   */
  notifyComboUpdate() {
    this.scene.events.emit('comboUpdate', {
      count: this.comboCount,
      multiplier: this.getComboMultiplier()
    });
  }

  /**
   * 現在のコンボ倍率取得
   */
  getComboMultiplier() {
    return this.comboCount >= this.COMBO_THRESHOLD ? this.COMBO_MULTIPLIER : 0;
  }

  /**
   * スコア状態取得
   */
  getScoreState() {
    return {
      base: this.baseScore,
      combo: this.comboBonus,
      time: this.timeBonus,
      total: this.totalScore,
      comboCount: this.comboCount,
      comboMultiplier: this.getComboMultiplier()
    };
  }

  /**
   * 経過時間取得（秒）
   */
  getElapsedTime() {
    return Math.floor((Date.now() - this.stageStartTime) / 1000);
  }

  /**
   * 残り時間取得（秒）
   */
  getRemainingTime() {
    const elapsed = this.getElapsedTime();
    return Math.max(0, this.STAGE_TIME_LIMIT - elapsed);
  }
}