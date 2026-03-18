import Phaser from 'phaser';

/**
 * 敵エンティティの基本クラス
 * ステートマシンによる行動制御とプレイヤー追跡AIを実装
 */
export default class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);
    
    // シーンに追加
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.scene = scene;
    
    // 基本ステータス
    this.maxHp = options.maxHp || 30;
    this.hp = this.maxHp;
    this.speed = options.speed || 80;
    this.attackRange = options.attackRange || 60;
    this.attackDamage = options.attackDamage || 10;
    this.attackCooldown = options.attackCooldown || 1500;
    this.attackCooldownTimer = 0;
    
    // 座標管理
    this.groundY = y; // 奥行き判定用Y座標（固定）
    this.displayY = y; // 描画用Y座標
    
    // ステート管理
    this.state = 'idle';
    this.stateTimer = 0;
    this.previousState = null;
    
    // 移動・方向
    this.facingRight = true;
    this.targetX = x;
    this.targetY = y;
    
    // 戦闘関連
    this.alive = true;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.knockbackTimer = 0;
    
    // スプライト作成（開発初期は矩形）
    this.createSprite();
    
    // 物理設定
    this.setupPhysics();
    
    // 定数
    this.DEPTH_THRESHOLD = 40;
    this.IDLE_DURATION = 500; // アイドル状態の持続時間
    this.HURT_DURATION = 300; // 被弾硬直時間
    this.INVINCIBLE_DURATION = 200; // 無敵時間
    this.KNOCKBACK_FORCE = 200; // ノックバック力
  }

  /**
   * スプライト作成（初期は矩形ボックス）
   */
  createSprite() {
    // メインスプライト（矩形）
    this.sprite = this.scene.add.rectangle(0, 0, 40, 60, 0xff6666);
    this.add(this.sprite);
    
    // HPバー（デバッグ用）
    this.hpBarBg = this.scene.add.rectangle(0, -40, 40, 4, 0x000000);
    this.hpBarFg = this.scene.add.rectangle(0, -40, 40, 4, 0x00ff00);
    this.add([this.hpBarBg, this.hpBarFg]);
  }

  /**
   * 物理設定
   */
  setupPhysics() {
    this.body.setSize(40, 60);
    this.body.setCollideWorldBounds(true);
    this.body.setDrag(300, 300);
  }

  /**
   * メインアップデート（毎フレーム呼ばれる）
   */
  update(time, delta) {
    if (!this.alive) return;
    
    // タイマー更新
    this.updateTimers(delta);
    
    // ステートマシン実行
    this.updateStateMachine(time, delta);
    
    // 表示更新
    this.updateDisplay();
  }

  /**
   * タイマー更新
   */
  updateTimers(delta) {
    this.stateTimer += delta;
    
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= delta;
    }
    
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      this.invincible = this.invincibleTimer > 0;
    }
    
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
    }
  }

  /**
   * ステートマシン更新
   */
  updateStateMachine(time, delta) {
    const player = this.scene.player;
    if (!player || !player.alive) return;

    switch (this.state) {
      case 'idle':
        this.handleIdleState(player);
        break;
      case 'walk':
        this.handleWalkState(player);
        break;
      case 'attack':
        this.handleAttackState(player);
        break;
      case 'hurt':
        this.handleHurtState();
        break;
      case 'knockdown':
        this.handleKnockdownState();
        break;
    }
  }

  /**
   * アイドル状態の処理
   */
  handleIdleState(player) {
    this.body.setVelocity(0, 0);
    
    // 一定時間後に歩行状態へ移行
    if (this.stateTimer >= this.IDLE_DURATION) {
      this.changeState('walk');
    }
  }

  /**
   * 歩行状態の処理
   */
  handleWalkState(player) {
    // プレイヤーへの移動
    this.moveTowardsPlayer(player);
    
    // 攻撃範囲内なら攻撃状態へ
    if (this.isInAttackRange(player)) {
      this.changeState('attack');
    }
  }

  /**
   * 攻撃状態の処理
   */
  handleAttackState(player) {
    this.body.setVelocity(0, 0);
    
    // クールダウン完了時に攻撃実行
    if (this.attackCooldownTimer <= 0) {
      this.performAttack(player);
      this.attackCooldownTimer = this.attackCooldown;
      this.changeState('idle');
    }
  }

  /**
   * 被弾状態の処理
   */
  handleHurtState() {
    // ノックバック中は移動制御しない
    if (this.knockbackTimer <= 0) {
      this.body.setVelocity(0, 0);
    }
    
    // 硬直時間終了で歩行状態へ復帰
    if (this.stateTimer >= this.HURT_DURATION) {
      this.changeState('walk');
    }
  }

  /**
   * ダウン状態の処理
   */
  handleKnockdownState() {
    this.body.setVelocity(0, 0);
    
    // ダウン時間終了で復帰または死亡
    if (this.stateTimer >= 1000) {
      if (this.hp <= 0) {
        this.die();
      } else {
        this.changeState('idle');
      }
    }
  }

  /**
   * プレイヤーに向かって移動
   */
  moveTowardsPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.groundY - this.groundY;
    
    // X方向の移動
    if (Math.abs(dx) > 5) {
      const velocityX = dx > 0 ? this.speed : -this.speed;
      this.body.setVelocityX(velocityX);
      this.facingRight = dx > 0;
    } else {
      this.body.setVelocityX(0);
    }
    
    // Y方向（奥行き）の移動
    if (Math.abs(dy) > 5) {
      const velocityY = dy > 0 ? this.speed * 0.7 : -this.speed * 0.7;
      this.body.setVelocityY(velocityY);
    } else {
      this.body.setVelocityY(0);
    }
    
    // Y座標の制限
    this.groundY = Phaser.Math.Clamp(this.groundY, 360, 480);
  }

  /**
   * 攻撃範囲内判定
   */
  isInAttackRange(player) {
    const dx = Math.abs(this.x - player.x);
    const dy = Math.abs(this.groundY - player.groundY);
    
    return dx <= this.attackRange && dy <= this.DEPTH_THRESHOLD;
  }

  /**
   * 攻撃実行
   */
  performAttack(player) {
    if (!this.isInAttackRange(player)) return;
    
    // 攻撃ヒットボックス作成
    const direction = this.facingRight ? 1 : -1;
    const hitboxX = this.x + direction * this.attackRange * 0.5;
    
    const hitbox = this.scene.physics.add.image(hitboxX, this.groundY, null);
    hitbox.setSize(this.attackRange, this.DEPTH_THRESHOLD * 2);
    hitbox.setVisible(false);
    
    // プレイヤーとの衝突判定
    this.scene.physics.add.overlap(hitbox, player.sprite, () => {
      if (this.isDepthAligned(player)) {
        player.takeDamage(this.attackDamage, this.x);
      }
    });
    
    // ヒットボックス削除
    this.scene.time.delayedCall(100, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });
  }

  /**
   * 奥行き判定
   */
  isDepthAligned(target) {
    return Math.abs(this.groundY - target.groundY) < this.DEPTH_THRESHOLD;
  }

  /**
   * ダメージを受ける
   */
  takeDamage(amount, sourceX = null) {
    if (!this.alive || this.invincible) return;
    
    this.hp = Math.max(0, this.hp - amount);
    this.invincibleTimer = this.INVINCIBLE_DURATION;
    this.invincible = true;
    
    // ノックバック処理
    if (sourceX !== null) {
      const direction = this.x > sourceX ? 1 : -1;
      this.body.setVelocityX(direction * this.KNOCKBACK_FORCE);
      this.knockbackTimer = 200;
    }
    
    // HP0以下でダウン状態、そうでなければ被弾状態
    if (this.hp <= 0) {
      this.changeState('knockdown');
    } else {
      this.changeState('hurt');
    }
    
    // ダメージ表示エフェクト
    this.showDamageEffect();
  }

  /**
   * ダメージエフェクト表示
   */
  showDamageEffect() {
    // スプライトを赤く点滅
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
      }
    });
  }

  /**
   * ステート変更
   */
  changeState(newState) {
    if (this.state === newState) return;
    
    this.previousState = this.state;
    this.state = newState;
    this.stateTimer = 0;
    
    // ステート変更時の処理
    this.onStateEnter(newState);
  }

  /**
   * ステート開始時の処理
   */
  onStateEnter(state) {
    switch (state) {
      case 'hurt':
        // 被弾時の処理
        break;
      case 'knockdown':
        // ダウン時の処理
        this.sprite.setTint(0x666666);
        break;
      case 'idle':
        // 通常色に戻す
        this.sprite.clearTint();
        break;
    }
  }

  /**
   * 死亡処理
   */
  die() {
    if (!this.alive) return;
    
    this.alive = false;
    this.body.setEnable(false);
    
    // 死亡エフェクト
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // スポーンシステムに死亡通知
        if (this.scene.spawnSystem) {
          this.scene.spawnSystem.onEnemyDead();
        }
        
        // スコア加算
        if (this.scene.events) {
          this.scene.events.emit('enemyDefeated', { score: 100 });
        }
        
        this.destroy();
      }
    });
  }

  /**
   * 表示更新
   */
  updateDisplay() {
    // HPバー更新
    const hpRatio = this.hp / this.maxHp;
    this.hpBarFg.scaleX = hpRatio;
    
    // 色の変更
    if (hpRatio > 0.6) {
      this.hpBarFg.setFillStyle(0x00ff00);
    } else if (hpRatio > 0.3) {
      this.hpBarFg.setFillStyle(0xffff00);
    } else {
      this.hpBarFg.setFillStyle(0xff0000);
    }
    
    // スプライトの向き
    this.sprite.setFlipX(!this.facingRight);
    
    // 無敵時の点滅
    if (this.invincible && this.state !== 'hurt') {
      this.alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
    } else if (!this.invincible) {
      this.alpha = 1;
    }
    
    // Y座標の同期
    this.y = this.groundY;
  }

  /**
   * オブジェクト破棄
   */
  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarFg) this.hpBarFg.destroy();
    super.destroy();
  }
}