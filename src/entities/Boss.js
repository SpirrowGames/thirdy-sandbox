import Enemy from './Enemy.js';

/**
 * ボス（蒸気鎧の兵士）クラス
 * 2フェーズ管理と行動パターン選択機能を持つ
 */
export default class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // ボス固有のステータス
    this.hp = 200;
    this.maxHp = 200;
    this.speed = 60;
    this.attackRange = 120;
    this.attackDamage = 20;
    this.attackCooldown = 2000; // 2秒
    
    // フェーズ管理
    this.phase = 1;
    this.phaseTransitioning = false;
    
    // 行動パターン用のタイマー
    this.actionCooldown = 0;
    this.specialCooldown = 0;
    this.SPECIAL_COOLDOWN = 3000; // 特殊攻撃クールダウン（3秒）
    
    // フェーズ2の攻撃範囲
    this.steamBlastRange = 250;
    this.chargeRange = 300;
    
    // 状態管理
    this.lastPlayerDistance = 0;
    
    this.setupBossVisuals();
  }

  /**
   * ボス専用のビジュアル設定
   */
  setupBossVisuals() {
    // 矩形フェーズでは大きめのサイズに変更
    this.sprite.setSize(80, 100);
    this.sprite.fillColor = 0x8B0000; // ダークレッド
    this.sprite.setScale(1.5); // 他の敵より大きく
  }

  /**
   * メイン更新処理
   */
  update(time, delta) {
    if (!this.alive || this.phaseTransitioning) return;
    
    super.update(time, delta);
    
    // フェーズ管理
    this.updatePhase();
    
    // クールダウン更新
    this.updateCooldowns(delta);
    
    // 行動選択
    this.selectAction();
  }

  /**
   * フェーズ管理
   */
  updatePhase() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.enterPhase2();
    }
  }

  /**
   * フェーズ2移行処理
   */
  enterPhase2() {
    if (this.phaseTransitioning) return;
    
    this.phase = 2;
    this.phaseTransitioning = true;
    this.state = 'idle';
    
    // 演出シーケンス開始
    this.playPhase2Transition();
  }

  /**
   * フェーズ2移行演出
   */
  playPhase2Transition() {
    // 1.5秒間の演出
    const duration = 1500;
    
    // 点滅演出
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Power2'
    });
    
    // 画面フラッシュ
    this.scene.cameras.main.flash(100, 255, 255, 255);
    
    // 色変更（より危険な見た目に）
    this.scene.time.delayedCall(duration * 0.5, () => {
      this.sprite.fillColor = 0xFF4500; // オレンジレッド
    });
    
    // 演出終了後に再開
    this.scene.time.delayedCall(duration, () => {
      this.phaseTransitioning = false;
      this.specialCooldown = 0; // 即座に特殊攻撃を使用可能に
    });
    
    // イベント発火
    this.scene.events.emit('bossPhase2Enter');
  }

  /**
   * クールダウン更新
   */
  updateCooldowns(delta) {
    if (this.actionCooldown > 0) {
      this.actionCooldown -= delta;
    }
    if (this.specialCooldown > 0) {
      this.specialCooldown -= delta;
    }
  }

  /**
   * 行動パターン選択
   */
  selectAction() {
    if (this.state !== 'idle' && this.state !== 'walk') return;
    if (this.actionCooldown > 0) return;
    
    const player = this.scene.player;
    if (!player || !player.alive) return;
    
    const distance = this.getDistanceToPlayer(player);
    this.lastPlayerDistance = distance;
    
    // フェーズに応じた行動選択
    if (this.phase === 1) {
      this.selectPhase1Action(distance);
    } else {
      this.selectPhase2Action(distance);
    }
  }

  /**
   * プレイヤーとの距離計算
   */
  getDistanceToPlayer(player) {
    const dx = Math.abs(this.x - player.x);
    const dy = Math.abs(this.groundY - player.groundY);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * フェーズ1の行動選択
   */
  selectPhase1Action(distance) {
    if (distance <= this.attackRange) {
      this.performMeleeAttack();
    } else {
      this.moveTowardsPlayer(this.scene.player);
    }
  }

  /**
   * フェーズ2の行動選択
   */
  selectPhase2Action(distance) {
    const canUseSpecial = this.specialCooldown <= 0;
    
    if (distance <= this.attackRange) {
      // 近距離：通常攻撃
      this.performMeleeAttack();
    } else if (distance <= this.steamBlastRange && canUseSpecial) {
      // 中距離：蒸気噴射
      this.performSteamBlast();
    } else if (distance > this.chargeRange && canUseSpecial) {
      // 遠距離：突進攻撃
      this.performChargeAttack();
    } else {
      // その他：接近
      this.moveTowardsPlayer(this.scene.player);
    }
  }

  /**
   * 近接攻撃
   */
  performMeleeAttack() {
    this.state = 'attack';
    this.actionCooldown = this.attackCooldown;
    
    // 攻撃演出
    this.scene.time.delayedCall(300, () => {
      if (this.alive) {
        this.createMeleeHitbox();
      }
    });
    
    // 状態復帰
    this.scene.time.delayedCall(800, () => {
      if (this.alive) {
        this.state = 'idle';
      }
    });
  }

  /**
   * 近接攻撃の当たり判定生成
   */
  createMeleeHitbox() {
    const range = this.attackRange;
    const direction = this.facingRight ? 1 : -1;
    
    const hitbox = this.scene.physics.add.image(
      this.x + direction * range * 0.5,
      this.groundY,
      '__WHITE'
    );
    
    hitbox.setSize(range, 80);
    hitbox.setVisible(false);
    hitbox.body.setImmovable(true);
    
    // プレイヤーとの衝突判定
    this.scene.physics.add.overlap(hitbox, this.scene.player.sprite, () => {
      if (this.isDepthAligned(this.scene.player)) {
        this.scene.player.takeDamage(this.attackDamage, this.x);
      }
    });
    
    // ヒットボックスを短時間で破棄
    this.scene.time.delayedCall(100, () => {
      hitbox.destroy();
    });
  }

  /**
   * 蒸気噴射攻撃（フェーズ2専用）
   */
  performSteamBlast() {
    this.state = 'special';
    this.actionCooldown = 1000;
    this.specialCooldown = this.SPECIAL_COOLDOWN;
    
    // 蒸気噴射演出
    this.scene.time.delayedCall(500, () => {
      if (this.alive) {
        this.createSteamBlastHitbox();
      }
    });
    
    // 状態復帰
    this.scene.time.delayedCall(1200, () => {
      if (this.alive) {
        this.state = 'idle';
      }
    });
  }

  /**
   * 蒸気噴射の当たり判定生成
   */
  createSteamBlastHitbox() {
    const player = this.scene.player;
    if (!player || !player.alive) return;
    
    // プレイヤーの方向を向く
    this.facingRight = player.x > this.x;
    const direction = this.facingRight ? 1 : -1;
    
    // 扇形の判定を簡易的に矩形で近似
    const hitbox = this.scene.physics.add.image(
      this.x + direction * this.steamBlastRange * 0.5,
      this.groundY,
      '__WHITE'
    );
    
    hitbox.setSize(this.steamBlastRange, 120);
    hitbox.setVisible(false);
    hitbox.body.setImmovable(true);
    
    // プレイヤーとの衝突判定
    this.scene.physics.add.overlap(hitbox, player.sprite, () => {
      if (this.isDepthAligned(player)) {
        player.takeDamage(15, this.x);
      }
    });
    
    // エフェクト表示（矩形フェーズでは色付き矩形で表現）
    const effect = this.scene.add.rectangle(
      this.x + direction * this.steamBlastRange * 0.5,
      this.groundY,
      this.steamBlastRange,
      120,
      0xFFFFFF,
      0.3
    );
    
    // エフェクトとヒットボックスを破棄
    this.scene.time.delayedCall(300, () => {
      hitbox.destroy();
      effect.destroy();
    });
  }

  /**
   * 突進攻撃（フェーズ2専用）
   */
  performChargeAttack() {
    this.state = 'charge';
    this.actionCooldown = 1500;
    this.specialCooldown = this.SPECIAL_COOLDOWN;
    
    const player = this.scene.player;
    if (!player || !player.alive) return;
    
    // プレイヤーの方向を向く
    this.facingRight = player.x > this.x;
    const direction = this.facingRight ? 1 : -1;
    
    // 突進移動
    this.sprite.body.setVelocityX(direction * 400);
    
    // 突進中の当たり判定
    const chargeHitbox = this.scene.physics.add.image(this.x, this.groundY, '__WHITE');
    chargeHitbox.setSize(80, 100);
    chargeHitbox.setVisible(false);
    
    this.scene.physics.add.overlap(chargeHitbox, player.sprite, () => {
      if (this.isDepthAligned(player)) {
        player.takeDamage(25, this.x);
      }
    });
    
    // 突進停止と状態復帰
    this.scene.time.delayedCall(800, () => {
      if (this.alive) {
        this.sprite.body.setVelocityX(0);
        this.state = 'idle';
        chargeHitbox.destroy();
      }
    });
  }

  /**
   * 奥行き判定
   */
  isDepthAligned(target) {
    const DEPTH_THRESHOLD = 40;
    return Math.abs(this.groundY - target.groundY) < DEPTH_THRESHOLD;
  }

  /**
   * ダメージ処理（武器弱点システム対応）
   */
  takeDamage(amount, sourceX, weaponType = null) {
    if (!this.alive) return;
    
    // 武器弱点チェック
    let multiplier = 1.0;
    if (weaponType && this.scene.WEAPON_DEFS && this.scene.WEAPON_DEFS[weaponType]) {
      const weaponDef = this.scene.WEAPON_DEFS[weaponType];
      if (weaponDef.bossWeakness) {
        multiplier = 1.5;
        // 弱点ヒット演出
        this.showWeaknessEffect();
      }
    }
    
    const finalDamage = Math.floor(amount * multiplier);
    super.takeDamage(finalDamage, sourceX);
    
    // HP変更イベント発火
    this.scene.events.emit('bossHpChange', {
      current: this.hp,
      max: this.maxHp,
      phase: this.phase
    });
  }

  /**
   * 弱点ヒット演出
   */
  showWeaknessEffect() {
    // 黄色フラッシュ
    this.scene.tweens.add({
      targets: this.sprite,
      tint: 0xFFFF00,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  /**
   * 死亡処理
   */
  destroy() {
    // ボス撃破イベント発火
    this.scene.events.emit('bossDefeated', {
      phase: this.phase,
      score: 1000
    });
    
    super.destroy();
  }

  /**
   * 現在のフェーズを取得
   */
  getPhase() {
    return this.phase;
  }

  /**
   * フェーズ移行中かどうか
   */
  isPhaseTransitioning() {
    return this.phaseTransitioning;
  }
}