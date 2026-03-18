export class BaseEntity {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y;
    this.displayY = y;
    
    // ステータス
    this.hp = config.hp || 100;
    this.maxHp = config.maxHp || this.hp;
    this.alive = true;
    
    // ダメージ関連
    this.invincible = false;
    this.invincibleTimer = 0;
    this.knockbackVelocity = { x: 0, y: 0 };
    this.knockbackDuration = 0;
    
    // 定数
    this.INVINCIBLE_DURATION = 500; // ms
    this.KNOCKBACK_DECAY = 0.9;
  }

  /**
   * ダメージを受ける処理
   * @param {number} amount - ダメージ量
   * @param {Object} options - オプション設定
   * @param {number} options.sourceX - 攻撃元のX座標（ノックバック方向計算用）
   * @param {number} options.knockbackForce - ノックバック力
   * @param {string} options.weaponType - 武器タイプ（ボス弱点システム用）
   * @param {boolean} options.ignoreInvincible - 無敵時間を無視するか
   */
  takeDamage(amount, options = {}) {
    // 無敵時間中は無視（オプションで強制可能）
    if (this.invincible && !options.ignoreInvincible) {
      return false;
    }

    // HP減少
    this.hp = Math.max(0, this.hp - amount);
    
    // 無敵時間設定
    this.setInvincible(this.INVINCIBLE_DURATION);
    
    // ノックバック処理
    if (options.sourceX !== undefined && options.knockbackForce > 0) {
      this.applyKnockback(options.sourceX, options.knockbackForce);
    }
    
    // 被ダメージ演出
    this.playDamageEffect();
    
    // ヒットストップ
    this.scene.applyHitStop(80); // 80ms
    
    // 死亡判定
    if (this.hp <= 0) {
      this.onDeath();
    }
    
    // イベント発火
    this.scene.events.emit('entityDamaged', {
      entity: this,
      damage: amount,
      remaining: this.hp
    });
    
    return true;
  }

  /**
   * 無敵時間を設定
   * @param {number} duration - 無敵時間（ms）
   */
  setInvincible(duration) {
    this.invincible = true;
    this.invincibleTimer = duration;
  }

  /**
   * ノックバックを適用
   * @param {number} sourceX - 攻撃元のX座標
   * @param {number} force - ノックバック力
   */
  applyKnockback(sourceX, force) {
    const direction = this.x > sourceX ? 1 : -1;
    this.knockbackVelocity.x = direction * force;
    this.knockbackDuration = 200; // ms
    
    // 物理ボディがある場合は即座に適用
    if (this.sprite && this.sprite.body) {
      this.sprite.body.setVelocityX(this.knockbackVelocity.x);
    }
  }

  /**
   * 被ダメージ演出
   */
  playDamageEffect() {
    if (!this.sprite) return;
    
    // 点滅エフェクト
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite) {
        this.sprite.clearTint();
      }
    });
    
    // 無敵時間中の点滅
    if (this.invincible) {
      this.startInvincibleFlash();
    }
  }

  /**
   * 無敵時間中の点滅演出
   */
  startInvincibleFlash() {
    if (!this.sprite || !this.invincible) return;
    
    const flashInterval = 100; // ms
    const flash = () => {
      if (!this.invincible || !this.sprite) return;
      
      this.sprite.alpha = this.sprite.alpha === 1 ? 0.5 : 1;
      this.scene.time.delayedCall(flashInterval, flash);
    };
    
    flash();
  }

  /**
   * 死亡時の処理
   */
  onDeath() {
    this.alive = false;
    // 子クラスでオーバーライド
  }

  /**
   * 更新処理（毎フレーム呼び出し）
   * @param {number} time - 経過時間
   * @param {number} delta - フレーム間隔
   */
  update(time, delta) {
    // 無敵時間の更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        if (this.sprite) {
          this.sprite.alpha = 1;
        }
      }
    }
    
    // ノックバック処理
    if (this.knockbackDuration > 0) {
      this.knockbackDuration -= delta;
      
      if (this.knockbackDuration <= 0) {
        // ノックバック終了
        this.knockbackVelocity.x = 0;
        if (this.sprite && this.sprite.body) {
          this.sprite.body.setVelocityX(0);
        }
      } else {
        // ノックバック減衰
        this.knockbackVelocity.x *= this.KNOCKBACK_DECAY;
        if (this.sprite && this.sprite.body) {
          this.sprite.body.setVelocityX(this.knockbackVelocity.x);
        }
      }
    }
  }
}