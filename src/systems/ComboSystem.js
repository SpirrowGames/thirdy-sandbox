/**
 * コンボシステム - コンボカウント、タイマー、攻撃キャンセル管理
 */
export class ComboSystem {
  constructor() {
    this.count = 0;
    this.timer = 0;
    this.RESET_TIME = 1500; // ms - コンボリセット時間
    this.active = false;
  }

  /**
   * コンボカウントを増加
   * @param {number} increment - 増加量（デフォルト1）
   */
  addHit(increment = 1) {
    this.count += increment;
    this.timer = 0; // タイマーリセット
    this.active = true;
    return this.count;
  }

  /**
   * フレーム更新
   * @param {number} delta - フレーム時間（ms）
   * @returns {boolean} コンボがリセットされた場合true
   */
  update(delta) {
    if (!this.active) return false;

    this.timer += delta;
    
    if (this.timer >= this.RESET_TIME) {
      return this.reset();
    }
    return false;
  }

  /**
   * コンボを強制リセット（被弾時など）
   * @returns {boolean} リセットが実行された場合true
   */
  reset() {
    if (this.count === 0) return false;
    
    this.count = 0;
    this.timer = 0;
    this.active = false;
    return true;
  }

  /**
   * コンボ倍率を取得
   * @returns {number} スコア倍率
   */
  getMultiplier() {
    if (this.count < 3) return 1.0;
    if (this.count < 5) return 1.2;
    if (this.count < 10) return 1.5;
    return 2.0;
  }

  /**
   * 現在のコンボ状態を取得
   * @returns {Object} コンボ状態
   */
  getState() {
    return {
      count: this.count,
      multiplier: this.getMultiplier(),
      timeLeft: Math.max(0, this.RESET_TIME - this.timer),
      active: this.active
    };
  }
}