/**
 * 戦闘システム - ダメージ処理、ヒットストップ、ノックバック等を管理
 */
export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.hitStopTimer = 0;
    this.isHitStopped = false;
  }

  /**
   * ヒットストップを実行
   * @param {number} duration - 停止時間（ms）
   */
  executeHitStop(duration = 80) {
    if (this.isHitStopped) return;

    this.isHitStopped = true;
    this.hitStopTimer = duration;

    // 物理エンジンを一時停止
    this.scene.physics.world.pause();
    
    // アニメーションも停止
    this.scene.anims.pauseAll();

    this.scene.time.delayedCall(duration, () => {
      this.isHitStopped = false;
      this.hitStopTimer = 0;
      this.scene.physics.world.resume();
      this.scene.anims.resumeAll();
    });
  }

  /**
   * 攻撃ヒット処理
   * @param {IEntity} attacker - 攻撃者
   * @param {IEntity} target - 被攻撃者
   * @param {Object} attackData - 攻撃データ
   */
  processHit(attacker, target, attackData) {
    const { damage, knockback = 200, hitStopDuration = 80 } = attackData;

    // 無敵状態チェック
    if (target.isInvincible()) {
      return false;
    }

    // 奥行き判定
    if (!this.isDepthAligned(attacker, target)) {
      return false;
    }

    // ダメージ適用
    const actualDamage = this.calculateDamage(damage, attacker, target);
    target.takeDamage(actualDamage, attacker);

    // ノックバック適用
    this.applyKnockback(target, attacker, knockback);

    // ヒットストップ実行
    this.executeHitStop(hitStopDuration);

    // ヒットエフェクト
    this.createHitEffect(target.x, target.y);

    // イベント通知
    this.scene.events.emit('entityHit', {
      attacker: attacker,
      target: target,
      damage: actualDamage
    });

    return true;
  }

  /**
   * ダメージ計算
   * @param {number} baseDamage - 基本ダメージ
   * @param {IEntity} attacker - 攻撃者
   * @param {IEntity} target - 被攻撃者
   * @returns {number} 実際のダメージ
   */
  calculateDamage(baseDamage, attacker, target) {
    let damage = baseDamage;

    // 武器補正
    if (attacker.heldWeapon) {
      damage += attacker.heldWeapon.damage;
      
      // ボス弱点チェック
      if (target.type === 'boss' && attacker.heldWeapon.bossWeakness) {
        damage *= 1.5;
        this.scene.events.emit('weaknessHit', { target, weapon: attacker.heldWeapon });
      }
    }

    // コンボ補正（プレイヤーのみ）
    if (attacker.type === 'player' && attacker.comboCount > 0) {
      const comboMultiplier = 1 + (attacker.comboCount * 0.1);
      damage *= comboMultiplier;
    }

    return Math.floor(damage);
  }

  /**
   * ノックバック適用
   * @param {IEntity} target - 対象
   * @param {IEntity} source - 攻撃元
   * @param {number} force - ノックバック力
   */
  applyKnockback(target, source, force) {
    const direction = target.x > source.x ? 1 : -1;
    const knockbackX = direction * force;

    // 物理ボディに力を適用
    if (target.body) {
      target.body.setVelocityX(knockbackX);
      
      // 一定時間後に速度をリセット
      this.scene.time.delayedCall(200, () => {
        if (target.body) {
          target.body.setVelocityX(0);
        }
      });
    }

    // ノックバック状態を設定
    target.setKnockback(200);
  }

  /**
   * 奥行き判定
   * @param {IEntity} entity1 
   * @param {IEntity} entity2 
   * @returns {boolean}
   */
  isDepthAligned(entity1, entity2) {
    const DEPTH_THRESHOLD = 40;
    return Math.abs(entity1.groundY - entity2.groundY) < DEPTH_THRESHOLD;
  }

  /**
   * ヒットエフェクト生成
   * @param {number} x 
   * @param {number} y 
   */
  createHitEffect(x, y) {
    // パーティクルエフェクト作成（後で実装）
    const effect = this.scene.add.circle(x, y, 20, 0xffff00, 0.8);
    
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 150,
      onComplete: () => effect.destroy()
    });
  }

  /**
   * 攻撃ヒットボックス作成
   * @param {IEntity} owner - 攻撃者
   * @param {Object} attackData - 攻撃データ
   * @returns {Phaser.GameObjects.Image} ヒットボックス
   */
  createHitbox(owner, attackData) {
    const { range, duration = 100, offsetX = 0, offsetY = 0 } = attackData;
    const direction = owner.facingRight ? 1 : -1;
    
    const hitboxX = owner.x + (direction * range * 0.5) + offsetX;
    const hitboxY = owner.groundY + offsetY;

    const hitbox = this.scene.physics.add.image(hitboxX, hitboxY, '__WHITE');
    hitbox.setSize(range, 40); // DEPTH_THRESHOLD * 2
    hitbox.setVisible(false);
    hitbox.setActive(true);

    // 自動破棄
    this.scene.time.delayedCall(duration, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });

    return hitbox;
  }

  update(time, delta) {
    // ヒットストップ中の処理
    if (this.isHitStopped) {
      this.hitStopTimer -= delta;
      if (this.hitStopTimer <= 0) {
        this.isHitStopped = false;
        this.scene.physics.world.resume();
        this.scene.anims.resumeAll();
      }
    }
  }
}