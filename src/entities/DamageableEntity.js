/**
 * ダメージを受けることができるエンティティの基底クラス
 * Player、Enemy、Bossが継承する
 */
export class DamageableEntity {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y;
    
    // ステータス
    this.hp = config.hp || 100;
    this.maxHp = config.maxHp || this.hp;
    this.alive = true;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = config.invincibleDuration || 500; // ms
    
    // ノックバック
    this.knockbackResistance = config.knockbackResistance || 1.0;
    this.isKnockedBack = false;
    this.knockbackTimer = 0;
    
    // ヒットストップ
    this.hitStopDuration = config.hitStopDuration || 80; // ms
    
    // ビジュアル効果用
    this.originalTint = 0xffffff;
    this.flashTween = null;
  }

  /**
   * ダメージを受ける
   * @param {number} amount - ダメージ量
   * @param {Object} options - オプション
   * @param {number} options.sourceX - 攻撃元のX座標（ノックバック方向計算用）
   * @param {number} options.knockbackForce - ノックバック力
   * @param {string} options.weaponType - 武器タイプ（弱点判定用）
   * @param {boolean} options.skipInvincible - 無敵フレーム無視
   */
  takeDamage(amount, options = {}) {
    // 無敵フレーム中はダメージ無効（スキップフラグがない場合）
    if (this.invincible && !options.skipInvincible) {
      return false;
    }

    // 死亡済みは処理しない
    if (!this.alive) {
      return false;
    }

    // ダメージ計算（サブクラスでオーバーライド可能）
    const finalDamage = this.calculateDamage(amount, options);
    
    // HP減算
    this.hp = Math.max(0, this.hp - finalDamage);
    
    // ヒットストップ実行
    this.scene.hitStop(this.hitStopDuration);
    
    // ノックバック処理
    if (options.sourceX !== undefined && options.knockbackForce > 0) {
      this.applyKnockback(options.sourceX, options.knockbackForce);
    }
    
    // 無敵フレーム開始
    this.startInvincible();
    
    // ヒットエフェクト
    this.playHitEffect();
    
    // HP0で死亡処理
    if (this.hp <= 0) {
      this.onDeath();
    } else {
      this.onHit(finalDamage, options);
    }
    
    // ダメージイベント発火
    this.scene.events.emit('entityDamaged', {
      entity: this,
      damage: finalDamage,
      remaining: this.hp,
      max: this.maxHp
    });
    
    return true;
  }

  /**
   * ダメージ量計算（サブクラスでオーバーライド可能）
   */
  calculateDamage(amount, options) {
    return amount;
  }

  /**
   * ノックバック適用
   */
  applyKnockback(sourceX, force) {
    if (this.isKnockedBack) return;
    
    const direction = this.x > sourceX ? 1 : -1;
    const knockbackVelocity = force * this.knockbackResistance * direction;
    
    // Phaser物理ボディにノックバック適用
    if (this.body) {
      this.body.setVelocityX(knockbackVelocity);
      this.isKnockedBack = true;
      this.knockbackTimer = 200; // ms
    }
  }

  /**
   * 無敵フレーム開始
   */
  startInvincible() {
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    
    // 点滅エフェクト
    this.startFlashEffect();
  }

  /**
   * 点滅エフェクト開始
   */
  startFlashEffect() {
    if (this.flashTween) {
      this.flashTween.destroy();
    }
    
    if (this.sprite) {
      this.flashTween = this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: Math.floor(this.invincibleDuration / 200) - 1,
        onComplete: () => {
          this.sprite.alpha = 1;
          this.flashTween = null;
        }
      });
    }
  }

  /**
   * ヒットエフェクト再生
   */
  playHitEffect() {
    // ヒット時の白フラッシュ
    if (this.sprite) {
      this.sprite.setTint(0xffffff);
      this.scene.time.delayedCall(50, () => {
        if (this.sprite) {
          this.sprite.setTint(this.originalTint);
        }
      });
    }
    
    // ヒットSE再生（実装時に追加）
    // this.scene.sound.play('hit_se');
  }

  /**
   * 被弾時の処理（サブクラスでオーバーライド）
   */
  onHit(damage, options) {
    // サブクラスで実装
  }

  /**
   * 死亡時の処理（サブクラスでオーバーライド）
   */
  onDeath() {
    this.alive = false;
    // サブクラスで実装
  }

  /**
   * フレーム更新
   */
  update(time, delta) {
    // 無敵フレーム更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }
    
    // ノックバック更新
    if (this.isKnockedBack) {
      this.knockbackTimer -= delta;
      if (this.knockbackTimer <= 0) {
        this.isKnockedBack = false;
        this.knockbackTimer = 0;
        if (this.body) {
          this.body.setVelocityX(0);
        }
      }
    }
  }

  /**
   * 強制回復（デバッグ用）
   */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    
    this.scene.events.emit('entityHealed', {
      entity: this,
      amount: amount,
      current: this.hp,
      max: this.maxHp
    });
  }

  /**
   * リソース解放
   */
  destroy() {
    if (this.flashTween) {
      this.flashTween.destroy();
      this.flashTween = null;
    }
  }
}