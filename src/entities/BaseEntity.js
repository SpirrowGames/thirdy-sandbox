/**
 * 全エンティティの基底クラス
 * IEntityインターフェースを実装し、共通プロパティとメソッドを提供
 */
export class BaseEntity {
  constructor(scene, x, y, texture, frame) {
    this.scene = scene;
    
    // 位置情報
    this.x = x;
    this.y = y;
    this.groundY = y; // 奥行き判定用Y座標（ジャンプ中も固定）
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.alive = true;
    
    // 移動関連
    this.speed = 100;
    this.facingRight = true;
    
    // Phaserスプライト（実装時は矩形、後でスプライトに変更）
    this.sprite = null;
    this.hitbox = null;
    
    // 状態管理
    this.state = 'idle';
    this.stateTimer = 0;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    this.INVINCIBLE_DURATION = 500; // ms
    
    // ノックバック
    this.knockbackVelocity = { x: 0, y: 0 };
    this.knockbackDuration = 0;
    
    this.createSprite(texture, frame);
  }
  
  /**
   * Phaserスプライトを作成
   * 開発初期は矩形、後でスプライトに変更可能
   */
  createSprite(texture = null, frame = null) {
    if (texture) {
      this.sprite = this.scene.add.sprite(this.x, this.y, texture, frame);
    } else {
      // 矩形ボックスで開始（デフォルト）
      this.sprite = this.scene.add.rectangle(this.x, this.y, 48, 64, 0x3399ff);
    }
    
    // 物理ボディを追加
    this.scene.physics.add.existing(this.sprite);
    this.hitbox = this.sprite.body;
    
    // 重力を無効化（ベルトスクロールは2D移動）
    this.hitbox.setGravityY(0);
    
    // 当たり判定サイズ設定
    this.hitbox.setSize(48, 64);
  }
  
  /**
   * 毎フレーム更新処理
   * サブクラスでオーバーライド必須
   */
  update(time, delta) {
    if (!this.alive) return;
    
    this.updateTimers(delta);
    this.updateKnockback(delta);
    this.updatePosition();
    
    // サブクラスの更新処理を呼び出し
    this.updateEntity(time, delta);
  }
  
  /**
   * サブクラス固有の更新処理
   * サブクラスでオーバーライド
   */
  updateEntity(time, delta) {
    // サブクラスで実装
  }
  
  /**
   * タイマー類の更新
   */
  updateTimers(delta) {
    this.stateTimer += delta;
    
    if (this.invincible) {
      this.invincibleTimer += delta;
      if (this.invincibleTimer >= this.INVINCIBLE_DURATION) {
        this.invincible = false;
        this.invincibleTimer = 0;
        this.sprite.setAlpha(1.0); // 点滅終了
      } else {
        // 点滅エフェクト
        const alpha = Math.sin(this.invincibleTimer * 0.02) > 0 ? 0.5 : 1.0;
        this.sprite.setAlpha(alpha);
      }
    }
  }
  
  /**
   * ノックバック処理の更新
   */
  updateKnockback(delta) {
    if (this.knockbackDuration > 0) {
      this.knockbackDuration -= delta;
      
      if (this.knockbackDuration <= 0) {
        this.knockbackVelocity = { x: 0, y: 0 };
        this.hitbox.setVelocity(0, 0);
      }
    }
  }
  
  /**
   * 位置情報の同期
   */
  updatePosition() {
    // スプライト位置を更新
    this.x = this.sprite.x;
    this.y = this.sprite.y;
    
    // Y座標の制限（奥行き範囲内に収める）
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    
    if (this.groundY < GROUND_Y_MIN) this.groundY = GROUND_Y_MIN;
    if (this.groundY > GROUND_Y_MAX) this.groundY = GROUND_Y_MAX;
    
    // 表示Y座標を groundY に合わせる（ジャンプ時は別途調整）
    this.sprite.y = this.groundY;
  }
  
  /**
   * ダメージを受ける
   */
  takeDamage(amount, knockback = null) {
    if (!this.alive || this.invincible) return false;
    
    this.hp -= amount;
    this.hp = Math.max(0, this.hp);
    
    // ノックバック適用
    if (knockback) {
      this.applyKnockback(knockback.x, knockback.y);
    }
    
    // 無敵フレーム開始
    this.invincible = true;
    this.invincibleTimer = 0;
    
    // 死亡判定
    if (this.hp <= 0) {
      this.onDeath();
      return true; // 死亡
    }
    
    this.onDamage(amount);
    return false; // 生存
  }
  
  /**
   * ノックバックを適用
   */
  applyKnockback(velocityX, velocityY = 0) {
    this.knockbackVelocity = { x: velocityX, y: velocityY };
    this.knockbackDuration = 200; // ms
    this.hitbox.setVelocity(velocityX, velocityY);
  }
  
  /**
   * ダメージ受信時の処理
   * サブクラスでオーバーライド可能
   */
  onDamage(amount) {
    // ヒットエフェクト、サウンド再生など
    console.log(`${this.constructor.name} took ${amount} damage`);
  }
  
  /**
   * 死亡時の処理
   */
  onDeath() {
    this.alive = false;
    this.state = 'dead';
    console.log(`${this.constructor.name} died`);
    
    // 死亡演出開始
    this.playDeathAnimation();
  }
  
  /**
   * 死亡アニメーション
   */
  playDeathAnimation() {
    // フェードアウト + 縮小
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 500,
      onComplete: () => this.destroy()
    });
  }
  
  /**
   * 状態変更
   */
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateTimer = 0;
      this.onStateChange(newState);
    }
  }
  
  /**
   * 状態変更時の処理
   * サブクラスでオーバーライド可能
   */
  onStateChange(newState) {
    console.log(`${this.constructor.name} state changed to: ${newState}`);
  }
  
  /**
   * 向きを設定
   */
  setFacing(right) {
    if (this.facingRight !== right) {
      this.facingRight = right;
      this.sprite.setFlipX(!right);
    }
  }
  
  /**
   * 他のエンティティとの距離を計算
   */
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.groundY - other.groundY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * 他のエンティティとの奥行き判定
   */
  isDepthAligned(other, threshold = 40) {
    return Math.abs(this.groundY - other.groundY) < threshold;
  }
  
  /**
   * エンティティを破棄
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
      this.hitbox = null;
    }
  }
  
  /**
   * デバッグ情報表示
   */
  getDebugInfo() {
    return {
      type: this.constructor.name,
      x: Math.round(this.x),
      y: Math.round(this.y),
      groundY: Math.round(this.groundY),
      hp: this.hp,
      state: this.state,
      alive: this.alive,
      invincible: this.invincible
    };
  }
}