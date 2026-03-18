/**
 * 衝突判定システム
 * X軸: Phaser Physics、Y軸: 独自の奥行き判定を組み合わせ
 */
export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
    this.physics = scene.physics;
    
    // 判定閾値定数
    this.DEPTH_THRESHOLD = 40; // px
    
    // 衝突グループの初期化
    this.setupCollisionGroups();
    this.setupOverlapHandlers();
  }

  /**
   * 衝突グループを設定
   */
  setupCollisionGroups() {
    // プレイヤーグループ
    this.playerGroup = this.physics.add.group({
      runChildUpdate: true
    });

    // 敵グループ
    this.enemyGroup = this.physics.add.group({
      runChildUpdate: true
    });

    // プレイヤー攻撃ヒットボックスグループ（一時的）
    this.playerAttackGroup = this.physics.add.group();

    // 敵攻撃ヒットボックスグループ（一時的）
    this.enemyAttackGroup = this.physics.add.group();

    // 武器グループ（拾い可能）
    this.weaponGroup = this.physics.add.group();
  }

  /**
   * 重複判定ハンドラーを設定
   */
  setupOverlapHandlers() {
    // プレイヤー攻撃 vs 敵
    this.physics.add.overlap(
      this.playerAttackGroup,
      this.enemyGroup,
      (attackBox, enemy) => this.handlePlayerAttackHit(attackBox, enemy),
      null,
      this.scene
    );

    // 敵攻撃 vs プレイヤー
    this.physics.add.overlap(
      this.enemyAttackGroup,
      this.playerGroup,
      (attackBox, player) => this.handleEnemyAttackHit(attackBox, player),
      null,
      this.scene
    );

    // プレイヤー vs 武器（拾い上げ）
    this.physics.add.overlap(
      this.playerGroup,
      this.weaponGroup,
      (player, weapon) => this.handleWeaponPickup(player, weapon),
      null,
      this.scene
    );
  }

  /**
   * プレイヤー攻撃のヒット処理
   */
  handlePlayerAttackHit(attackBox, enemy) {
    // 攻撃者の情報を攻撃ボックスから取得
    const attacker = attackBox.getData('owner');
    
    if (!attacker || !enemy.active || !this.isDepthAligned(attacker, enemy)) {
      return;
    }

    // 同一攻撃での重複ヒット防止
    const attackId = attackBox.getData('attackId');
    if (enemy.hasBeenHitBy && enemy.hasBeenHitBy.includes(attackId)) {
      return;
    }

    // ダメージ計算
    const damage = attackBox.getData('damage') || 10;
    const knockbackForce = attackBox.getData('knockback') || 200;

    // ヒット処理実行
    this.executeHit(attacker, enemy, damage, knockbackForce);

    // 重複ヒット防止用マーク
    if (!enemy.hasBeenHitBy) enemy.hasBeenHitBy = [];
    enemy.hasBeenHitBy.push(attackId);
  }

  /**
   * 敵攻撃のヒット処理
   */
  handleEnemyAttackHit(attackBox, player) {
    const attacker = attackBox.getData('owner');
    
    if (!attacker || !player.active || !this.isDepthAligned(attacker, player)) {
      return;
    }

    // プレイヤーの無敵フレーム確認
    if (player.invincible) {
      return;
    }

    const damage = attackBox.getData('damage') || 10;
    const knockbackForce = attackBox.getData('knockback') || 150;

    this.executeHit(attacker, player, damage, knockbackForce);
  }

  /**
   * 武器拾い上げ処理
   */
  handleWeaponPickup(player, weaponSprite) {
    const weapon = weaponSprite.getData('weapon');
    if (!weapon) return;

    // プレイヤーに武器を装備
    if (player.equipWeapon) {
      player.equipWeapon(weapon);
      weaponSprite.destroy();
      
      // UIに通知
      this.scene.events.emit('weaponPickup', {
        name: weapon.name,
        durability: weapon.durability,
        maxDurability: weapon.maxDurability
      });
    }
  }

  /**
   * 奥行き判定（Y軸）
   */
  isDepthAligned(entity1, entity2) {
    const y1 = entity1.groundY || entity1.y;
    const y2 = entity2.groundY || entity2.y;
    return Math.abs(y1 - y2) < this.DEPTH_THRESHOLD;
  }

  /**
   * ヒット処理の実行
   */
  executeHit(attacker, target, damage, knockbackForce) {
    // ダメージ適用
    target.takeDamage(damage);

    // ノックバック計算
    const direction = target.x > attacker.x ? 1 : -1;
    const knockback = {
      x: direction * knockbackForce,
      y: 0
    };

    // ノックバック適用
    if (target.body) {
      target.body.setVelocityX(knockback.x);
      
      // ノックバック減衰
      this.scene.time.delayedCall(200, () => {
        if (target.body) {
          target.body.setVelocityX(0);
        }
      });
    }

    // ヒットストップ演出
    this.applyHitStop(60);

    // コンボ処理（プレイヤーが攻撃者の場合）
    if (attacker.isPlayer) {
      this.scene.events.emit('comboHit', { damage });
    }

    // ヒット演出
    this.createHitEffect(target.x, target.y - 20);
  }

  /**
   * 攻撃ヒットボックスを作成
   */
  createAttackHitbox(owner, config) {
    const {
      width = 60,
      height = this.DEPTH_THRESHOLD * 2,
      offsetX = 0,
      offsetY = 0,
      damage = 10,
      knockback = 200,
      duration = 100,
      isPlayerAttack = true
    } = config;

    // 攻撃方向を考慮した位置計算
    const direction = owner.facingRight ? 1 : -1;
    const x = owner.x + (offsetX * direction);
    const y = (owner.groundY || owner.y) + offsetY;

    // ヒットボックス作成
    const hitbox = this.physics.add.image(x, y, null);
    hitbox.setSize(width, height);
    hitbox.setVisible(false); // 判定専用で非表示
    
    // データ設定
    const attackId = `${owner.id || 'unknown'}_${Date.now()}_${Math.random()}`;
    hitbox.setData('owner', owner);
    hitbox.setData('damage', damage);
    hitbox.setData('knockback', knockback);
    hitbox.setData('attackId', attackId);

    // 適切なグループに追加
    if (isPlayerAttack) {
      this.playerAttackGroup.add(hitbox);
    } else {
      this.enemyAttackGroup.add(hitbox);
    }

    // 指定時間後に破棄
    this.scene.time.delayedCall(duration, () => {
      if (hitbox.active) {
        hitbox.destroy();
      }
    });

    return hitbox;
  }

  /**
   * ヒットストップ演出
   */
  applyHitStop(duration = 60) {
    this.physics.world.pause();
    this.scene.time.delayedCall(duration, () => {
      this.physics.world.resume();
    });
  }

  /**
   * ヒット演出エフェクト
   */
  createHitEffect(x, y) {
    const effect = this.scene.add.circle(x, y, 8, 0xFFFFFF);
    effect.setAlpha(0.8);
    
    // フェードアウトアニメーション
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      onComplete: () => effect.destroy()
    });
  }

  /**
   * エンティティをグループに登録
   */
  addPlayer(player) {
    this.playerGroup.add(player.sprite || player);
  }

  addEnemy(enemy) {
    this.enemyGroup.add(enemy.sprite || enemy);
  }

  addWeapon(weaponSprite, weapon) {
    weaponSprite.setData('weapon', weapon);
    this.weaponGroup.add(weaponSprite);
  }

  /**
   * システムの更新（毎フレーム呼び出し）
   */
  update(time, delta) {
    // 非アクティブな攻撃ボックスを清掃
    this.cleanupInactiveAttacks();
  }

  /**
   * 非アクティブな攻撃ボックスの清掃
   */
  cleanupInactiveAttacks() {
    this.playerAttackGroup.children.entries.forEach(hitbox => {
      if (!hitbox.active) {
        this.playerAttackGroup.remove(hitbox);
      }
    });

    this.enemyAttackGroup.children.entries.forEach(hitbox => {
      if (!hitbox.active) {
        this.enemyAttackGroup.remove(hitbox);
      }
    });
  }

  /**
   * システムの破棄
   */
  destroy() {
    this.playerGroup.destroy();
    this.enemyGroup.destroy();
    this.playerAttackGroup.destroy();
    this.enemyAttackGroup.destroy();
    this.weaponGroup.destroy();
  }
}