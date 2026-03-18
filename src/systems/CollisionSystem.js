export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
    this.physics = scene.physics;
    
    // 衝突判定グループ
    this.playerGroup = scene.physics.add.group();
    this.enemyGroup = scene.physics.add.group();
    this.weaponGroup = scene.physics.add.group();
    this.playerAttackGroup = scene.physics.add.group();
    this.enemyAttackGroup = scene.physics.add.group();
    
    // 定数
    this.DEPTH_THRESHOLD = 40;
    
    this.setupCollisionHandlers();
  }

  setupCollisionHandlers() {
    // プレイヤー攻撃 vs 敵
    this.physics.add.overlap(
      this.playerAttackGroup,
      this.enemyGroup,
      this.handlePlayerAttackHit.bind(this)
    );

    // 敵攻撃 vs プレイヤー
    this.physics.add.overlap(
      this.enemyAttackGroup,
      this.playerGroup,
      this.handleEnemyAttackHit.bind(this)
    );

    // プレイヤー vs 武器（拾得）
    this.physics.add.overlap(
      this.playerGroup,
      this.weaponGroup,
      this.handleWeaponPickup.bind(this)
    );
  }

  /**
   * 攻撃ヒットボックスを一時的に生成
   * @param {Object} attacker - 攻撃者エンティティ
   * @param {Object} attackData - 攻撃データ { damage, range, duration, type }
   * @returns {Phaser.Physics.Arcade.Image} 生成されたヒットボックス
   */
  createAttackHitbox(attacker, attackData) {
    const { damage, range, duration = 100, type = 'normal' } = attackData;
    const direction = attacker.facingRight ? 1 : -1;
    
    // ヒットボックスの位置計算
    const hitboxX = attacker.x + (direction * range * 0.5);
    const hitboxY = attacker.groundY;
    
    // 一時的なヒットボックス生成（不可視）
    const hitbox = this.physics.add.image(hitboxX, hitboxY, '__WHITE');
    hitbox.setSize(range, this.DEPTH_THRESHOLD * 2);
    hitbox.setVisible(false);
    hitbox.setAlpha(0);
    
    // 攻撃データを保存
    hitbox.attackData = {
      damage,
      attacker,
      type,
      hitTargets: new Set() // 多段ヒット防止用
    };

    // 適切なグループに追加
    if (attacker.isPlayer) {
      this.playerAttackGroup.add(hitbox);
    } else {
      this.enemyAttackGroup.add(hitbox);
    }

    // 指定時間後に破棄
    this.scene.time.delayedCall(duration, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });

    return hitbox;
  }

  /**
   * 奥行き判定（Y軸）
   * @param {Object} entity1 - エンティティ1
   * @param {Object} entity2 - エンティティ2
   * @returns {boolean} 奥行きが合っているかどうか
   */
  isDepthAligned(entity1, entity2) {
    const y1 = entity1.groundY || entity1.y;
    const y2 = entity2.groundY || entity2.y;
    return Math.abs(y1 - y2) < this.DEPTH_THRESHOLD;
  }

  /**
   * プレイヤー攻撃ヒット処理
   * @param {Phaser.Physics.Arcade.Image} hitbox - 攻撃ヒットボックス
   * @param {Object} enemy - 敵エンティティ
   */
  handlePlayerAttackHit(hitbox, enemy) {
    const { attackData } = hitbox;
    const { attacker, damage, type, hitTargets } = attackData;

    // 既にヒット済みの場合はスキップ（多段ヒット防止）
    if (hitTargets.has(enemy)) return;

    // 奥行き判定
    if (!this.isDepthAligned(attacker, enemy)) return;

    // 敵が無敵状態の場合はスキップ
    if (enemy.invincible) return;

    // ヒット処理
    hitTargets.add(enemy);
    this.processHit(attacker, enemy, damage, type);
  }

  /**
   * 敵攻撃ヒット処理
   * @param {Phaser.Physics.Arcade.Image} hitbox - 攻撃ヒットボックス
   * @param {Object} player - プレイヤーエンティティ
   */
  handleEnemyAttackHit(hitbox, player) {
    const { attackData } = hitbox;
    const { attacker, damage, type, hitTargets } = attackData;

    // 既にヒット済みの場合はスキップ
    if (hitTargets.has(player)) return;

    // 奥行き判定
    if (!this.isDepthAligned(attacker, player)) return;

    // プレイヤーが無敵状態の場合はスキップ
    if (player.invincible) return;

    // ヒット処理
    hitTargets.add(player);
    this.processHit(attacker, player, damage, type);
  }

  /**
   * 武器拾得処理
   * @param {Object} player - プレイヤーエンティティ
   * @param {Object} weapon - 武器エンティティ
   */
  handleWeaponPickup(player, weapon) {
    // 奥行き判定
    if (!this.isDepthAligned(player, weapon)) return;

    // プレイヤーが武器を拾得
    if (player.pickupWeapon) {
      player.pickupWeapon(weapon);
      weapon.destroy();
    }
  }

  /**
   * ヒット処理の実行
   * @param {Object} attacker - 攻撃者
   * @param {Object} target - 被攻撃者
   * @param {number} damage - ダメージ量
   * @param {string} type - 攻撃タイプ
   */
  processHit(attacker, target, damage, type) {
    // ヒットストップ
    this.applyHitStop(60);

    // ダメージ処理
    const finalDamage = this.calculateDamage(attacker, target, damage, type);
    target.takeDamage(finalDamage, attacker.x);

    // ノックバック
    this.applyKnockback(target, attacker, type);

    // エフェクト・サウンド
    this.playHitEffects(target, type);

    // コンボ処理（プレイヤーの攻撃の場合）
    if (attacker.isPlayer && attacker.updateCombo) {
      attacker.updateCombo();
    }

    // イベント通知
    this.scene.events.emit('hitProcessed', {
      attacker,
      target,
      damage: finalDamage,
      type
    });
  }

  /**
   * ダメージ計算
   * @param {Object} attacker - 攻撃者
   * @param {Object} target - 被攻撃者
   * @param {number} baseDamage - 基本ダメージ
   * @param {string} type - 攻撃タイプ
   * @returns {number} 最終ダメージ
   */
  calculateDamage(attacker, target, baseDamage, type) {
    let damage = baseDamage;

    // 武器による補正
    if (attacker.heldWeapon) {
      damage += attacker.heldWeapon.damage;
      
      // ボス弱点判定
      if (target.isBoss && attacker.heldWeapon.bossWeakness) {
        damage *= 1.5;
        // 弱点ヒット演出フラグ
        this.scene.events.emit('weaknessHit', { target, weapon: attacker.heldWeapon });
      }
    }

    // 攻撃タイプによる補正
    switch (type) {
      case 'special':
        damage *= 1.3;
        break;
      case 'combo_finisher':
        damage *= 1.5;
        break;
    }

    return Math.floor(damage);
  }

  /**
   * ヒットストップ適用
   * @param {number} duration - 停止時間（ms）
   */
  applyHitStop(duration = 80) {
    this.scene.physics.world.pause();
    this.scene.time.delayedCall(duration, () => {
      if (this.scene.physics.world) {
        this.scene.physics.world.resume();
      }
    });
  }

  /**
   * ノックバック適用
   * @param {Object} target - 被攻撃者
   * @param {Object} attacker - 攻撃者
   * @param {string} type - 攻撃タイプ
   */
  applyKnockback(target, attacker, type) {
    const direction = target.x > attacker.x ? 1 : -1;
    let force = 200;

    // 攻撃タイプによるノックバック調整
    switch (type) {
      case 'special':
        force = 400;
        break;
      case 'combo_finisher':
        force = 350;
        break;
    }

    if (target.body) {
      target.body.setVelocityX(direction * force);
      
      // 一定時間後にノックバック終了
      this.scene.time.delayedCall(200, () => {
        if (target.body) {
          target.body.setVelocityX(0);
        }
      });
    }
  }

  /**
   * ヒットエフェクト再生
   * @param {Object} target - 被攻撃者
   * @param {string} type - 攻撃タイプ
   */
  playHitEffects(target, type) {
    // パーティクルエフェクト（将来実装）
    // this.scene.playHitParticle(target.x, target.y, type);

    // 画面シェイク
    const intensity = type === 'special' ? 8 : 4;
    this.scene.cameras.main.shake(100, intensity);

    // ダメージ数値表示（将来実装）
    // this.scene.showDamageNumber(target.x, target.y - 50, damage);
  }

  /**
   * 扇形攻撃の判定
   * @param {Object} attacker - 攻撃者
   * @param {Object} target - 対象
   * @param {number} angle - 扇の角度（度）
   * @param {number} range - 射程距離
   * @returns {boolean} 扇形範囲内かどうか
   */
  isInCone(attacker, target, angle, range) {
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > range) return false;

    const targetAngle = Math.atan2(dy, dx);
    const attackerFacing = attacker.facingRight ? 0 : Math.PI;
    const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(targetAngle - attackerFacing));

    return angleDiff <= (angle * Math.PI / 180) / 2;
  }

  /**
   * 円形範囲攻撃の判定
   * @param {Object} center - 中心エンティティ
   * @param {Object} target - 対象
   * @param {number} radius - 半径
   * @returns {boolean} 範囲内かどうか
   */
  isInRadius(center, target, radius) {
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= radius;
  }

  /**
   * エンティティをグループに追加
   * @param {Object} entity - エンティティ
   * @param {string} groupType - グループタイプ
   */
  addToGroup(entity, groupType) {
    switch (groupType) {
      case 'player':
        this.playerGroup.add(entity.sprite || entity);
        break;
      case 'enemy':
        this.enemyGroup.add(entity.sprite || entity);
        break;
      case 'weapon':
        this.weaponGroup.add(entity.sprite || entity);
        break;
    }
  }

  /**
   * エンティティをグループから削除
   * @param {Object} entity - エンティティ
   * @param {string} groupType - グループタイプ
   */
  removeFromGroup(entity, groupType) {
    switch (groupType) {
      case 'player':
        this.playerGroup.remove(entity.sprite || entity);
        break;
      case 'enemy':
        this.enemyGroup.remove(entity.sprite || entity);
        break;
      case 'weapon':
        this.weaponGroup.remove(entity.sprite || entity);
        break;
    }
  }

  /**
   * システムクリーンアップ
   */
  destroy() {
    this.playerGroup.clear(true, true);
    this.enemyGroup.clear(true, true);
    this.weaponGroup.clear(true, true);
    this.playerAttackGroup.clear(true, true);
    this.enemyAttackGroup.clear(true, true);
  }
}