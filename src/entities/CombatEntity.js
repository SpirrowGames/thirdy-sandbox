/**
 * 戦闘可能なエンティティの基底クラス
 */
export class CombatEntity {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y;
    this.displayY = y;

    // 基本ステータス
    this.maxHp = config.maxHp || 100;
    this.hp = this.maxHp;
    this.alive = true;
    this.facingRight = true;

    // 戦闘関連
    this.invincible = false;
    this.invincibleTimer = 0;
    this.knockbackTimer = 0;
    this.isKnockedBack = false;

    // 武器
    this.heldWeapon = null;
  }

  /**
   * ダメージを受ける
   * @param {number} damage - ダメージ量
   * @param {IEntity} source - ダメージ源
   */
  takeDamage(damage, source = null) {
    if (this.invincible || !this.alive) {
      return false;
    }

    this.hp -= damage;
    this.hp = Math.max(0, this.hp);

    // 無敵フレーム開始
    this.setInvincible(300);

    // HP0で死亡処理
    if (this.hp <= 0) {
      this.onDeath();
    } else {
      this.onHurt(source);
    }

    // HP変更イベント
    this.scene.events.emit(`${this.type}HpChange`, {
      current: this.hp,
      max: this.maxHp,
      entity: this
    });

    return true;
  }

  /**
   * 無敵状態を設定
   * @param {number} duration - 無敵時間（ms）
   */
  setInvincible(duration) {
    this.invincible = true;
    this.invincibleTimer = duration;

    // 点滅エフェクト
    if (this.sprite) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: Math.floor(duration / 200) - 1
      });
    }
  }

  /**
   * ノックバック状態を設定
   * @param {number} duration - ノックバック時間（ms）
   */
  setKnockback(duration) {
    this.isKnockedBack = true;
    this.knockbackTimer = duration;
  }

  /**
   * 無敵状態かどうか
   * @returns {boolean}
   */
  isInvincible() {
    return this.invincible;
  }

  /**
   * 攻撃実行
   * @param {Object} attackData - 攻撃データ
   */
  performAttack(attackData) {
    if (!this.alive || this.isKnockedBack) {
      return null;
    }

    // ヒットボックス作成
    const hitbox = this.scene.combatSystem.createHitbox(this, attackData);

    // 武器耐久度消費
    if (this.heldWeapon && attackData.consumeWeapon) {
      const broken = this.heldWeapon.use();
      if (broken) {
        this.dropWeapon();
      }
    }

    return hitbox;
  }

  /**
   * 武器装備
   * @param {Weapon} weapon 
   */
  equipWeapon(weapon) {
    if (this.heldWeapon) {
      this.dropWeapon();
    }
    this.heldWeapon = weapon;
    this.scene.events.emit('weaponEquipped', { entity: this, weapon });
  }

  /**
   * 武器破棄
   */
  dropWeapon() {
    if (this.heldWeapon) {
      // 武器オブジェクトを地面に落とす
      this.scene.spawnWeapon(this.heldWeapon.type, this.x, this.groundY);
      this.heldWeapon = null;
      this.scene.events.emit('weaponDropped', { entity: this });
    }
  }

  /**
   * 被弾時の処理
   * @param {IEntity} source - 攻撃者
   */
  onHurt(source) {
    // サブクラスでオーバーライド
  }

  /**
   * 死亡時の処理
   */
  onDeath() {
    this.alive = false;
    this.dropWeapon();
    this.scene.events.emit('entityDeath', { entity: this });
  }

  /**
   * 更新処理
   * @param {number} time 
   * @param {number} delta 
   */
  update(time, delta) {
    // 無敵フレーム更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        if (this.sprite) {
          this.sprite.setAlpha(1);
        }
      }
    }

    // ノックバック更新
    if (this.isKnockedBack) {
      this.knockbackTimer -= delta;
      if (this.knockbackTimer <= 0) {
        this.isKnockedBack = false;
      }
    }
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    this.alive = false;
  }
}