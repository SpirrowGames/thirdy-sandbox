import { Enemy } from './Enemy.js';
import { WEAPON_DEFS } from '../data/weapons.js';

export class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.hp = 200;
    this.maxHp = 200;
    this.phase = 1;
    this.phaseTransitioning = false;
    this.speed = 60;
    this.attackRange = 80;
    this.attackDamage = 15;
    this.steamBlastCooldown = 0;
    this.rushCooldown = 0;
    
    // 演出用プロパティ
    this.originalAlpha = 1.0;
    this.flashTween = null;
    
    // ボスサイズ（大きめに設定）
    this.sprite.setDisplaySize(80, 96);
    this.body.setSize(80, 96);
  }

  update(time, dt) {
    // フェーズ移行中は通常の更新をスキップ
    if (this.phaseTransitioning) {
      return;
    }

    // フェーズ1からフェーズ2への移行チェック
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.startPhase2Transition();
      return;
    }

    // クールダウン更新
    this.steamBlastCooldown = Math.max(0, this.steamBlastCooldown - dt);
    this.rushCooldown = Math.max(0, this.rushCooldown - dt);

    super.update(time, dt);
  }

  /**
   * フェーズ2移行演出を開始
   */
  startPhase2Transition() {
    this.phaseTransitioning = true;
    
    // 1. 全エンティティの更新を一時停止
    this.scene.pauseAllEntities();
    
    // 2. ボス点滅アニメーション開始
    this.startBlinkAnimation();
    
    // 3. 1.5秒後に画面フラッシュとBGM切り替え
    this.scene.time.delayedCall(1500, () => {
      this.triggerPhase2Effects();
    });
  }

  /**
   * ボス点滅アニメーション
   */
  startBlinkAnimation() {
    let blinkCount = 0;
    const totalBlinks = 8; // 4回点滅（on/off × 4）
    
    const blinkInterval = this.scene.time.addEvent({
      delay: 150, // 0.15秒間隔
      repeat: totalBlinks - 1,
      callback: () => {
        blinkCount++;
        // 奇数回で透明、偶数回で不透明
        const targetAlpha = blinkCount % 2 === 1 ? 0.3 : 1.0;
        
        this.flashTween = this.scene.tweens.add({
          targets: this.sprite,
          alpha: targetAlpha,
          duration: 100,
          ease: 'Power2'
        });
      }
    });
  }

  /**
   * フェーズ2エフェクト発動
   */
  triggerPhase2Effects() {
    // 画面フラッシュ
    this.scene.cameras.main.flash(300, 255, 255, 255, false);
    
    // 画面シェイク
    this.scene.cameras.main.shake(500, 0.02);
    
    // BGM切り替え（フェーズ2用）
    this.scene.switchToPhase2Music();
    
    // ボスの見た目を変更（色変更など）
    this.sprite.setTint(0xff6666); // 赤みがかった色
    
    // 0.5秒後にゲーム再開
    this.scene.time.delayedCall(500, () => {
      this.completePhase2Transition();
    });
  }

  /**
   * フェーズ2移行完了
   */
  completePhase2Transition() {
    this.phase = 2;
    this.phaseTransitioning = false;
    
    // 全エンティティの更新再開
    this.scene.resumeAllEntities();
    
    // アルファ値を確実に1.0に戻す
    this.sprite.setAlpha(1.0);
    
    // UI更新通知
    this.scene.events.emit('bossPhase2Start');
    
    console.log('Boss entered Phase 2!');
  }

  /**
   * フェーズに応じた行動選択
   */
  selectAction(player) {
    if (this.state !== 'idle' && this.state !== 'walk') {
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.groundY, player.x, player.groundY);
    
    if (this.phase === 1) {
      // フェーズ1: 近接攻撃のみ
      if (distance < this.attackRange && this.inAttackRange(player)) {
        this.state = 'attack';
      } else {
        this.moveTowardsPlayer(player);
      }
    } else if (this.phase === 2) {
      // フェーズ2: 距離に応じて行動選択
      if (distance < 120 && this.inAttackRange(player)) {
        // 近距離: 踏み込みパンチ
        this.state = 'attack';
      } else if (distance >= 120 && distance <= 300 && this.steamBlastCooldown <= 0) {
        // 中距離: 蒸気噴射
        this.performSteamBlast(player);
      } else if (distance > 300 && this.rushCooldown <= 0) {
        // 遠距離: 突進攻撃
        this.performRush(player);
      } else {
        // クールダウン中は前進
        this.moveTowardsPlayer(player);
      }
    }
  }

  /**
   * 蒸気噴射攻撃
   */
  performSteamBlast(player) {
    this.state = 'steam_blast';
    this.steamBlastCooldown = 3000; // 3秒クールダウン
    
    // 前方120°扇形、距離250px
    const angle = Phaser.Math.Angle.Between(this.x, this.groundY, player.x, player.groundY);
    const facing = this.facingRight ? 0 : Math.PI;
    const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - facing));
    
    if (angleDiff < Math.PI / 3) { // 60度以内
      const distance = Phaser.Math.Distance.Between(this.x, this.groundY, player.x, player.groundY);
      if (distance <= 250) {
        player.takeDamage(20, this.x);
      }
    }
    
    // 蒸気エフェクト生成
    this.scene.createSteamEffect(this.x, this.groundY, this.facingRight);
    
    // 1秒後に通常状態に戻る
    this.scene.time.delayedCall(1000, () => {
      this.state = 'idle';
    });
  }

  /**
   * 突進攻撃
   */
  performRush(player) {
    this.state = 'rush';
    this.rushCooldown = 4000; // 4秒クールダウン
    
    const direction = player.x > this.x ? 1 : -1;
    this.body.setVelocityX(direction * 400); // 高速移動
    
    // 1.5秒後に停止
    this.scene.time.delayedCall(1500, () => {
      this.body.setVelocityX(0);
      this.state = 'idle';
    });
  }

  /**
   * 武器弱点システム
   */
  takeDamage(amount, sourceX, weaponType = null) {
    if (this.phaseTransitioning) {
      return; // 移行中はダメージ無効
    }

    let multiplier = 1.0;
    let isWeakness = false;
    
    if (weaponType && WEAPON_DEFS[weaponType]) {
      const def = WEAPON_DEFS[weaponType];
      if (def.bossWeakness) {
        multiplier = 1.5;
        isWeakness = true;
      }
    }
    
    const finalDamage = Math.floor(amount * multiplier);
    
    if (isWeakness) {
      // 弱点ヒット演出
      this.sprite.setTint(0xffff00); // 黄色フラッシュ
      this.scene.time.delayedCall(100, () => {
        this.sprite.setTint(this.phase === 2 ? 0xff6666 : 0xffffff);
      });
      
      // 特殊SE再生
      this.scene.sound.play('weakness_hit', { volume: 0.7 });
    }
    
    super.takeDamage(finalDamage, sourceX);
    
    // HP変更をUIに通知
    this.scene.events.emit('bossHpChange', {
      current: this.hp,
      max: this.maxHp,
      phase: this.phase
    });
  }

  destroy() {
    // 進行中のTweenをクリーンアップ
    if (this.flashTween) {
      this.flashTween.stop();
      this.flashTween = null;
    }
    
    super.destroy();
  }
}