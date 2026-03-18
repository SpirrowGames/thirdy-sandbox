/**
 * 攻撃システム - 3段攻撃とキャンセルウィンドウ管理
 */
export class AttackSystem {
  constructor() {
    this.currentAttack = 0; // 0=待機, 1-3=攻撃段階
    this.attackTimer = 0;
    this.canCancel = false;
    this.cancelWindow = 0;
    
    // 攻撃データ
    this.ATTACK_DATA = {
      1: { 
        duration: 400,      // ms
        damage: 15,
        range: 80,
        cancelStart: 200,   // キャンセル可能開始時間
        cancelEnd: 350      // キャンセル可能終了時間
      },
      2: { 
        duration: 450,
        damage: 18,
        range: 90,
        cancelStart: 220,
        cancelEnd: 380
      },
      3: { 
        duration: 600,      // フィニッシャーは長め
        damage: 25,
        range: 100,
        cancelStart: -1,    // キャンセル不可
        cancelEnd: -1
      }
    };
  }

  /**
   * 攻撃開始を試行
   * @param {boolean} inputPressed - 攻撃ボタンが押されたか
   * @returns {Object|null} 攻撃データまたはnull
   */
  tryAttack(inputPressed) {
    if (!inputPressed) return null;

    // 待機状態からの攻撃開始
    if (this.currentAttack === 0) {
      return this.startAttack(1);
    }

    // キャンセル可能な状況でのコンボ継続
    if (this.canCancel && this.currentAttack < 3) {
      return this.startAttack(this.currentAttack + 1);
    }

    return null;
  }

  /**
   * 指定段階の攻撃を開始
   * @param {number} attackLevel - 攻撃段階（1-3）
   * @returns {Object} 攻撃データ
   */
  startAttack(attackLevel) {
    this.currentAttack = attackLevel;
    this.attackTimer = 0;
    this.canCancel = false;
    this.cancelWindow = 0;

    const data = this.ATTACK_DATA[attackLevel];
    return {
      level: attackLevel,
      damage: data.damage,
      range: data.range,
      duration: data.duration,
      isFinisher: attackLevel === 3
    };
  }

  /**
   * フレーム更新
   * @param {number} delta - フレーム時間（ms）
   * @returns {boolean} 攻撃が完了した場合true
   */
  update(delta) {
    if (this.currentAttack === 0) return false;

    this.attackTimer += delta;
    const data = this.ATTACK_DATA[this.currentAttack];

    // キャンセルウィンドウの更新
    if (data.cancelStart >= 0) {
      this.canCancel = (
        this.attackTimer >= data.cancelStart && 
        this.attackTimer <= data.cancelEnd
      );
    }

    // 攻撃完了判定
    if (this.attackTimer >= data.duration) {
      this.currentAttack = 0;
      this.attackTimer = 0;
      this.canCancel = false;
      return true;
    }

    return false;
  }

  /**
   * 攻撃を強制終了（被弾時など）
   */
  interrupt() {
    this.currentAttack = 0;
    this.attackTimer = 0;
    this.canCancel = false;
    this.cancelWindow = 0;
  }

  /**
   * 現在の攻撃状態を取得
   * @returns {Object} 攻撃状態
   */
  getState() {
    return {
      attacking: this.currentAttack > 0,
      level: this.currentAttack,
      canCancel: this.canCancel,
      progress: this.currentAttack > 0 ? 
        this.attackTimer / this.ATTACK_DATA[this.currentAttack].duration : 0
    };
  }
}