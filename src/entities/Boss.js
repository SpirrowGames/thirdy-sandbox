import { Enemy } from './Enemy.js';
import { WEAPON_DEFS } from '../data/weapons.js';

export class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.hp = 200;
    this.maxHp = 200;
    this.phase = 1;
    this.weaknessFlashTween = null;
  }

  takeDamage(amount, sourceX, weaponType = null) {
    // 武器による弱点判定
    const def = weaponType ? WEAPON_DEFS[weaponType] : null;
    const isWeakness = def?.bossWeakness || false;
    const multiplier = isWeakness ? 1.5 : 1.0;
    
    const finalDamage = Math.floor(amount * multiplier);
    
    // 弱点ヒット演出
    if (isWeakness) {
      this.playWeaknessEffect();
      // 弱点ヒット時の特殊SE再生
      this.scene.sound.play('weakness_hit', { volume: 0.7 });
      
      // スコアボーナス通知
      this.scene.events.emit('weaknessHit', { 
        damage: finalDamage,
        weaponName: def.name 
      });
    }
    
    // 基底クラスのダメージ処理を呼び出し
    super.takeDamage(finalDamage, sourceX);
    
    // フェーズ移行チェック
    this.checkPhaseTransition();
  }

  playWeaknessEffect() {
    // 黄色フラッシュ演出
    if (this.weaknessFlashTween) {
      this.weaknessFlashTween.destroy();
    }
    
    // 元の色調を保存
    const originalTint = this.sprite.tint;
    
    this.weaknessFlashTween = this.scene.tweens.add({
      targets: this.sprite,
      tint: 0xffff00, // 黄色
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.sprite.tint = originalTint;
        this.weaknessFlashTween = null;
      }
    });
    
    // 画面振動効果
    this.scene.cameras.main.shake(150, 0.01);
  }

  checkPhaseTransition() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.enterPhase2();
    }
  }

  enterPhase2() {
    this.phase = 2;
    this.playPhaseTransitionEffect();
  }

  playPhaseTransitionEffect() {
    // 全体の一時停止
    this.scene.physics.world.pause();
    this.scene.tweens.pauseAll();
    
    // ボス点滅アニメーション
    const flashTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 200,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        // 画面フラッシュ
        this.scene.cameras.main.flash(300, 255, 255, 255);
        
        // BGM切り替え（実装時に追加）
        // this.scene.sound.stopAll();
        // this.scene.sound.play('boss_phase2_bgm', { loop: true });
        
        // 1.5秒後に再開
        this.scene.time.delayedCall(1500, () => {
          this.scene.physics.world.resume();
          this.scene.tweens.resumeAll();
          
          // フェーズ2開始通知
          this.scene.events.emit('bossPhaseChange', { phase: 2 });
        });
      }
    });
  }

  // フェーズに応じた行動選択をオーバーライド
  selectAction(player) {
    const distance = Phaser.Math.Distance.Between(
      this.x, this.groundY, 
      player.x, player.groundY
    );
    
    if (this.phase === 1) {
      // フェーズ1：基本的な近接攻撃のみ
      if (distance < 120) {
        this.performMeleeAttack(player);
      } else {
        this.moveTowardsPlayer(player);
      }
    } else {
      // フェーズ2：蒸気噴射と突進を追加
      if (distance < 120) {
        this.performMeleeAttack(player);
      } else if (distance < 300 && this.steamCooldownReady()) {
        this.performSteamBlast(player);
      } else if (distance > 300 && this.chargeCooldownReady()) {
        this.performCharge(player);
      } else {
        this.moveTowardsPlayer(player);
      }
    }
  }

  steamCooldownReady() {
    const now = this.scene.time.now;
    return !this.lastSteamTime || (now - this.lastSteamTime) > 3000; // 3秒クールダウン
  }

  chargeCooldownReady() {
    const now = this.scene.time.now;
    return !this.lastChargeTime || (now - this.lastChargeTime) > 4000; // 4秒クールダウン
  }

  performSteamBlast(player) {
    this.lastSteamTime = this.scene.time.now;
    this.state = 'steam_attack';
    
    // 蒸気噴射の実装
    const angle = Phaser.Math.Angle.Between(this.x, this.groundY, player.x, player.groundY);
    const facing = this.facingRight ? 0 : Math.PI;
    
    // 前方120度扇形の範囲攻撃
    if (Math.abs(Phaser.Math.Angle.Wrap(angle - facing)) < Math.PI / 3) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.groundY, 
        player.x, player.groundY
      );
      
      if (distance < 250) {
        player.takeDamage(15, this.x);
      }
    }
    
    // 攻撃後の硬直時間
    this.scene.time.delayedCall(800, () => {
      this.state = 'idle';
    });
  }

  performCharge(player) {
    this.lastChargeTime = this.scene.time.now;
    this.state = 'charge';
    
    // プレイヤーに向かって突進
    const direction = player.x > this.x ? 1 : -1;
    this.body.setVelocityX(direction * 400);
    
    // 突進終了
    this.scene.time.delayedCall(1000, () => {
      this.body.setVelocityX(0);
      this.state = 'idle';
    });
  }

  destroy() {
    if (this.weaknessFlashTween) {
      this.weaknessFlashTween.destroy();
    }
    super.destroy();
  }
}