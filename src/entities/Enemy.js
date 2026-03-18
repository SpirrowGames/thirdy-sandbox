import { DEPTH_THRESHOLD, GROUND_Y_MIN, GROUND_Y_MAX } from '../config/constants.js';

/**
 * 敵の基本クラス
 * ステートマシン（IDLE→WALK→ATTACK→HURT→KNOCKDOWN）を管理
 */
export class Enemy {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    
    // 基本ステータス
    this.hp = config.hp || 30;
    this.maxHp = this.hp;
    this.speed = config.speed || 80;
    this.attackRange = config.attackRange || 60;
    this.attackDamage = config.attackDamage || 10;
    this.attackCooldown = config.attackCooldown || 1500;
    
    // 位置情報
    this.x = x;
    this.groundY = Math.max(GROUND_Y_MIN, Math.min(GROUND_Y_MAX, y));
    this.displayY = this.groundY;
    
    // ステート管理
    this.state = 'idle';
    this.stateTimer = 0;
    this.lastAttackTime = 0;
    
    // 移動・戦闘フラグ
    this.facingRight = true;
    this.alive = true;
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // ノックバック
    this.knockbackVelocityX = 0;
    this.knockbackDecay = 0.9;
    
    // Phaserスプライト（開発初期は矩形）
    this.sprite = scene.add.rectangle(x, this.displayY, 48, 64, 0xff6666);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(48, 64);
    
