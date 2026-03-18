export class DamageSystem {
  constructor(scene) {
    this.scene = scene;
    this.hitStopActive = false;
    this.pausedEntities = [];
  }

  /**
   * ダメージ処理とヒットストップ実行
   * @param {Object} attacker 攻撃者
   * @param {Object} target 対象
   * @param {number} damage ダメージ量
   * @param {Object} options オプション（ノックバック方向など）
   */
  applyDamage(attacker, target, damage, options = {}) {
    if (target.invincible || !target.alive) return false;

    // ダメージ計算
    const finalDamage = this.calculateDamage(damage, options);
    
    // ダメージ適用
    target.takeDamage(finalDamage, attacker.x);
    
    // ヒットストップ実行
    this.executeHitStop(options.hitStopDuration || 80);
    
    // ヒットエフェクト生成
    this.createHitEffect(target.x, target.y, finalDamage);
    
    return true;
  }

  /**
   * ダメージ計算（弱点・コンボ補正等）
   */
  calculateDamage(baseDamage, options) {
    let finalDamage = baseDamage;
    
    // 弱点補正
    if (options.isWeakness) {
      finalDamage *= 1.5;
    }
    
    // コンボ補正
    if (options.comboCount && options.comboCount > 3) {
      finalDamage *= (1 + (options.comboCount - 3) * 0.1);
    }
    
    return Math.floor(finalDamage);
  }

  /**
   * ヒットストップ実行
   * @param {number} duration 停止時間（ms）
   */
  executeHitStop(duration) {
    if (this.hitStopActive) return;
    
    this.hitStopActive = true;
    
    // 物理世界を一時停止
    this.scene.physics.world.pause();
    
    // アニメーションを一時停止
    this.pauseAnimations();
    
    // 指定時間後に再開
    this.scene.time.delayedCall(duration, () => {
      this.resumeFromHitStop();
    });
  }

  /**
   * アニメーション一時停止
   */
  pauseAnimations() {
    this.pausedEntities = [];
    
    // プレイヤーアニメーション停止
    if (this.scene.player && this.scene.player.sprite.anims.isPlaying) {
      this.scene.player.sprite.anims.pause();
      this.pausedEntities.push(this.scene.player.sprite);
    }
    
    // 敵アニメーション停止
    if (this.scene.enemies) {
      this.scene.enemies.children.entries.forEach(enemy => {
        if (enemy.sprite && enemy.sprite.anims.isPlaying) {
          enemy.sprite.anims.pause();
          this.pausedEntities.push(enemy.sprite);
        }
      });
    }
  }

  /**
   * ヒットストップから復帰
   */
  resumeFromHitStop() {
    this.hitStopActive = false;
    
    // 物理世界再開
    this.scene.physics.world.resume();
    
    // アニメーション再開
    this.pausedEntities.forEach(sprite => {
      if (sprite.anims) {
        sprite.anims.resume();
      }
    });
    this.pausedEntities = [];
  }

  /**
   * ヒットエフェクト生成
   */
  createHitEffect(x, y, damage) {
    // 火花エフェクト
    const sparks = this.scene.add.particles(x, y, 'spark', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.3, end: 0 },
      lifespan: 200,
      quantity: 8
    });
    
    // ダメージ数値表示
    const damageText = this.scene.add.text(x, y - 20, damage.toString(), {
      fontSize: '24px',
      fill: '#ff4444',
      fontFamily: 'Arial Black'
    });
    
    // ダメージテキストアニメーション
    this.scene.tweens.add({
      targets: damageText,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
    
    // 火花エフェクト削除
    this.scene.time.delayedCall(300, () => {
      sparks.destroy();
    });
  }
}