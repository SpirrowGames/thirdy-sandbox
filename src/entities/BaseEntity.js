/**
 * エンティティの基底クラス
 * IEntityインターフェースの共通実装を提供
 */
export class BaseEntity {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    
    // 位置情報
    this._x = x;
    this._y = y;
    this._groundY = y; // デフォルトでは表示Yと同じ
    
    // ステータス
    this.hp = config.hp || 100;
    this.maxHp = this.hp;
    this.alive = true;
    
    // Phaserスプライト（サブクラスで設定）
    this.sprite = null;
    this.hitbox = null;
    
    // 状態管理
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // ノックバック
    this.knockbackVelocity = { x: 0, y: 0 };
    this.knockbackDuration = 0;
  }
  
  // プロパティアクセサ（位置同期）
  get x() { return this._x; }
  set x(value) {
    this._x = value;
    if (this.sprite) this.sprite.x = value;
    if (this.hitbox) this.hitbox.x = value;
  }
  
  get y() { return this._y; }
  set y(value) {
    this._y = value;
    if (this.sprite) this.sprite.y = value;
  }
  
  get groundY() { return this._groundY; }
  set groundY(value) {
    this._groundY = value;
    if (this.hitbox) this.hitbox.y = value;
  }
  
  /**
   * 毎フレーム更新（サブクラスでオーバーライド）
   */
  update(time, delta) {
    if (!this.alive) return;
    
    // 無敵時間の更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        if (this.sprite) this.sprite.setAlpha(1);
      } else {
        // 点滅エフェクト
        if (this.sprite) {
          this.sprite.setAlpha(Math.sin(time * 0.02) * 0.5 + 0.5);
        }
      }
    }
    
    // ノックバック処理
    if (this.knockbackDuration > 0) {
      this.x += this.knockbackVelocity.x * delta * 0.001;
      this.groundY += this.knockbackVelocity.y * delta * 0.001;
      this.knockbackDuration -= delta;
      
      if (this.knockbackDuration <= 0) {
        this.knockbackVelocity = { x: 0, y: 0 };
      }
    }
    
    // サブクラス固有の更新処理
    this.updateEntity(time, delta);
  }
  
  /**
   * サブクラスで実装する更新処理
   */
  updateEntity(time, delta) {
    // サブクラスでオーバーライド
  }
  
  /**
   * ダメージを受ける
   */
  takeDamage(amount, knockback = null) {
    if (!this.alive || this.invincible) return false;
    
    this.hp = Math.max(0, this.hp - amount);
    
    // ノックバック適用
    if (knockback) {
      this.applyKnockback(knockback);
    }
    
    // 無敵時間設定
    this.setInvincible(300); // 300ms
    
    // HP0で死亡
    if (this.hp <= 0) {
      this.onDeath();
      return true; // 死亡した
    }
    
    // ダメージエフェクト
    this.onDamaged(amount);
    return false;
  }
  
  /**
   * ノックバック適用
   */
  applyKnockback(knockback) {
    this.knockbackVelocity = { ...knockback };
    this.knockbackDuration = 200; // 200ms
  }
  
  /**
   * 無敵状態設定
   */
  setInvincible(duration) {
    this.invincible = true;
    this.invincibleTimer = duration;
  }
  
  /**
   * 死亡処理
   */
  onDeath() {
    this.alive = false;
    this.onDeathEffect();
    
    // 少し遅延してから破棄
    this.scene.time.delayedCall(500, () => this.destroy());
  }
  
  /**
   * 死亡エフェクト（サブクラスでオーバーライド）
   */
  onDeathEffect() {
    if (this.sprite) {
      // フェードアウト
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 500,
        ease: 'Power2'
      });
    }
  }
  
  /**
   * ダメージエフェクト（サブクラスでオーバーライド）
   */
  onDamaged(amount) {
    if (this.sprite) {
      // 赤フラッシュ
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        if (this.sprite) this.sprite.clearTint();
      });
    }
  }
  
  /**
   * エンティティ破棄
   */
  destroy() {
    this.alive = false;
    
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }
    
    // サブクラス固有の破棄処理
    this.onDestroy();
  }
  
  /**
   * サブクラス固有の破棄処理
   */
  onDestroy() {
    // サブクラスでオーバーライド
  }
  
  /**
   * 奥行き判定用のヘルパー
   */
  isDepthAligned(other, threshold = 40) {
    return Math.abs(this.groundY - other.groundY) < threshold;
  }
  
  /**
   * 距離計算
   */
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.groundY - other.groundY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * X軸方向の距離
   */
  distanceXTo(other) {
    return Math.abs(this.x - other.x);
  }
}