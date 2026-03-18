/**
 * 衝突判定システム
 * Phaser.Physics.Arcadeを使用した多層衝突判定を管理
 */
export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
    this.physics = scene.physics;
    
    // 衝突判定グループの初期化
    this.initCollisionGroups();
    
    // 衝突判定ペアの設定
    this.setupCollisions();
  }

  /**
   * 衝突判定グループの初期化
   */
  initCollisionGroups() {
    // Layer 1: プレイヤー攻撃ヒットボックス（一時的）
    this.playerAttackGroup = this.physics.add.group({
      runChildUpdate: false, // 手動で管理
      maxSize: 10, // 同時攻撃数の上限
      createCallback: (hitbox) => {
        hitbox.setVisible(false); // デバッグ時はtrueに変更可能
      }
    });

    // Layer 2: 敵ハートボックス（常時）
    this.enemyHurtboxGroup = this.physics.add.group({
      runChildUpdate: true
    });

    // Layer 3: 敵攻撃ヒットボックス（一時的）
    this.enemyAttackGroup = this.physics.add.group({
      runChildUpdate: false,
      maxSize: 20, // 複数敵の同時攻撃を考慮
      createCallback: (hitbox) => {
        hitbox.setVisible(false);
      }
    });

    // Layer 4: プレイヤーハートボックス（常時）
    this.playerHurtboxGroup = this.physics.add.group({
      runChildUpdate: true
    });

    // Layer 5: 拾い可能武器オブジェクト
    this.weaponGroup = this.physics.add.group({
      runChildUpdate: false
    });
  }

  /**
   * 衝突判定ペアの設定
   */
  setupCollisions() {
    // プレイヤー攻撃 vs 敵ハートボックス
    this.physics.add.overlap(
      this.playerAttackGroup,
      this.enemyHurtboxGroup,
      this.onPlayerAttackHit.bind(this)
    );

    // 敵攻撃 vs プレイヤーハートボックス
    this.physics.add.overlap(
      this.enemyAttackGroup,
      this.playerHurtboxGroup,
      this.onEnemyAttackHit.bind(this)
    );

    // プレイヤー vs 武器（拾う判定）
    this.physics.add.overlap(
      this.playerHurtboxGroup,
      this.weaponGroup,
      this.onWeaponPickup.bind(this)
    );
  }

  /**
   * プレイヤー攻撃のヒット処理
   */
  onPlayerAttackHit(attackHitbox, enemyHurtbox) {
    const attacker = attackHitbox.owner;
    const target = enemyHurtbox.owner;

    // 奥行き判定
    if (!this.isDepthAligned(attacker, target)) {
      return;
    }

    // 既にヒット済みかチェック（多重ヒット防止）
    if (attackHitbox.hitTargets && attackHitbox.hitTargets.has(target)) {
      return;
    }

    // ヒット記録
    if (!attackHitbox.hitTargets) {
      attackHitbox.hitTargets = new Set();
    }
    attackHitbox.hitTargets.add(target);

    // ダメージ計算
    const damage = this.calculateDamage(attacker, target);
    
    // ノックバック計算
    const knockback = this.calculateKnockback(attacker, target);

    // ダメージ適用
    target.takeDamage(damage, knockback);

    // ヒットストップ
    this.applyHitStop(60); // 60ms

    // コンボカウント更新
    if (attacker === this.scene.player) {
      this.scene.updateCombo();
    }

    // ヒットエフェクト
    this.createHitEffect(target.x, target.y);
  }

  /**
   * 敵攻撃のヒット処理
   */
  onEnemyAttackHit(attackHitbox, playerHurtbox) {
    const attacker = attackHitbox.owner;
    const target = playerHurtbox.owner;

    // 奥行き判定
    if (!this.isDepthAligned(attacker, target)) {
      return;
    }

    // 無敵フレーム判定
    if (target.isInvincible()) {
      return;
    }

    // 多重ヒット防止
    if (attackHitbox.hitTargets && attackHitbox.hitTargets.has(target)) {
      return;
    }

    if (!attackHitbox.hitTargets) {
      attackHitbox.hitTargets = new Set();
    }
    attackHitbox.hitTargets.add(target);

    // ダメージ計算
    const damage = this.calculateDamage(attacker, target);
    
    // ノックバック計算
    const knockback = this.calculateKnockback(attacker, target);

    // ダメージ適用
    target.takeDamage(damage, knockback);

    // ヒットストップ
    this.applyHitStop(80); // プレイヤー被弾時は少し長め

    // コンボリセット
    this.scene.resetCombo();

    // ヒットエフェクト
    this.createHitEffect(target.x, target.y, 0xff0000); // 赤色
  }

  /**
   * 武器拾得処理
   */
  onWeaponPickup(playerHurtbox, weaponObject) {
    const player = playerHurtbox.owner;
    const weapon = weaponObject.weaponData;

    // 既に武器を持っている場合は交換
    if (player.heldWeapon) {
      this.dropWeapon(player.heldWeapon, player.x, player.groundY);
    }

    // 武器装備
    player.equipWeapon(weapon);
    weaponObject.destroy();

    // UI更新通知
    this.scene.events.emit('weaponChange', {
      name: weapon.name,
      durability: weapon.durability,
      max: weapon.maxDurability
    });
  }

  /**
   * 奥行き判定
   */
  isDepthAligned(entity1, entity2) {
    const DEPTH_THRESHOLD = 40; // px
    return Math.abs(entity1.groundY - entity2.groundY) < DEPTH_THRESHOLD;
  }

  /**
   * ダメージ計算
   */
  calculateDamage(attacker, target) {
    let baseDamage = attacker.attackDamage || 10;
    
    // 武器ダメージボーナス
    if (attacker.heldWeapon) {
      baseDamage = attacker.heldWeapon.damage;
    }

    // ボスの武器弱点システム
    if (target.type === 'boss' && attacker.heldWeapon) {
      const weaponDef = attacker.heldWeapon;
      if (weaponDef.bossWeakness) {
        baseDamage *= 1.5;
        // 弱点ヒット演出フラグ
        target.showWeaknessHit = true;
      }
    }

    return Math.floor(baseDamage);
  }

  /**
   * ノックバック計算
   */
  calculateKnockback(attacker, target) {
    const direction = target.x > attacker.x ? 1 : -1;
    const force = attacker.knockbackForce || 200;
    
    return {
      x: direction * force,
      y: 0
    };
  }

  /**
   * ヒットストップ適用
   */
  applyHitStop(duration) {
    this.scene.physics.world.pause();
    this.scene.time.delayedCall(duration, () => {
      this.scene.physics.world.resume();
    });
  }

  /**
   * ヒットエフェクト生成
   */
  createHitEffect(x, y, color = 0xffffff) {
    const effect = this.scene.add.circle(x, y, 8, color);
    effect.setAlpha(0.8);
    
    // フェードアウトアニメーション
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      ease: 'Power2',
      onComplete: () => effect.destroy()
    });
  }

  /**
   * プレイヤー攻撃ヒットボックス生成
   */
  createPlayerAttackHitbox(owner, x, y, width, height, duration = 100) {
    const hitbox = this.playerAttackGroup.get();
    
    if (!hitbox) {
      console.warn('プレイヤー攻撃ヒットボックスプールが満杯です');
      return null;
    }

    // ヒットボックス設定
    hitbox.setActive(true);
    hitbox.setPosition(x, y);
    hitbox.body.setSize(width, height);
    hitbox.owner = owner;
    hitbox.hitTargets = new Set();

    // 自動破棄タイマー
    this.scene.time.delayedCall(duration, () => {
      this.destroyHitbox(hitbox);
    });

    return hitbox;
  }

  /**
   * 敵攻撃ヒットボックス生成
   */
  createEnemyAttackHitbox(owner, x, y, width, height, duration = 150) {
    const hitbox = this.enemyAttackGroup.get();
    
    if (!hitbox) {
      console.warn('敵攻撃ヒットボックスプールが満杯です');
      return null;
    }

    hitbox.setActive(true);
    hitbox.setPosition(x, y);
    hitbox.body.setSize(width, height);
    hitbox.owner = owner;
    hitbox.hitTargets = new Set();

    this.scene.time.delayedCall(duration, () => {
      this.destroyHitbox(hitbox);
    });

    return hitbox;
  }

  /**
   * ヒットボックス破棄
   */
  destroyHitbox(hitbox) {
    if (hitbox && hitbox.active) {
      hitbox.setActive(false);
      hitbox.setVisible(false);
      hitbox.owner = null;
      hitbox.hitTargets = null;
    }
  }

  /**
   * エンティティをハートボックスグループに追加
   */
  addToEnemyHurtboxGroup(entity) {
    // エンティティのスプライトまたは専用ハートボックスを追加
    const hurtbox = entity.hurtbox || entity.sprite;
    hurtbox.owner = entity;
    this.enemyHurtboxGroup.add(hurtbox);
  }

  addToPlayerHurtboxGroup(entity) {
    const hurtbox = entity.hurtbox || entity.sprite;
    hurtbox.owner = entity;
    this.playerHurtboxGroup.add(hurtbox);
  }

  /**
   * 武器オブジェクト追加
   */
  addWeapon(weaponSprite, weaponData) {
    weaponSprite.weaponData = weaponData;
    this.weaponGroup.add(weaponSprite);
  }

  /**
   * 武器ドロップ
   */
  dropWeapon(weaponData, x, y) {
    const weaponSprite = this.scene.add.rectangle(x, y, 32, 16, 0x888888);
    this.scene.physics.add.existing(weaponSprite);
    
    // 少し跳ねる演出
    weaponSprite.body.setVelocity(
      Phaser.Math.Between(-50, 50),
      Phaser.Math.Between(-100, -50)
    );
    weaponSprite.body.setBounce(0.3);

    this.addWeapon(weaponSprite, weaponData);
  }

  /**
   * デバッグ用：ヒットボックス可視化
   */
  setDebugMode(enabled) {
    this.playerAttackGroup.children.entries.forEach(hitbox => {
      hitbox.setVisible(enabled);
      if (enabled) {
        hitbox.setFillStyle(0x00ff00, 0.3);
      }
    });

    this.enemyAttackGroup.children.entries.forEach(hitbox => {
      hitbox.setVisible(enabled);
      if (enabled) {
        hitbox.setFillStyle(0xff0000, 0.3);
      }
    });
  }

  /**
   * システム更新（毎フレーム呼び出し）
   */
  update(time, delta) {
    // 非アクティブなヒットボックスのクリーンアップ
    this.cleanupInactiveHitboxes();
  }

  /**
   * 非アクティブヒットボックスのクリーンアップ
   */
  cleanupInactiveHitboxes() {
    this.playerAttackGroup.children.entries.forEach(hitbox => {
      if (!hitbox.active && hitbox.owner) {
        this.destroyHitbox(hitbox);
      }
    });

    this.enemyAttackGroup.children.entries.forEach(hitbox => {
      if (!hitbox.active && hitbox.owner) {
        this.destroyHitbox(hitbox);
      }
    });
  }

  /**
   * システム破棄
   */
  destroy() {
    this.playerAttackGroup.destroy();
    this.enemyHurtboxGroup.destroy();
    this.enemyAttackGroup.destroy();
    this.playerHurtboxGroup.destroy();
    this.weaponGroup.destroy();
  }
}