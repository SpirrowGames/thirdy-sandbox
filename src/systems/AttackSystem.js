export class AttackSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeHitboxes = [];
  }

  /**
   * 攻撃を実行し、一時的なヒットボックスを生成する
   * @param {Object} attacker - 攻撃者エンティティ
   * @param {number} damage - ダメージ量
   * @param {number} range - 攻撃範囲（X方向）
   * @param {number} duration - ヒットボックス持続時間（ms）
   * @param {string} attackType - 攻撃タイプ（'normal', 'special'等）
   */
  performAttack(attacker, damage, range, duration = 100, attackType = 'normal') {
    const direction = attacker.facingRight ? 1 : -1;
    const hitboxX = attacker.x + (direction * range * 0.5);
    const hitboxY = attacker.groundY;

    // 一時的なヒットボックスを生成
    const hitbox = this.scene.physics.add.image(hitboxX, hitboxY, '__WHITE');
    hitbox.setSize(range, this.scene.DEPTH_THRESHOLD * 2);
    hitbox.setVisible(false); // デバッグ時はtrueに変更可能
    hitbox.setActive(true);
    
    // ヒットボックス情報を保存
    hitbox.attackData = {
      attacker,
      damage,
      attackType,
      hasHit: false // 多段ヒット防止
    };

    this.activeHitboxes.push(hitbox);

    // 敵との衝突判定を設定
    this.scene.physics.add.overlap(hitbox, this.scene.enemies, 
      (hitboxSprite, enemy) => this.handleHit(hitboxSprite, enemy)
    );

    // 指定時間後にヒットボックスを破棄
    this.scene.time.delayedCall(duration, () => {
      this.destroyHitbox(hitbox);
    });

    return hitbox;
  }

  /**
   * ヒット処理を実行
   */
  handleHit(hitbox, enemy) {
    if (!hitbox.attackData || hitbox.attackData.hasHit) return;
    
    const { attacker, damage, attackType } = hitbox.attackData;
    
    // 奥行き判定
    if (!this.isDepthAligned(attacker, enemy)) return;

    // ヒットフラグを設定（多段ヒット防止）
    hitbox.attackData.hasHit = true;

    // ダメージ適用
    enemy.takeDamage(damage, attacker.x);

    // ヒットストップ効果
    this.scene.hitStop(80);

    // コンボカウント更新
    if (attacker === this.scene.player) {
      this.scene.player.incrementCombo();
    }

    // ヒット演出
    this.createHitEffect(enemy.x, enemy.y);

    // ヒットボックスを即座に破棄
    this.destroyHitbox(hitbox);
  }

  /**
   * 奥行き判定
   */
  isDepthAligned(attacker, target) {
    return Math.abs(attacker.groundY - target.groundY) < this.scene.DEPTH_THRESHOLD;
  }

  /**
   * ヒットボックスを破棄
   */
  destroyHitbox(hitbox) {
    const index = this.activeHitboxes.indexOf(hitbox);
    if (index > -1) {
      this.activeHitboxes.splice(index, 1);
    }
    
    if (hitbox && hitbox.active) {
      hitbox.destroy();
    }
  }

  /**
   * ヒット演出を生成
   */
  createHitEffect(x, y) {
    const effect = this.scene.add.circle(x, y, 20, 0xffff00, 0.8);
    
    this.scene.tweens.add({
      targets: effect,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => effect.destroy()
    });
  }

  /**
   * 全てのヒットボックスを清理
   */
  cleanup() {
    this.activeHitboxes.forEach(hitbox => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });
    this.activeHitboxes = [];
  }
}