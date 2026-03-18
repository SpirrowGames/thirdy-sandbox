import Enemy from './Enemy.js';

/**
 * ボスエンティティ（蒸気鎧の兵士）
 * 2フェーズ構成で、HP半分でフェーズ2に移行
 */
export default class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // ボス専用ステータス
    this.hp = 200;
    this.maxHp = 200;
    this.phase = 1;
    this.phaseTransitioning = false;
    
    // フェーズ2専用攻撃のクールダウン
    this.steamBlastCooldown = 0;
    this.chargeCooldown = 0;
    this.STEAM_BLAST_COOLDOWN_TIME = 3000; // 3秒
    this.CHARGE_COOLDOWN_TIME = 5000; // 5秒
    
    // 攻撃パラメータ
    this.attackDamage = 20; // 雑魚より強い
    this.steamBlastDamage = 15;
    this.chargeDamage = 25;
    this.attackRange = 80; // 少し長め
    
    // フェーズ遷移演出用
    this.flashTween = null;
    this.pauseTimer = 0;
    
    // デバッグ用の色を変更（ボスは赤）
    if (this.sprite && this.sprite.fillColor !== undefined) {
      this.sprite.fillColor = 0xff3333;
    }
  }

  /**
   * 毎フレーム更新
   */
  update(time, delta) {
    if (this.phaseTransitioning || !this.alive) {
      return;
    }

    // フェーズ遷移チェック
    this.checkPhaseTransition();
    
    // クールダウン更新
    this.updateCooldowns(delta);
    
    // 基底クラスの更新を呼ぶ前に、フェーズに応じた行動選択
    this.selectBossAction();
    
    super.update(time, delta);
  }

  /**
   * フェーズ遷移チェック
   */
  checkPhaseTransition() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5 && !this.phaseTransitioning) {
      this.enterPhase2();
    }
  }

  /**
   * フェーズ2移行処理
   */
  enterPhase2() {
    this.phaseTransitioning = true;
    this.phase = 2;
    
    // 移動を停止
    if (this.body) {
      this.body.setVelocity(0, 0);
    }
    
    // 演出シーケンス開始
    this.startPhaseTransitionEffect();
  }

  /**
   * フェーズ遷移演出
   */
  startPhaseTransitionEffect() {
    // 1.5秒間のポーズ演出
    this.pauseTimer = 1500;
    
    // 点滅アニメーション（4回点滅）
    if (this.sprite) {
      this.flashTween = this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 200,
        yoyo: true,
        repeat: 7, // 4回点滅 = 8回の切り替え - 1
        onComplete: () => {
          this.onPhaseTransitionComplete();
        }
      });
    } else {
      // スプライトがない場合は直接完了処理
      this.scene.time.delayedCall(1500, () => {
        this.onPhaseTransitionComplete();
      });
    }

    // 画面フラッシュ
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.flash(300, 255, 255, 255);
    }

    // UIに通知（ボスフェーズ変更）
    this.scene.events.emit('bossPhaseChange', { phase: 2 });
  }

  /**
   * フェーズ遷移完了処理
   */
  onPhaseTransitionComplete() {
    this.phaseTransitioning = false;
    this.pauseTimer = 0;
    
    if (this.flashTween) {
      this.flashTween.destroy();
      this.flashTween = null;
    }
    
    // アルファ値を元に戻す
    if (this.sprite) {
      this.sprite.alpha = 1;
    }
  }

  /**
   * クールダウン更新
   */
  updateCooldowns(delta) {
    if (this.steamBlastCooldown > 0) {
      this.steamBlastCooldown -= delta;
    }
    if (this.chargeCooldown > 0) {
      this.chargeCooldown -= delta;
    }
  }

  /**
   * フェーズに応じた行動選択
   */
  selectBossAction() {
    if (!this.scene.player || this.phaseTransitioning) {
      return;
    }

    const player = this.scene.player;
    const distance = this.getDistanceToPlayer(player);
    
    if (this.phase === 1) {
      this.selectPhase1Action(player, distance);
    } else {
      this.selectPhase2Action(player, distance);
    }
  }

  /**
   * フェーズ1の行動選択
   */
  selectPhase1Action(player, distance) {
    if (distance < 120 && this.attackCooldown <= 0) {
      this.state = 'attack';
    } else if (distance > 120) {
      this.state = 'walk';
    }
  }

  /**
   * フェーズ2の行動選択
   */
  selectPhase2Action(player, distance) {
    // フェーズ2では追加攻撃が使用可能
    if (distance < 120 && this.attackCooldown <= 0) {
      this.state = 'attack';
    } else if (distance >= 120 && distance <= 300 && this.steamBlastCooldown <= 0) {
      this.performSteamBlast(player);
    } else if (distance > 300 && this.chargeCooldown <= 0) {
      this.performCharge(player);
    } else if (distance > 120) {
      this.state = 'walk';
    }
  }

  /**
   * プレイヤーとの距離を計算
   */
  getDistanceToPlayer(player) {
    const dx = Math.abs(this.x - player.x);
    const dy = Math.abs(this.groundY - player.groundY);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 蒸気噴射攻撃
   */
  performSteamBlast(player) {
    if (this.steamBlastCooldown > 0) return;
    
    this.state = 'steam_blast';
    this.steamBlastCooldown = this.STEAM_BLAST_COOLDOWN_TIME;
    
    // 攻撃実行は少し遅延させる（モーション演出）
    this.scene.time.delayedCall(500, () => {
      this.executeSteamBlast(player);
    });
  }

  /**
   * 蒸気噴射の実行
   */
  executeSteamBlast(player) {
    if (!this.alive) return;
    
    // 前方120°扇形、距離250px の範囲判定
    const angle = Phaser.Math.Angle.Between(this.x, this.groundY, player.x, player.groundY);
    const facing = this.facingRight ? 0 : Math.PI;
    const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - facing));
    const distance = this.getDistanceToPlayer(player);
    
    if (angleDiff < Math.PI / 3 && distance <= 250) {
      // プレイヤーが範囲内にいる場合
      this.hitPlayer(player, this.steamBlastDamage);
    }
    
    // 攻撃後は一旦アイドル状態に
    this.state = 'idle';
  }

  /**
   * 突進攻撃
   */
  performCharge(player) {
    if (this.chargeCooldown > 0) return;
    
    this.state = 'charge';
    this.chargeCooldown = this.CHARGE_COOLDOWN_TIME;
    
    // プレイヤー方向への突進
    const direction = player.x > this.x ? 1 : -1;
    this.facingRight = direction > 0;
    
    if (this.body) {
      this.body.setVelocityX(direction * 400); // 高速移動
    }
    
    // 突進は1秒間継続
    this.scene.time.delayedCall(1000, () => {
      if (this.body) {
        this.body.setVelocityX(0);
      }
      this.state = 'idle';
    });
  }

  /**
   * プレイヤーへの攻撃ヒット処理
   */
  hitPlayer(player, damage) {
    if (!player.invincible && this.isDepthAligned(player)) {
      player.takeDamage(damage, this.x);
      
      // ヒットストップ
      if (this.scene.hitStop) {
        this.scene.hitStop(120);
      }
    }
  }

  /**
   * 奥行き判定（親クラスの実装を利用）
   */
  isDepthAligned(target) {
    const DEPTH_THRESHOLD = 40;
    return Math.abs(this.groundY - target.groundY) < DEPTH_THRESHOLD;
  }

  /**
   * ダメージ処理のオーバーライド
   */
  takeDamage(amount, sourceX, weaponType) {
    if (!this.alive || this.phaseTransitioning) {
      return;
    }

    // 武器弱点システム
    let finalDamage = amount;
    if (weaponType && this.scene.WEAPON_DEFS) {
      const weaponDef = this.scene.WEAPON_DEFS[weaponType];
      if (weaponDef && weaponDef.bossWeakness) {
        finalDamage *= 1.5;
        // 弱点ヒット演出
        this.showWeaknessHitEffect();
      }
    }

    super.takeDamage(finalDamage, sourceX);
    
    // UIに通知
    this.scene.events.emit('bossHpChange', { 
      current: this.hp, 
      max: this.maxHp,
      phase: this.phase 
    });
  }

  /**
   * 弱点ヒット演出
   */
  showWeaknessHitEffect() {
    if (this.sprite) {
      // 黄色フラッシュ
      this.sprite.tint = 0xffff00;
      this.scene.time.delayedCall(100, () => {
        if (this.sprite) {
          this.sprite.tint = 0xffffff;
        }
      });
    }
  }

  /**
   * 破棄処理
   */
  destroy() {
    if (this.flashTween) {
      this.flashTween.destroy();
      this.flashTween = null;
    }
    
    super.destroy();
  }

  /**
   * デバッグ情報取得
   */
  getDebugInfo() {
    return {
      ...super.getDebugInfo(),
      phase: this.phase,
      phaseTransitioning: this.phaseTransitioning,
      steamBlastCooldown: Math.max(0, this.steamBlastCooldown),
      chargeCooldown: Math.max(0, this.chargeCooldown)
    };
  }
}