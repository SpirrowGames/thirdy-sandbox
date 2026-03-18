export class ComboSystem {
  constructor() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET_TIME = 1500; // ms
    this.lastHitTime = 0;
    this.isInCombo = false;
  }

  /**
   * コンボを開始または継続する
   */
  startCombo() {
    this.isInCombo = true;
    this.lastHitTime = Date.now();
    this.comboTimer = this.COMBO_RESET_TIME;
  }

  /**
   * コンボカウントを増加させる
   */
  incrementCombo() {
    this.comboCount++;
    this.startCombo();
  }

  /**
   * コンボをリセットする
   */
  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.isInCombo = false;
  }

  /**
   * フレーム毎の更新処理
   * @param {number} deltaTime - フレーム間の経過時間（ms）
   */
  update(deltaTime) {
    if (this.isInCombo) {
      this.comboTimer -= deltaTime;
      
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }

  /**
   * 現在のコンボ状態を取得
   */
  getComboState() {
    return {
      count: this.comboCount,
      isActive: this.isInCombo,
      timeRemaining: this.comboTimer
    };
  }
}