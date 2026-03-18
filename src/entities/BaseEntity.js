import { Vector2 } from './Vector2.js';

/**
 * IEntityインターフェースの基底実装クラス
 * 共通的な機能を提供し、継承先での実装を簡素化する
 */
export class BaseEntity {
  constructor(x = 0, y = 0, type = 'unknown') {
    // 位置関連
    this.x = x;
    this.y = y;
    this.groundY = y; // 初期値はyと同じ
    
    // ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.alive = true;
    this.type = type;
    
    // 物理関連
    this.velocity = new Vector2(0, 0);
    this.facingRight = true;
    
    // 戦闘関連
    this.invincible = false;
    this.invincibleTimer = 0;
    this.knockbackTimer = 0;
    
    // Phaserスプライト参照（継承先で設定）
    this.sprite = null;
    this.hitbox = null;
  }

  /**
   * 基本更新処理
   * 継承先でオーバーライドして独自ロジックを追加
   */
  update(time, delta) {
    if (!this.alive) return;
    
    this.updateTimers(delta);
    this.updatePosition(delta);
    this.updateSprite();
  }

  /**
   * タイマー系の更新
   */
  updateTimers(delta) {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
    
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      if (this.knockbackTimer <= 0) {
        this.velocity.x *= 0.1; // ノックバック終了時に減速
      }
    }
  }

  /**
   * 位置更新処理
   */
  updatePosition(delta) {
    const deltaSeconds = delta / 1000;
    this.x += this.velocity.x * deltaSeconds;
    this.y += this.velocity.y * deltaSeconds;
    
    // 画面境界チェック（基本的な制限）
    this.x = Math.max(0, Math.min(this.x, 3000)); // ステージ幅
    this.groundY = Math.max(360, Math.min(this.groundY, 480)); // 奥行き制限
  }

  /**
   * Phaserスプライトの位置同期
   */
  updateSprite() {
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.sprite.setFlipX(!this.facingRight);
      
      // 無敵時の点滅演出
      if (this.invincible && Math.floor(Date.now() / 100) % 2) {
        this.sprite.setAlpha(0.5);
      } else {
        this.sprite.setAlpha(1.0);
      }
    }
    
    if (this.hitbox) {
      this.hitbox.x = this.x;
      this.hitbox.y = this.groundY; // 判定は常にgroundY
    }
  }

  /**
   * ダメージ処理の基本実装
   */
  takeDamage(amount, sourceX = null, knockback = 200) {
    if (!this.alive || this.invincible) return;
    
    this.hp -= amount;
    
    // ノックバック処理
    if (sourceX !== null) {
      const direction = this.x > sourceX ? 1 : -1;
      this.velocity.x = direction * knockback;
      this.knockbackTimer = 200; // 200ms
    }
    
    // 無敵時間設定
    this.invincible = true;
    this.invincibleTimer = 300; // 300ms
    
    // HP0で死亡
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  /**
   * 死亡処理
   */
  die() {
    this.alive = false;
    if (this.sprite) {
      this.sprite.setTint(0x888888); // グレーアウト
    }
  }

  /**
   * 奥行き判定用ヘルパー
   */
  isDepthAligned(other, threshold = 40) {
    return Math.abs(this.groundY - other.groundY) < threshold;
  }

  /**
   * X軸距離判定用ヘルパー
   */
  getDistanceX(other) {
    return Math.abs(this.x - other.x);
  }

  /**
   * 向き更新
   */
  updateFacing(targetX) {
    if (targetX !== undefined) {
      this.facingRight = targetX > this.x;
    }
  }

  /**
   * リソース解放
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
  }
}