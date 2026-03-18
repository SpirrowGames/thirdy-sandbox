import { Enemy } from './Enemy.js';
import { WEAPON_DEFS } from '../data/weapons.js';

export class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // ボス固有プロパティ
    this.hp = 200;
    this.maxHp = 200;
    this.phase = 1;
    this.weaknessFlashTween = null;
    this.lastDamageWeaponType = null;
    
    // 弱点ヒット時のエフェクト用
    this.weaknessHitEffect = null;
  }

  /**
   * ダメージ処理をオーバーライド
   * 武器の弱点判定を含む
   */
  takeDamage(amount, weaponType = null, sourceX = null) {
    // 武器定義から弱点倍率を取得
    const weaponDef = weaponType ? WEAPON_DEFS[weaponType] : null;
    const isWeakness = weaponDef?.bossWeakness || false;
    const multiplier = isWeakness ? 1.5 : 1.0;
    
    // 実際のダメージ計算
    const finalDamage = Math.floor(amount * multiplier);
    
    // 弱点ヒット時の演出
    if (isWeakness) {
      this.playWeaknessHitEffect();
      this.scene.events.emit('bossWeaknessHit', {
        weaponType,
        damage: finalDamage,
        originalDamage: amount
      });
    }
    
    // 基底クラスのダメージ処理を呼び出し
    super.takeDamage(finalDamage, sourceX);
    
    // フェーズ移行チェック
    this.checkPhaseTransition();
    
    // デバッグ用ログ
    console.log(`Boss took ${finalDamage} damage (${isWeakness ? 'WEAKNESS' : 'normal'})`);
  }

  /**
   * 弱点ヒット時の視覚エフェクト
   */
  playWeaknessHitEffect() {
    // 既存のエフェクトをクリア
    if (this.weaknessFlashTween) {
      this.weaknessFlashTween.destroy();
    }
    
    // 黄色フラッシュエフェクト
    this.sprite.setTint(0xFFFF00); // 黄色
    
    this.weaknessFlashTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.3 },
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.sprite.clearTint();
        this.sprite.setAlpha(1);
        this.weaknessFlashTween = null;
      }
    });
    
    // パーティクルエフェクト（オプション）
    this.createWeaknessParticles();
    
    // 特殊SE再生
    this.scene.sound.play('boss_weakness_hit', { volume: 0.7 });
  }

  /**
   * 弱点ヒット時のパーティクルエフェクト
   */
  createWeaknessParticles() {
    if (!this.scene.add.particles) return;
    
    // 黄色い火花エフェクト
    const particles = this.scene.add.particles(this.x, this.y - 32, 'spark', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.3, end: 0 },
      tint: 0xFFDD00,
      lifespan: 300,
      quantity: 8,
      angle: { min: 0, max: 360 }
    });
    
    // 0.5秒後に自動削除
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  /**
   * フェーズ移行チェック
   */
  checkPhaseTransition() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.enterPhase2();
    }
  }

  /**
   * フェーズ2移行処理
   */
  enterPhase2() {
    this.phase = 2;
    
    // フェーズ移行演出
    this.playPhaseTransitionEffect();
    
    // イベント通知
    this.scene.events.emit('bossPhaseChange', { phase: 2 });
    
    console.log('Boss entered Phase 2');
  }

  /**
   * フェーズ移行演出
   */
  playPhaseTransitionEffect() {
    // 全体一時停止
    this.scene.physics.world.pause();
    
    // カメラフラッシュ
    this.scene.cameras.main.flash(200, 255, 255, 255);
    
    // ボス点滅アニメーション
    const flashTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.2 },
      duration: 150,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        // 演出終了後に再開
        this.scene.physics.world.resume();
        
        // BGM切り替え（実装されている場合）
        if (this.scene.sound.get('boss_phase2_bgm')) {
          this.scene.sound.stopAll();
          this.scene.sound.play('boss_phase2_bgm', { loop: true });
        }
      }
    });
  }

  /**
   * 更新処理（フェーズに応じた行動選択を含む）
   */
  update(time, delta) {
    super.update(time, delta);
    
    // フェーズ2では新しい攻撃パターンを追加
    if (this.phase === 2) {
      this.updatePhase2Behavior(time, delta);
    }
  }

  /**
   * フェーズ2専用の行動パターン
   */
  updatePhase2Behavior(time, delta) {
    // 蒸気噴射攻撃などの実装
    // この部分は既存のBoss実装に依存
  }

  /**
   * 破棄時のクリーンアップ
   */
  destroy() {
    if (this.weaknessFlashTween) {
      this.weaknessFlashTween.destroy();
    }
    super.destroy();
  }
}