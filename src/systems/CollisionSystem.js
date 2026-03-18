/**
 * 衝突判定システム
 * 攻撃ヒットボックス生成、判定レイヤー管理、奥行き判定を担当
 */
export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
    this.physics = scene.physics;
    
    // 判定レイヤーグループ
    this.playerAttackBoxes = this.physics.add.group();
    this.enemyHurtBoxes = this.physics.add.group();
    this.enemyAttackBoxes = this.physics.add.group();
    this.playerHurtBox = null;
    this.weaponPickups = this.physics.add.group();
    
    // 衝突判定設定
    this.setupCollisions();
  }

  /**
   * 衝突判定の設定
   */
  setupCollisions() {
    // プレイヤー攻撃 vs 敵ハートボックス
    this.physics.add.overlap(
      this.playerAttackBoxes,
      this.enemyHurtBoxes,
      (attackBox, hurtBox) => this.handlePlayerAttackHit(attackBox, hurtBox)
    );

    // 敵攻撃 vs プレイヤーハートボックス
    this.physics.add.overlap(
      this.enemyAttackBoxes,
      this.playerHurtBox,
      (attackBox, hurtBox) => this.handleEnemyAttackHit(attackBox, hurtBox)
    );

    // プレイヤー vs 武器拾い
    this.physics.add.overlap(
      this.playerHurtBox,
      this.weaponPickups,
      (player, weapon) => this.handleWeaponPickup(player, weapon)
    );
  }

  /**
   * 攻撃ヒットボックスを生成
   * @param {Object} owner - 攻撃者
   * @param {number} damage - ダメージ量
   * @param {number} range - 攻撃範囲（X軸）
   * @param {number} duration - 持続時間（ms）
   * @param {string} type - 攻撃タイプ（'player' | 'enemy'）
   * @returns {Phaser.GameObjects.Image} 生成されたヒットボックス
   */
  createAttackHitbox(owner, damage, range, duration = 100, type = 'player') {
    const direction = owner.facingRight ? 1 : -1;
    const offsetX = direction * range * 0.5;
    
    // ヒットボックスの位置計算
    const hitboxX = owner.x + offsetX;
    const hitboxY = owner.groundY;
    
    // 不可視の矩形を生成
    const hitbox = this.scene.add.image(hitboxX, hitboxY, '__WHITE');
    hitbox.setVisible(false);
    hitbox.setSize(range, CONSTANTS.DEPTH_THRESHOLD * 2);
    
    // 物理ボディを追加
    this.physics.add.existing(hitbox);
    hitbox.body.setSize(range, CONSTANTS.DEPTH_THRESHOLD * 2);
    
    // ヒットボックスにメタデータを設定
    hitbox.attackData = {
      owner: owner,
      damage: damage,
      range: range,
      type: type,
      hitTargets: new Set() // 重複ヒット防止
    };
    
    // 適切なグループに追加
    if (type === 'player') {
      this.playerAttackBoxes.add(hitbox);
    } else {
      this.enemyAttackBoxes.add(hitbox);
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
   * 奥行き判定（Y座標の差が閾値内かチェック）
   * @param {Object} entity1 - エンティティ1
   * @param {Object} entity2 - エンティティ2
   * @returns {boolean} 奥行きが一致しているか
   */
  isDepthAligned(entity1, entity2) {
    const depth1 = entity1.groundY || entity1.y;
    const depth2 = entity2.groundY || entity2.y;
    return Math.abs(depth1 - depth2) < CONSTANTS.DEPTH_THRESHOLD;
  }

  /**
   * プレイヤー攻撃のヒット処理
   * @param {Phaser.GameObjects.Image} attackBox - 攻撃ヒットボックス
   * @param {Phaser.GameObjects.Image} hurtBox - 敵のハートボックス
   */
  handlePlayerAttackHit(attackBox, hurtBox) {
    const owner = attackBox.attackData.owner;
    const target = hurtBox.entity;
    
    // 重複ヒット防止
    if (attackBox.attackData.hitTargets.has(target)) {
      return;
    }
    
    // 奥行き判定
    if (!this.isDepthAligned(owner, target)) {
      return;
    }
    
    // ヒット処理実行
    attackBox.attackData.hitTargets.add(target);
    const damage = attackBox.attackData.damage;
    const knockback = this.calculateKnockback(owner, target);
    
    // ダメージ適用
    target.takeDamage(damage, knockback);
    
    // ヒットエフェクト
    this.createHitEffect(target.x, target.y);
    
    // ヒットストップ
    this.applyHitStop(80);
    
    // コンボカウンタ更新
    if (owner.updateCombo) {
      owner.updateCombo();
    }
    
    // イベント発火
    this.scene.events.emit('enemyHit', { attacker: owner, target: target, damage: damage });
  }

  /**
   * 敵攻撃のヒット処理
   * @param {Phaser.GameObjects.Image} attackBox - 敵の攻撃ヒットボックス
   * @param {Phaser.GameObjects.Image} hurtBox - プレイヤーのハートボックス
   */
  handleEnemyAttackHit(attackBox, hurtBox) {
    const owner = attackBox.attackData.owner;
    const target = hurtBox.entity;
    
    // 重複ヒット防止
    if (attackBox.attackData.hitTargets.has(target)) {
      return;
    }
    
    // 奥行き判定
    if (!this.isDepthAligned(owner, target)) {
      return;
    }
    
    // 無敵時間チェック
    if (target.invincible) {
      return;
    }
    
    // ヒット処理実行
    attackBox.attackData.hitTargets.add(target);
    const damage = attackBox.attackData.damage;
    const knockback = this.calculateKnockback(owner, target);
    
    // ダメージ適用
    target.takeDamage(damage, knockback);
    
    // ヒットエフェクト
    this.createHitEffect(target.x, target.y);
    
    // ヒットストップ
    this.applyHitStop(60);
    
    // イベント発火
    this.scene.events.emit('playerHit', { attacker: owner, target: target, damage: damage });
  }

  /**
   * 武器拾い処理
   * @param {Phaser.GameObjects.Image} playerBox - プレイヤーのハートボックス
   * @param {Phaser.GameObjects.Image} weaponBox - 武器のピックアップボックス
   */
  handleWeaponPickup(playerBox, weaponBox) {
    const player = playerBox.entity;
    const weapon = weaponBox.entity;
    
    // 奥行き判定
    if (!this.isDepthAligned(player, weapon)) {
      return;
    }
    
    // 武器拾い処理
    if (player.pickupWeapon) {
      player.pickupWeapon(weapon);
      weaponBox.destroy();
      
      // イベント発火
      this.scene.events.emit('weaponPickup', { player: player, weapon: weapon });
    }
  }

  /**
   * ノックバック方向と強度を計算
   * @param {Object} attacker - 攻撃者
   * @param {Object} target - 被攻撃者
   * @returns {Object} ノックバックベクター {x, y}
   */
  calculateKnockback(attacker, target) {
    const direction = target.x > attacker.x ? 1 : -1;
    return {
      x: direction * 300,
      y: 0
    };
  }

  /**
   * ヒットエフェクトを生成
   * @param {number} x - X座標
   * @param {number} y - Y座標
   */
  createHitEffect(x, y) {
    const effect = this.scene.add.circle(x, y, 20, 0xffff00, 0.8);
    
    // フェードアウトアニメーション
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      ease: 'Power2',
      onComplete: () => effect.destroy()
    });
  }

  /**
   * ヒットストップを適用
   * @param {number} duration - 停止時間（ms）
   */
  applyHitStop(duration) {
    this.scene.physics.world.pause();
    this.scene.time.delayedCall(duration, () => {
      this.scene.physics.world.resume();
    });
  }

  /**
   * エンティティのハートボックスを登録
   * @param {Object} entity - エンティティ
   * @param {string} type - エンティティタイプ（'player' | 'enemy'）
   */
  registerEntity(entity, type) {
    const hurtBox = this.scene.add.image(entity.x, entity.groundY, '__WHITE');
    hurtBox.setVisible(false);
    hurtBox.setSize(entity.width || 48, entity.height || 64);
    
    this.physics.add.existing(hurtBox);
    hurtBox.body.setSize(entity.width || 48, entity.height || 64);
    
    // エンティティ参照を設定
    hurtBox.entity = entity;
    entity.hurtBox = hurtBox;
    
    // 適切なグループに追加
    if (type === 'player') {
      this.playerHurtBox = hurtBox;
    } else if (type === 'enemy') {
      this.enemyHurtBoxes.add(hurtBox);
    }
    
    return hurtBox;
  }

  /**
   * 武器ピックアップを登録
   * @param {Object} weapon - 武器エンティティ
   */
  registerWeaponPickup(weapon) {
    const pickupBox = this.scene.add.image(weapon.x, weapon.groundY, '__WHITE');
    pickupBox.setVisible(false);
    pickupBox.setSize(32, 32);
    
    this.physics.add.existing(pickupBox);
    pickupBox.body.setSize(32, 32);
    
    pickupBox.entity = weapon;
    weapon.pickupBox = pickupBox;
    
    this.weaponPickups.add(pickupBox);
    
    return pickupBox;
  }

  /**
   * エンティティの位置更新（ハートボックスを同期）
   * @param {Object} entity - エンティティ
   */
  updateEntityPosition(entity) {
    if (entity.hurtBox && entity.hurtBox.active) {
      entity.hurtBox.x = entity.x;
      entity.hurtBox.y = entity.groundY;
    }
    
    if (entity.pickupBox && entity.pickupBox.active) {
      entity.pickupBox.x = entity.x;
      entity.pickupBox.y = entity.groundY;
    }
  }

  /**
   * エンティティを登録解除
   * @param {Object} entity - エンティティ
   */
  unregisterEntity(entity) {
    if (entity.hurtBox) {
      entity.hurtBox.destroy();
      entity.hurtBox = null;
    }
    
    if (entity.pickupBox) {
      entity.pickupBox.destroy();
      entity.pickupBox = null;
    }
  }

  /**
   * システムの更新（毎フレーム呼び出し）
   */
  update() {
    // 非アクティブなヒットボックスをクリーンアップ
    this.cleanupInactiveHitboxes();
  }

  /**
   * 非アクティブなヒットボックスをクリーンアップ
   */
  cleanupInactiveHitboxes() {
    this.playerAttackBoxes.children.entries.forEach(hitbox => {
      if (!hitbox.active) {
        this.playerAttackBoxes.remove(hitbox);
      }
    });
    
    this.enemyAttackBoxes.children.entries.forEach(hitbox => {
      if (!hitbox.active) {
        this.enemyAttackBoxes.remove(hitbox);
      }
    });
  }

  /**
   * システムの破棄
   */
  destroy() {
    this.playerAttackBoxes.clear(true, true);
    this.enemyHurtBoxes.clear(true, true);
    this.enemyAttackBoxes.clear(true, true);
    this.weaponPickups.clear(true, true);
    
    if (this.playerHurtBox) {
      this.playerHurtBox.destroy();
      this.playerHurtBox = null;
    }
  }
}