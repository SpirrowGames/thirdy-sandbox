/**
 * 全エンティティの基底クラス
 * ダメージシステムの共通インターフェースを提供
 */
export class BaseEntity {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y;
    this.displayY = y;
    
    // ダメージシステム関連
    this.hp = 100;
    this.maxHp = 100;
    this.alive = true;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.knockbackVelocity = { x: 0, y: 0 };
    this.knockbackTimer = 0;
    
    // 定数
    this.INVINCIBLE_DURATION = 500; // ms
    this.KNOCKBACK_DURATION = 200; // ms
    this.KNOCKBACK_FRICTION = 0.9;
  }

  /**
   * ダメージを受ける処理
   * @param {number} amount - ダメージ量
   * @param {Object} options - オプション
   * @param {number} options.sourceX - 攻撃元のX座標（ノックバック方向計算用）
   * @param {string} options.weaponType - 武器タイプ（弱点判定用）
   * @param {boolean} options.ignoreInvincible - 無敵フレームを無視するか
   */
  takeDamage(amount, options = {}) {
    // 無敵フレーム中はダメージを受けない
    if (this.invincible && !options.ignoreInvincible) {
      return false;
    }

    // 死亡済みの場合は処理しない
    if (!this.alive || this.hp <= 0) {
      return false;
    }

    // 弱点システム（サブクラスでオーバーライド可能）
    const finalDamage = this.calculateDamage(amount, options.weaponType);
    
    // HPを減算
    this.hp = Math.max(0, this.hp - finalDamage);

    // ノックバック処理
    if (options.sourceX !== undefined) {
      this.applyKnockback(options.sourceX);
    }

    // 無敵フレーム開始
    this.startInvincibility();

    // ヒットエフェクト
    this.playHitEffect();

    // 死亡判定
    if (this.hp <= 0) {
      this.onDeath();
    } else {
      this.onHurt();
    }

    return true;
  }

  /**
   * ダメージ計算（サブクラスでオーバーライド可能）
   */
  calculateDamage(baseDamage, weaponType) {
    return baseDamage;
  }

  /**
   * ノックバック処理
   */
  applyKnockback(sourceX) {
    if (!this.body) return;

    const direction = this.x > sourceX ? 1 : -1;
    const knockbackForce = 300; // px/s
    
    this.knockbackVelocity.x = direction * knockbackForce;
    this.knockbackTimer = this.KNOCKBACK_DURATION;
    
    // 物理ボディに速度を適用
    this.body.setVelocityX(this.knockbackVelocity.x);
  }

  /**
   * 無敵フレーム開始
   */
  startInvincibility() {
    this.invincible = true;
    this.invincibleTimer = this.INVINCIBLE_DURATION;
    
    // 点滅エフェクト
    this.startBlinkEffect();
  }

  /**
   * 点滅エフェクト
   */
  startBlinkEffect() {
    if (!this.sprite) return;

    // 点滅パターン: 100ms間隔で透明度を切り替え
    this.blinkTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(this.INVINCIBLE_DURATION / 200) - 1,
      onComplete: () => {
        this.sprite.alpha = 1.0;
      }
    });
  }

  /**
   * ヒットエフェクト再生
   */
  playHitEffect() {
    // 画面フラッシュ（軽微）
    this.scene.cameras.main.flash(50, 255, 255, 255, false, 0.3);
    
    // パーティクルエフェクト（将来実装）
    // this.scene.hitParticles.emitParticleAt(this.x, this.y);
    
    // SE再生（将来実装）
    // this.scene.sound.play('hit_sound');
  }

  /**
   * 被ダメージ時の処理（サブクラスでオーバーライド）
   */
  onHurt() {
    // デフォルトでは何もしない
  }

  /**
   * 死亡時の処理（サブクラスでオーバーライド）
   */
  onDeath() {
    this.alive = false;
    this.destroy();
  }

  /**
   * フレーム更新処理
   */
  update(time, delta) {
    // 無敵フレーム管理
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleTimer = 0;
        
        // 点滅エフェクト停止
        if (this.blinkTween) {
          this.blinkTween.stop();
          if (this.sprite) this.sprite.alpha = 1.0;
        }
      }
    }

    // ノックバック管理
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      
      if (this.knockbackTimer <= 0) {
        // ノックバック終了
        this.knockbackTimer = 0;
        this.knockbackVelocity.x = 0;
        if (this.body) {
          this.body.setVelocityX(0);
        }
      } else {
        // ノックバック減衰
        this.knockbackVelocity.x *= this.KNOCKBACK_FRICTION;
        if (this.body) {
          this.body.setVelocityX(this.knockbackVelocity.x);
        }
      }
    }
  }

  /**
   * エンティティ破棄
   */
  destroy() {
    if (this.blinkTween) {
      this.blinkTween.stop();
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.body) {
      this.body.destroy();
    }
  }
}