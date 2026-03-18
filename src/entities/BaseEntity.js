export class BaseEntity {
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = options.groundY || y;
    
    // HP関連
    this.maxHp = options.maxHp || 100;
    this.hp = this.maxHp;
    this.alive = true;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 500; // ms
    
    // ノックバック
    this.knockbackVelocity = { x: 0, y: 0 };
    this.knockbackDecay = 0.9;
    
    // 状態
    this.state = 'idle';
    this.previousState = 'idle';
  }

  /**
   * ダメージ処理
   * @param {number} damage ダメージ量
   * @param {number} sourceX 攻撃者のX座標
   * @param {Object} options オプション
   */
  takeDamage(damage, sourceX, options = {}) {
    if (this.invincible || !this.alive) return false;

    // HP減少
    this.hp -= damage;
    
    // 死亡判定
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true;
    }
    
    // ノックバック処理
    this.applyKnockback(sourceX, options.knockbackForce || 300);
    
    // 無敵フレーム開始
    this.startInvincibility();
    
    // 状態変更
    this.changeState('hurt');
    
    // ヒット音再生
    if (this.scene.sound) {
      this.scene.sound.play('hit', { volume: 0.3 });
    }
    
    return true;
  }

  /**
   * ノックバック適用
   * @param {number} sourceX 攻撃者のX座標
   * @param {number} force ノックバック力
   */
  applyKnockback(sourceX, force) {
    const direction = this.x > sourceX ? 1 : -1;
    this.knockbackVelocity.x = direction * force;
    
    // 物理ボディがある場合はvelocityを設定
    if (this.body) {
      this.body.setVelocityX(this.knockbackVelocity.x);
    }
  }

  /**
   * 無敵フレーム開始
   */
  startInvincibility() {
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    
    // 点滅エフェクト
    this.startBlinkEffect();
  }

  /**
   * 点滅エフェクト
   */
  startBlinkEffect() {
    if (!this.sprite) return;
    
    const blinkTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(this.invincibleDuration / 200),
      onComplete: () => {
        this.sprite.alpha = 1;
      }
    });
  }

  /**
   * 状態変更
   */
  changeState(newState) {
    if (this.state === newState) return;
    
    this.previousState = this.state;
    this.state = newState;
    this.onStateChange(newState, this.previousState);
  }

  /**
   * 状態変更時の処理（オーバーライド用）
   */
  onStateChange(newState, oldState) {
    // サブクラスで実装
  }

  /**
   * 死亡処理
   */
  die() {
    this.alive = false;
    this.changeState('dead');
    
    // 死亡エフェクト
    this.createDeathEffect();
    
    // スコア加算通知
    this.scene.events.emit('enemyKilled', {
      type: this.type,
      x: this.x,
      y: this.y
    });
  }

  /**
   * 死亡エフェクト
   */
  createDeathEffect() {
    if (!this.sprite) return;
    
    // 爆発エフェクト
    const explosion = this.scene.add.particles(this.x, this.y, 'smoke', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 12
    });
    
    // スプライトフェードアウト
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
    
    // エフェクト削除
    this.scene.time.delayedCall(600, () => {
      explosion.destroy();
    });
  }

  /**
   * 更新処理
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
    
    // ノックバック減衰
    if (Math.abs(this.knockbackVelocity.x) > 5) {
      this.knockbackVelocity.x *= this.knockbackDecay;
      if (this.body) {
        this.body.setVelocityX(this.knockbackVelocity.x);
      }
    } else {
      this.knockbackVelocity.x = 0;
    }
    
    // hurt状態から自動復帰
    if (this.state === 'hurt' && this.invincibleTimer <= this.invincibleDuration * 0.7) {
      this.changeState('idle');
    }
  }

  /**
   * エンティティ破棄
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.body) {
      this.body.destroy();
    }
  }
}