    // 物理プロパティ
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setDrag(200, 0);
  }

  /**
   * 毎フレーム更新
   */
  update(time, delta, player) {
    if (!this.alive) return;
    
    this.stateTimer += delta;
    this.updateInvincibility(delta);
    this.updateKnockback(delta);
    this.updateStateManager(time, delta, player);
    this.updatePhysics();
  }

  /**
   * ステートマシンの更新
   */
  updateStateManager(time, delta, player) {
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
   * IDLEステート処理
   */
  handleIdleState(time, delta, player) {
    // 0.5秒後にWALKステートに移行
    if (this.stateTimer >= 500) {
      this.changeState('walk');
    }
  }

  /**
   * WALKステート処理
   */
  handleWalkState(time, delta, player) {
    if (!player || !player.alive) return;

    // プレイヤーに向かって移動
    this.moveTowardsPlayer(player);

    // 攻撃範囲内に入ったらATTACKステートに移行
    if (this.inAttackRange(player)) {
      this.changeState('attack');
    }
  }

  /**
   * ATTACKステート処理
   */
  handleAttackState(time, delta, player) {
    // 攻撃クールダウンチェック
    if (time - this.lastAttackTime >= this.attackCooldown) {
      this.performAttack(player);
      this.lastAttackTime = time;
    }

    // 攻撃後、1秒でWALKステートに戻る
    if (this.stateTimer >= 1000) {
      this.changeState('walk');
    }
  }

  /**
   * HURTステート処理
   */
  handleHurtState(time, delta, player) {
    // 150ms後にWALKステートに復帰
    if (this.stateTimer >= 150) {
      if (this.hp <= 0) {
        this.changeState('knockdown');
      } else {
        this.changeState('walk');
      }
    }
  }

  /**
   * KNOCKDOWNステート処理
   */
  handleKnockdownState(time, delta, player) {
    // 1秒後に消滅
    if (this.stateTimer >= 1000) {
      this.destroy();
    }
  }

  /**
   * ステート変更
   */
  changeState(newState) {
    this.state = newState;
    this.stateTimer = 0;
    
    // ステート変更時の処理
    switch (newState) {
      case 'hurt':
        this.sprite.setTint(0xff0000); // 赤色点滅
        this.scene.time.delayedCall(100, () => {
          if (this.sprite) this.sprite.clearTint();
        });
        break;
      case 'knockdown':
        this.sprite.setAlpha(0.5);
        break;
    }
  }

  /**
   * プレイヤーに向かって移動
   */
  moveTowardsPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.groundY - this.groundY;
    
    // X軸移動
    if (Math.abs(dx) > 10) {
      const moveX = dx > 0 ? this.speed : -this.speed;
      this.sprite.body.setVelocityX(moveX);
      this.facingRight = dx > 0;
    } else {
      this.sprite.body.setVelocityX(0);
    }
    
    // Y軸移動（奥行き）
    if (Math.abs(dy) > 10) {
      const moveY = dy > 0 ? this.speed * 0.5 : -this.speed * 0.5;
      this.sprite.body.setVelocityY(moveY);
    } else {
      this.sprite.body.setVelocityY(0);
    }
  }

  /**
   * 攻撃範囲内判定
   */
  inAttackRange(player) {
    const dx = Math.abs(this.x - player.x);
    const dy = Math.abs(this.groundY - player.groundY);
    
    return dx < this.attackRange && dy < DEPTH_THRESHOLD;
  }

  /**
   * 攻撃実行
   */
  performAttack(player) {
    if (!player || !this.inAttackRange(player)) return;

    // プレイヤーにダメージを与える
    const knockbackDir = player.x > this.x ? 1 : -1;
    player.takeDamage(this.attackDamage, this.x);
    
    // 攻撃演出（一時的なヒットボックス生成）
    this.createAttackHitbox();
  }

  /**
   * 攻撃ヒットボックス生成
   */
  createAttackHitbox() {
    const dir = this.facingRight ? 1 : -1;
    const hitbox = this.scene.add.rectangle(
      this.x + dir * this.attackRange * 0.5,
      this.groundY,
      this.attackRange,
      DEPTH_THRESHOLD * 2,
      0xff0000
    );
    hitbox.setAlpha(0.3);
    
    // 100ms後に削除
    this.scene.time.delayedCall(100, () => {
      if (hitbox) hitbox.destroy();
    });
  }

  /**
   * ダメージを受ける
   */
  takeDamage(amount, sourceX = null) {
    if (!this.alive || this.invincible) return false;

    this.hp -= amount;
    this.setInvincible(300); // 300ms無敵

    // ノックバック適用
    if (sourceX !== null) {
      const knockbackDir = this.x > sourceX ? 1 : -1;
      this.knockbackVelocityX = knockbackDir * 300;
    }

    // HPが0以下なら死亡、そうでなければHURTステート
    if (this.hp <= 0) {
      this.hp = 0;
      this.changeState('hurt'); // HURTステートから自動でKNOCKDOWNに移行
    } else {
      this.changeState('hurt');
    }

    return true;
  }

  /**
   * 無敵状態設定
   */
  setInvincible(duration) {
    this.invincible = true;
    this.invincibleTimer = duration;
  }

  /**
   * 無敵状態更新
   */
  updateInvincibility(delta) {
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }
  }

  /**
   * ノックバック更新
   */
  updateKnockback(delta) {
    if (Math.abs(this.knockbackVelocityX) > 10) {
      this.sprite.body.setVelocityX(this.knockbackVelocityX);
      this.knockbackVelocityX *= this.knockbackDecay;
    } else {
      this.knockbackVelocityX = 0;
    }
  }

  /**
   * 物理更新
   */
  updatePhysics() {
    // スプライト位置を更新
    this.x = this.sprite.x;
    this.groundY = Math.max(GROUND_Y_MIN, Math.min(GROUND_Y_MAX, this.sprite.y));
    this.displayY = this.groundY;
    
    // 向きに応じてスプライトを反転
    this.sprite.setFlipX(!this.facingRight);
  }

  /**
   * エンティティ破棄
   */
  destroy() {
    this.alive = false;
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    // GameSceneに死亡を通知
    if (this.scene.onEnemyDestroyed) {
      this.scene.onEnemyDestroyed(this);
    }
  }

  /**
   * デバッグ情報取得
   */
  getDebugInfo() {
    return {
      state: this.state,
      hp: `${this.hp}/${this.maxHp}`,
      position: `(${Math.round(this.x)}, ${Math.round(this.groundY)})`,
      invincible: this.invincible,
      alive: this.alive
    };
  }
}