import { Enemy } from './Enemy.js';

export class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'boss');
    
    // ボス専用ステータス
    this.hp = 200;
    this.maxHp = 200;
    this.speed = 60;
    this.attackDamage = 20;
    this.attackRange = 80;
    this.attackCooldown = 2000; // ms
    
    // フェーズ管理
    this.phase = 1;
    this.phaseTransitioning = false;
    
    // 攻撃パターン
    this.steamBlastCooldown = 3000; // ms
    this.lastSteamBlast = 0;
    this.chargeCooldown = 4000; // ms  
    this.lastCharge = 0;
    
    // 距離判定閾値
    this.closeRange = 120;    // 近距離：踏み込みパンチ
    this.midRange = 300;      // 中距離：蒸気噴射
    this.farRange = 500;      // 遠距離：突進
    
    // 演出用
    this.originalTint = 0xffffff;
    
    this.setupAnimations();
  }

  setupAnimations() {
    // アニメーション設定（矩形フェーズでは空実装）
    // TODO: スプライト移行時に実装
  }

  update(time, delta) {
    if (this.phaseTransitioning || !this.alive) return;
    
    // フェーズ移行チェック
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.enterPhase2(time);
      return;
    }
    
    const player = this.scene.player;
    if (!player || !player.alive) return;
    
    this.selectAction(player, time);
    super.update(time, delta);
  }

  selectAction(player, time) {
    const distance = this.getDistanceToPlayer(player);
    const depthAligned = this.isDepthAligned(player);
    
    // 攻撃クールダウン中は移動のみ
    if (time - this.lastAttackTime < this.attackCooldown) {
      if (distance > this.closeRange) {
        this.moveTowardsPlayer(player);
      }
      return;
    }
    
    // フェーズ1: 近接攻撃のみ
    if (this.phase === 1) {
      if (distance <= this.closeRange && depthAligned) {
        this.performMeleeAttack(player, time);
      } else {
        this.moveTowardsPlayer(player);
      }
      return;
    }
    
    // フェーズ2: 距離に応じた多彩な攻撃
    if (this.phase === 2) {
      if (distance <= this.closeRange && depthAligned) {
        this.performMeleeAttack(player, time);
      } else if (distance <= this.midRange && this.canUseSteamBlast(time)) {
        this.performSteamBlast(player, time);
      } else if (distance > this.farRange && this.canUseCharge(time)) {
        this.performCharge(player, time);
      } else {
        this.moveTowardsPlayer(player);
      }
    }
  }

  getDistanceToPlayer(player) {
    return Math.abs(this.x - player.x);
  }

  isDepthAligned(player) {
    return Math.abs(this.groundY - player.groundY) < this.scene.DEPTH_THRESHOLD;
  }

  performMeleeAttack(player, time) {
    this.state = 'attack';
    this.lastAttackTime = time;
    this.body.setVelocity(0, 0);
    
    // 踏み込み動作
    const direction = player.x > this.x ? 1 : -1;
    this.facingRight = direction > 0;
    
    // 攻撃判定を遅延実行（アニメーションタイミングに合わせる）
    this.scene.time.delayedCall(300, () => {
      this.createAttackHitbox(direction * this.attackRange, this.attackDamage);
    });
    
    // 状態リセット
    this.scene.time.delayedCall(800, () => {
      if (this.alive) this.state = 'idle';
    });
  }

  performSteamBlast(player, time) {
    this.state = 'special';
    this.lastSteamBlast = time;
    this.body.setVelocity(0, 0);
    
    const direction = player.x > this.x ? 1 : -1;
    this.facingRight = direction > 0;
    
    // 蒸気噴射エフェクト（0.5秒後に発動）
    this.scene.time.delayedCall(500, () => {
      this.createSteamBlastHitbox(direction);
    });
    
    // 状態リセット
    this.scene.time.delayedCall(1200, () => {
      if (this.alive) this.state = 'idle';
    });
  }

  performCharge(player, time) {
    this.state = 'charge';
    this.lastCharge = time;
    
    const direction = player.x > this.x ? 1 : -1;
    this.facingRight = direction > 0;
    
    // 突進速度
    this.body.setVelocityX(direction * this.speed * 3);
    
    // 突進攻撃判定
    this.createChargeHitbox();
    
    // 突進停止
    this.scene.time.delayedCall(1000, () => {
      this.body.setVelocity(0, 0);
      if (this.alive) this.state = 'idle';
    });
  }

  createAttackHitbox(range, damage) {
    const hitboxX = this.x + range * 0.5;
    const hitbox = this.scene.physics.add.image(hitboxX, this.groundY, '__WHITE');
    hitbox.setSize(Math.abs(range), this.scene.DEPTH_THRESHOLD * 2);
    hitbox.setVisible(false);
    
    this.scene.physics.add.overlap(hitbox, this.scene.player.hitbox, () => {
      if (this.isDepthAligned(this.scene.player)) {
        this.scene.player.takeDamage(damage, this.x);
      }
    });
    
    this.scene.time.delayedCall(100, () => hitbox.destroy());
  }

  createSteamBlastHitbox(direction) {
    // 前方扇形範囲（120°、距離250px）
    const blastRange = 250;
    const blastWidth = 180; // 扇形の幅
    
    const hitbox = this.scene.physics.add.image(
      this.x + direction * blastRange * 0.5, 
      this.groundY, 
      '__WHITE'
    );
    hitbox.setSize(blastRange, blastWidth);
    hitbox.setVisible(false);
    
    this.scene.physics.add.overlap(hitbox, this.scene.player.hitbox, () => {
      // 角度判定（簡易版：前方扇形として扱う）
      const playerDirection = this.scene.player.x > this.x ? 1 : -1;
      if (playerDirection === direction && this.isDepthAligned(this.scene.player)) {
        this.scene.player.takeDamage(15, this.x);
      }
    });
    
    this.scene.time.delayedCall(300, () => hitbox.destroy());
  }

  createChargeHitbox() {
    const hitbox = this.scene.physics.add.image(this.x, this.groundY, '__WHITE');
    hitbox.setSize(60, this.scene.DEPTH_THRESHOLD * 2);
    hitbox.setVisible(false);
    
    // 突進中の当たり判定を維持
    const updateHitbox = () => {
      if (hitbox.active) {
        hitbox.x = this.x;
        hitbox.y = this.groundY;
      }
    };
    
    this.scene.physics.add.overlap(hitbox, this.scene.player.hitbox, () => {
      if (this.isDepthAligned(this.scene.player)) {
        this.scene.player.takeDamage(25, this.x);
        hitbox.destroy(); // ヒット後は判定を削除
      }
    });
    
    const updateTimer = this.scene.time.addEvent({
      delay: 16,
      callback: updateHitbox,
      repeat: 60 // 約1秒間
    });
    
    this.scene.time.delayedCall(1000, () => {
      updateTimer.destroy();
      if (hitbox.active) hitbox.destroy();
    });
  }

  canUseSteamBlast(time) {
    return time - this.lastSteamBlast >= this.steamBlastCooldown;
  }

  canUseCharge(time) {
    return time - this.lastCharge >= this.chargeCooldown;
  }

  enterPhase2(time) {
    this.phaseTransitioning = true;
    this.body.setVelocity(0, 0);
    
    // フェーズ移行演出
    this.playPhaseTransitionEffect();
    
    // 1.5秒後にフェーズ2開始
    this.scene.time.delayedCall(1500, () => {
      this.phase = 2;
      this.phaseTransitioning = false;
      this.state = 'idle';
      
      // フェーズ2用の能力向上
      this.speed = 80;
      this.attackDamage = 25;
      
      // UIにフェーズ変更を通知
      this.scene.events.emit('bossPhaseChange', { phase: 2 });
    });
  }

  playPhaseTransitionEffect() {
    // 点滅エフェクト
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Power2'
    });
    
    // 画面フラッシュ
    this.scene.cameras.main.flash(300, 255, 255, 255, false);
    
    // 演出用パーティクル（将来実装）
    // TODO: 蒸気エフェクトパーティクル
  }

  takeDamage(amount, sourceX, weaponType = null) {
    if (this.phaseTransitioning) return;
    
    // 武器弱点システム
    let finalDamage = amount;
    if (weaponType && this.scene.WEAPON_DEFS) {
      const weaponDef = this.scene.WEAPON_DEFS[weaponType];
      if (weaponDef?.bossWeakness) {
        finalDamage = Math.floor(amount * 1.5);
        this.playWeaknessEffect();
      }
    }
    
    super.takeDamage(finalDamage, sourceX);
    
    // ボスHP変更をUIに通知
    this.scene.events.emit('bossHpChange', { 
      current: this.hp, 
      max: this.maxHp,
      phase: this.phase 
    });
  }

  playWeaknessEffect() {
    // 弱点ヒット時の黄色フラッシュ
    this.sprite.setTint(0xffff00);
    this.scene.time.delayedCall(100, () => {
      this.sprite.setTint(this.originalTint);
    });
  }

  onDeath() {
    // ボス撃破演出
    this.scene.events.emit('bossDefeated');
    
    // 爆発エフェクト（将来実装）
    // TODO: パーティクルエフェクト
    
    // スコアボーナス
    this.scene.events.emit('scoreUpdate', { 
      type: 'boss', 
      amount: 1000 * this.phase 
    });
    
    super.onDeath();
  }
}