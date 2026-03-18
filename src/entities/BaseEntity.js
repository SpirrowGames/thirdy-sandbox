import { IEntity } from '../interfaces/IEntity.js';

/**
 * Phaserスプライトと連携するエンティティ基底クラス
 * IEntityの実装を提供し、Phaserの物理エンジンと統合する
 */
export class BaseEntity extends IEntity {
  constructor(scene, x, y, groundY = null, spriteKey = null) {
    super(x, y, groundY);
    
    this.scene = scene;
    this.sprite = null;
    this.hitbox = null;
    
    // スプライト生成
    if (spriteKey) {
      this.createSprite(spriteKey);
    }
  }

  /**
   * スプライト生成
   * @param {string} spriteKey - スプライトキー
   */
  createSprite(spriteKey) {
    this.sprite = this.scene.add.sprite(this.x, this.y, spriteKey);
    this.scene.physics.add.existing(this.sprite);
    
    // 当たり判定用の矩形（デバッグ時は可視化）
    this.hitbox = this.scene.add.rectangle(this.x, this.groundY, 48, 64, 0xff0000, 0);
    this.scene.physics.add.existing(this.hitbox);
    
    // デバッグモードでは当たり判定を可視化
    if (this.scene.game.config.physics.arcade.debug) {
      this.hitbox.setAlpha(0.3);
    }
  }

  /**
   * 毎フレーム更新
   */
  update(time, delta) {
    super.update(time, delta);
    
    // スプライトと当たり判定の位置同期
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    }
    
    if (this.hitbox) {
      this.hitbox.x = this.x;
      this.hitbox.y = this.groundY;
    }

    // 無敵時の点滅エフェクト
    if (this.invincible && this.sprite) {
      const alpha = Math.sin(time * 0.02) * 0.5 + 0.5;
      this.sprite.setAlpha(alpha);
    } else if (this.sprite) {
      this.sprite.setAlpha(1);
    }
  }

  /**
   * ノックバック適用
   */
  applyKnockback(knockback) {
    if (this.sprite && this.sprite.body) {
      this.sprite.body.setVelocity(knockback.x, 0); // Y軸ノックバックは奥行きに影響しないため0
      
      // 一定時間後に速度リセット
      this.scene.time.delayedCall(200, () => {
        if (this.sprite && this.sprite.body) {
          this.sprite.body.setVelocity(0, 0);
        }
      });
    }
  }

  /**
   * ダメージ時の処理
   */
  onDamaged(damage) {
    super.onDamaged(damage);
    
    // ダメージ表示エフェクト
    this.showDamageEffect(damage);
  }

  /**
   * ダメージ表示エフェクト
   */
  showDamageEffect(damage) {
    if (!this.scene) return;
    
    const damageText = this.scene.add.text(this.x, this.y - 30, `-${damage}`, {
      fontSize: '16px',
      fill: '#ff0000',
      fontStyle: 'bold'
    });
    
    // ダメージテキストのアニメーション
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  /**
   * 座標設定（スプライト同期）
   */
  setPosition(x, y, groundY = null) {
    super.setPosition(x, y, groundY);
    
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    }
    
    if (this.hitbox) {
      this.hitbox.x = this.x;
      this.hitbox.y = this.groundY;
    }
  }

  /**
   * エンティティ破棄
   */
  onDestroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }
  }

  /**
   * スプライトの向き設定
   * @param {boolean} facingRight - 右向きかどうか
   */
  setFacing(facingRight) {
    if (this.sprite) {
      this.sprite.setFlipX(!facingRight);
    }
  }

  /**
   * アニメーション再生
   * @param {string} animKey - アニメーションキー
   */
  playAnimation(animKey) {
    if (this.sprite && this.sprite.anims) {
      this.sprite.play(animKey);
    }
  }
}