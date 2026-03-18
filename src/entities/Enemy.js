import { DEPTH_THRESHOLD, GROUND_Y_MIN, GROUND_Y_MAX } from '../config/constants.js';

/**
 * 敵エンティティの基底クラス
 * ステートマシンによる行動制御とプレイヤー追跡AIを実装
 */
export class Enemy {
  constructor(scene, x, groundY, config = {}) {
    this.scene = scene;
    
    // 基本プロパティ
    this.hp = config.hp || 30;
    this.maxHp = this.hp;
    this.speed = config.speed || 80;
    this.attackRange = config.attackRange || 60;
    this.attackDamage = config.attackDamage || 10;
    this.attackCooldown = config.attackCooldown || 1500;
    this.attackDuration = config.attackDuration || 300;
    
    // 位置情報
    this.x = x;
    this.groundY = Math.max(GROUND_Y_MIN, Math.min(GROUND_Y_MAX, groundY));
    this.displayY = this.groundY;
    
    // 状態管理
    this.state = 'idle';
    this.previousState = 'idle';
    this.stateTimer = 0;
    this.alive = true;
    this.facingRight = false;
    
    // 攻撃関連
    this.lastAttackTime = 0;
    this.isAttacking = false;
    
    // 無敵・ダメージ関連
    this.invincible = false;
    this.invincibleTimer = 0;
    this.knockbackVelocity = { x: 0, y: 0 };
    this.knockbackDecay = 0.9;
    
    // Phaserスプライト作成（矩形表示）
    this.sprite = scene.add.rectangle(x, this.displayY, 48, 64, 0xff4444);
    this.sprite.setStrokeStyle(2, 0x880000);
    
    // 物理ボディ追加
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
    this.body.setSize(48, 64);
    this.body.setCollideWorldBounds(true);
    
    // デバッグ用テキスト
    this.debugText = scene.add.text(x, groundY - 80, '', {
      fontSize: '12px',
      fill: '#ffffff'
    });
    
    this.updateDebugInfo();
  }

