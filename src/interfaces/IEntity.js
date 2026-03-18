/**
 * 全エンティティが実装すべき共通インターフェース
 * プレイヤー、敵、ボス、武器などすべてのゲームオブジェクトの基底仕様
 */
export class IEntity {
  constructor(x = 0, y = 0, groundY = null) {
    this.x = x;                    // X座標
    this.y = y;                    // 表示Y座標（ジャンプ時変動）
    this.groundY = groundY ?? y;   // 判定用Y座標（固定、奥行き判定に使用）
    this.hp = 100;                 // ヒットポイント
    this.maxHp = 100;              // 最大HP
    this.alive = true;             // 生存フラグ
    this.invincible = false;       // 無敵フラグ
    this.invincibleTimer = 0;      // 無敵時間カウンタ
  }

  /**
   * 毎フレーム更新処理
   * @param {number} time - ゲーム開始からの経過時間（ms）
   * @param {number} delta - 前フレームからの経過時間（ms）
   */
  update(time, delta) {
    // 無敵時間の更新
    if (this.invincible && this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
  }

  /**
   * ダメージを受ける処理
   * @param {number} amount - ダメージ量
   * @param {Object} knockback - ノックバック情報 {x: number, y: number}
   * @param {string} damageType - ダメージタイプ（物理、炎、電気など）
   */
  takeDamage(amount, knockback = null, damageType = 'physical') {
    if (!this.alive || this.invincible) {
      return false; // ダメージ無効
    }

    // ダメージ計算（サブクラスでオーバーライド可能）
    const actualDamage = this.calculateDamage(amount, damageType);
    
    this.hp = Math.max(0, this.hp - actualDamage);
    
    // ノックバック処理
    if (knockback) {
      this.applyKnockback(knockback);
    }

    // 死亡判定
    if (this.hp <= 0) {
      this.onDeath();
    } else {
      this.onDamaged(actualDamage);
    }

    return true; // ダメージ成功
  }

  /**
   * ダメージ計算（サブクラスでオーバーライド可能）
   * @param {number} amount - 基礎ダメージ
   * @param {string} damageType - ダメージタイプ
   * @returns {number} 実際のダメージ量
   */
  calculateDamage(amount, damageType) {
    return amount; // デフォルトはそのまま
  }

  /**
   * ノックバック適用（サブクラスでオーバーライド）
   * @param {Object} knockback - {x: number, y: number}
   */
  applyKnockback(knockback) {
    // デフォルト実装は空（物理エンジン依存のため）
  }

  /**
   * ダメージを受けた時の処理（サブクラスでオーバーライド）
   * @param {number} damage - 受けたダメージ量
   */
  onDamaged(damage) {
    // 無敵時間設定（デフォルト200ms）
    this.setInvincible(200);
  }

  /**
   * 死亡時の処理
   */
  onDeath() {
    this.alive = false;
    this.onDestroy();
  }

  /**
   * 無敵状態設定
   * @param {number} duration - 無敵時間（ms）
   */
  setInvincible(duration) {
    this.invincible = true;
    this.invincibleTimer = duration;
  }

  /**
   * HP回復
   * @param {number} amount - 回復量
   */
  heal(amount) {
    if (!this.alive) return;
    
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * HP比率取得
   * @returns {number} HP比率（0.0〜1.0）
   */
  getHpRatio() {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }

  /**
   * 奥行き判定用の距離計算
   * @param {IEntity} other - 比較対象
   * @returns {number} 奥行き距離
   */
  getDepthDistance(other) {
    return Math.abs(this.groundY - other.groundY);
  }

  /**
   * 奥行きが一致しているか判定
   * @param {IEntity} other - 比較対象
   * @param {number} threshold - 判定閾値（デフォルト40px）
   * @returns {boolean} 奥行きが一致しているか
   */
  isDepthAligned(other, threshold = 40) {
    return this.getDepthDistance(other) < threshold;
  }

  /**
   * エンティティ破棄処理（サブクラスでオーバーライド）
   */
  onDestroy() {
    // サブクラスでスプライト破棄などを実装
  }

  /**
   * エンティティ破棄（外部から呼び出し）
   */
  destroy() {
    this.alive = false;
    this.onDestroy();
  }

  /**
   * 座標設定
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} groundY - 判定用Y座標（省略時はyと同じ）
   */
  setPosition(x, y, groundY = null) {
    this.x = x;
    this.y = y;
    if (groundY !== null) {
      this.groundY = groundY;
    }
  }

  /**
   * デバッグ情報取得
   * @returns {Object} デバッグ情報
   */
  getDebugInfo() {
    return {
      x: this.x,
      y: this.y,
      groundY: this.groundY,
      hp: this.hp,
      maxHp: this.maxHp,
      alive: this.alive,
      invincible: this.invincible,
      invincibleTimer: this.invincibleTimer
    };
  }
}