  /**
   * 毎フレーム更新処理
   */
  update(time, delta, player) {
    if (!this.alive) return;
    
    this.stateTimer += delta;
    
    // 無敵時間更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1.0);
      } else {
        // 点滅効果
        this.sprite.setAlpha(Math.sin(time * 0.02) * 0.5 + 0.5);
      }
    }
    
    // ノックバック処理
    this.updateKnockback();
    
    // ステートマシン実行
    this.updateStateMachine(time, delta, player);
    
    // 位置同期
    this.syncPosition();
    
    // デバッグ情報更新
    this.updateDebugInfo();
  }

  /**
   * ステートマシンの更新
   */
  updateStateMachine(time, delta, player) {
    switch (this.state) {
      case 'idle':
        this.handleIdleState(time, delta, player);
        break;
      case 'walk':
        this.handleWalkState(time, delta, player);
        break;
      case 'attack':
        this.handleAttackState(time, delta, player);
        break;
      case 'hurt':
        this.handleHurtState(time, delta, player);
        break;
      case 'knockdown':
        this.handleKnockdownState(time, delta, player);
        break;
    }
  }

  /**
   * IDLE状態の処理
   */
  handleIdleState(time, delta, player) {
    // 0.5秒後にWALK状態に遷移
    if (this.stateTimer > 500) {
      this.changeState('walk');
    }
  }

  /**
   * WALK状態の処理
   */
  handleWalkState(time, delta, player) {
    if (!player || !player.alive) return;
    
    // プレイヤーに向かって移動
    this.moveTowardsPlayer(player, delta);
    
    // 攻撃範囲内かチェック
    if (this.inAttackRange(player) && this.canAttack(time)) {
      this.changeState('attack');
    }
  }

  /**
   * ATTACK状態の処理
   */
  handleAttackState(time, delta, player) {
    if (this.stateTimer < 200) {
      // 攻撃準備（0.2秒間停止）
      return;
    }
    
    if (!this.isAttacking && this.stateTimer >= 200) {
      // 攻撃実行
      this.performAttack(player);
      this.isAttacking = true;
      this.lastAttackTime = time;
    }
    
    // 攻撃終了
    if (this.stateTimer >= this.attackDuration) {
      this.isAttacking = false;
      this.changeState('idle');
    }
  }

  /**
   * HURT状態の処理
   */
  handleHurtState(time, delta, player) {
    // 150ms後にIDLEに復帰
    if (this.stateTimer > 150) {
      this.changeState('idle');
    }
  }

  /**
   * KNOCKDOWN状態の処理
   */
  handleKnockdownState(time, delta, player) {
    // 800ms後に復帰またはDEAD
    if (this.stateTimer > 800) {
      if (this.hp > 0) {
        this.changeState('idle');
      } else {
        this.die();
      }
    }
  }

  /**
   * プレイヤーに向かって移動
   */
  moveTowardsPlayer(player, delta) {
    const dx = player.x - this.x;
    const dy = player.groundY - this.groundY;
    
    // X方向の移動
    if (Math.abs(dx) > 5) {
      const moveX = Math.sign(dx) * this.speed * (delta / 1000);
      this.x += moveX;
      this.facingRight = dx > 0;
    }
    
    // Y方向の移動（奥行き）
    if (Math.abs(dy) > 5) {
      const moveY = Math.sign(dy) * this.speed * 0.5 * (delta / 1000);
      this.groundY = Math.max(GROUND_Y_MIN, Math.min(GROUND_Y_MAX, this.groundY + moveY));
    }
  }

  /**
   * 攻撃範囲内判定
   */
  inAttackRange(player) {
    const dx = Math.abs(this.x - player.x) < this.attackRange;
    const dy = Math.abs(this.groundY - player.groundY) < DEPTH_THRESHOLD;
    return dx && dy;
  }

  /**
   * 攻撃可能判定（クールダウンチェック）
   */
  canAttack(time) {
    return time - this.lastAttackTime > this.attackCooldown;
  }

  /**
   * 攻撃実行
   */
  performAttack(player) {
    if (!player || !this.inAttackRange(player)) return;
    
    // 攻撃ヒット処理
    player.takeDamage(this.attackDamage, this.x);
    
    // 攻撃エフェクト（矩形の色変更）
    this.sprite.setFillStyle(0xffff00);
    this.scene.time.delayedCall(100, () => {
      this.sprite.setFillStyle(0xff4444);
    });
  }

  /**
   * ダメージを受ける
   */
  takeDamage(amount, sourceX, knockbackForce = 300) {
    if (!this.alive || this.invincible) return false;
    
    this.hp -= amount;
    
    // ノックバック処理
    const dir = this.x > sourceX ? 1 : -1;
    this.knockbackVelocity.x = dir * knockbackForce;
    
    // 無敵時間設定
    this.invincible = true;
    this.invincibleTimer = 300;
    
    if (this.hp <= 0) {
      this.changeState('knockdown');
    } else {
      this.changeState('hurt');
    }
    
    return true;
  }

  /**
   * ノックバック更新
   */
  updateKnockback() {
    if (Math.abs(this.knockbackVelocity.x) > 1) {
      this.x += this.knockbackVelocity.x * (1/60); // 60fps想定
      this.knockbackVelocity.x *= this.knockbackDecay;
    } else {
      this.knockbackVelocity.x = 0;
    }
  }

  /**
   * 状態変更
   */
  changeState(newState) {
    this.previousState = this.state;
    this.state = newState;
    this.stateTimer = 0;
    this.isAttacking = false;
    
    // 状態に応じた色変更（デバッグ用）
    const colors = {
      idle: 0xff4444,
      walk: 0xff8844,
      attack: 0xff0000,
      hurt: 0x8844ff,
      knockdown: 0x444444
    };
    
    if (colors[newState]) {
      this.sprite.setFillStyle(colors[newState]);
    }
  }

  /**
   * 位置同期
   */
  syncPosition() {
    this.sprite.x = this.x;
    this.sprite.y = this.displayY;
    this.body.x = this.x - 24; // 中心座標調整
    this.body.y = this.displayY - 32;
  }

  /**
   * デバッグ情報更新
   */
  updateDebugInfo() {
    if (this.debugText) {
      this.debugText.x = this.x - 20;
      this.debugText.y = this.groundY - 80;
      this.debugText.setText(`HP:${this.hp}\n${this.state.toUpperCase()}`);
    }
  }

  /**
   * 死亡処理
   */
  die() {
    this.alive = false;
    this.sprite.setVisible(false);
    this.debugText.setVisible(false);
    
    // スポーンシステムに死亡通知
    if (this.scene.spawnSystem) {
      this.scene.spawnSystem.onEnemyDead();
    }
    
    // スコア加算
    this.scene.events.emit('enemyKilled', { score: 100, x: this.x, y: this.displayY });
  }

  /**
   * エンティティ破棄
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.debugText) {
      this.debugText.destroy();
    }
  }

  /**
   * 現在の状態を取得
   */
  getState() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      state: this.state,
      position: { x: this.x, y: this.groundY },
      alive: this.alive,
      facingRight: this.facingRight
    };
  }
}