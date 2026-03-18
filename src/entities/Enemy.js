import { DEPTH_THRESHOLD, GROUND_Y_MIN, GROUND_Y_MAX } from '../constants.js';

export class Enemy {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y; // 奥行き判定用Y座標（固定）
    this.displayY = y; // 描画用Y座標

    // ステータス
    this.hp = config.hp || 30;
    this.maxHp = this.hp;
    this.speed = config.speed || 80; // px/s
    this.attackRange = config.attackRange || 60; // px
    this.attackDamage = config.attackDamage || 10;
    this.attackCooldown = config.attackCooldown || 1500; // ms
    
    // 状態管理
    this.state = 'spawn';
    this.stateTimer = 0;
    this.lastAttackTime = 0;
    this.facingRight = true;
    this.alive = true;

    // 移動・攻撃フラグ
    this.isAttacking = false;
    this.isHurt = false;
    this.knockbackVelocity = { x: 0, y: 0 };

    // Phaserスプライト作成（開発初期は矩形）
    this.sprite = scene.add.rectangle(x, y, 48, 64, 0xff6666);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(40, 56);
    
    // 物理設定
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setDrag(200, 200);

    // シーンの敵グループに追加
    if (scene.enemies) {
      scene.enemies.add(this.sprite);
    }

    // スプライトにエンティティ参照を保存
    this.sprite.entity = this;
  }

  /**
   * 毎フレーム更新
   */
  update(time, delta) {
    if (!this.alive) return;

    const deltaSeconds = delta / 1000;
    this.stateTimer += delta;

    // ノックバック処理
    this.updateKnockback(deltaSeconds);

    // ステートマシン実行
    this.updateStateMachine(time, deltaSeconds);

    // 座標同期
    this.syncSpritePosition();
  }

  /**
   * ステートマシン更新
   */
  updateStateMachine(time, deltaSeconds) {
    const player = this.scene.player;
    if (!player || !player.alive) return;

    switch (this.state) {
      case 'spawn':
        this.handleSpawnState();
        break;
      case 'idle':
        this.handleIdleState();
        break;
      case 'walk':
        this.handleWalkState(player, deltaSeconds);
        break;
      case 'attack':
        this.handleAttackState(player, time);
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
   * スポーン状態処理
   */
  handleSpawnState() {
    if (this.stateTimer > 500) { // 0.5秒後にアクティブ化
      this.changeState('idle');
    }
  }

  /**
   * 待機状態処理
   */
  handleIdleState() {
    if (this.stateTimer > 300) { // 0.3秒後に移動開始
      this.changeState('walk');
    }
  }

  /**
   * 移動状態処理
   */
  handleWalkState(player, deltaSeconds) {
    if (this.isHurt || this.isAttacking) return;

    // プレイヤーとの距離チェック
    if (this.inAttackRange(player)) {
      this.changeState('attack');
      return;
    }

    // プレイヤーに向かって移動
    this.moveTowardsPlayer(player, deltaSeconds);
  }

  /**
   * 攻撃状態処理
   */
  handleAttackState(player, time) {
    if (time - this.lastAttackTime < this.attackCooldown) {
      // クールダウン中は移動状態に戻る
      this.changeState('walk');
      return;
    }

    if (!this.isAttacking) {
      this.performAttack(player, time);
    }
  }

  /**
   * 被弾状態処理
   */
  handleHurtState() {
    if (this.stateTimer > 400) { // 0.4秒で復帰
      this.isHurt = false;
      this.changeState('walk');
    }
  }

  /**
   * ダウン状態処理
   */
  handleKnockdownState() {
    if (this.stateTimer > 1000) { // 1秒で復帰
      this.changeState('walk');
    }
  }

  /**
   * プレイヤーに向かって移動
   */
  moveTowardsPlayer(player, deltaSeconds) {
    const dx = player.x - this.x;
    const dy = player.groundY - this.groundY;
    
    // X軸移動
    if (Math.abs(dx) > 10) {
      const moveX = Math.sign(dx) * this.speed * deltaSeconds;
      this.x += moveX;
      this.facingRight = dx > 0;
    }

    // Y軸移動（奥行き）
    if (Math.abs(dy) > 5) {
      const moveY = Math.sign(dy) * this.speed * 0.7 * deltaSeconds; // Y軸は少し遅く
      this.groundY = Phaser.Math.Clamp(
        this.groundY + moveY,
        GROUND_Y_MIN,
        GROUND_Y_MAX
      );
    }
  }

  /**
   * 攻撃範囲判定
   */
  inAttackRange(player) {
    const dx = Math.abs(this.x - player.x);
    const dy = Math.abs(this.groundY - player.groundY);
    
    return dx <= this.attackRange && dy <= DEPTH_THRESHOLD;
  }

  /**
   * 攻撃実行
   */
  performAttack(player, time) {
    this.isAttacking = true;
    this.lastAttackTime = time;

    // 攻撃アニメーション開始（仮想）
    this.sprite.setTint(0xffaaaa); // 攻撃中は色を変える

    // 0.3秒後にダメージ判定
    this.scene.time.delayedCall(300, () => {
      if (this.alive && this.inAttackRange(player)) {
        player.takeDamage(this.attackDamage, this.x);
      }
    });

    // 0.6秒後に攻撃終了
    this.scene.time.delayedCall(600, () => {
      this.isAttacking = false;
      this.sprite.clearTint();
      this.changeState('walk');
    });
  }

  /**
   * ダメージ処理
   */
  takeDamage(amount, sourceX, knockbackForce = 200) {
    if (!this.alive || this.isHurt) return false;

    this.hp -= amount;
    this.isHurt = true;

    // ノックバック方向計算
    const knockbackDir = this.x > sourceX ? 1 : -1;
    this.knockbackVelocity.x = knockbackDir * knockbackForce;

    // 視覚的フィードバック
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.alive) this.sprite.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
      return true; // 撃破
    } else {
      this.changeState('hurt');
      return false;
    }
  }

  /**
   * ノックバック更新
   */
  updateKnockback(deltaSeconds) {
    if (Math.abs(this.knockbackVelocity.x) > 5) {
      this.x += this.knockbackVelocity.x * deltaSeconds;
      this.knockbackVelocity.x *= 0.9; // 減衰
    } else {
      this.knockbackVelocity.x = 0;
    }
  }

  /**
   * 状態変更
   */
  changeState(newState) {
    this.state = newState;
    this.stateTimer = 0;
  }

  /**
   * スプライト座標同期
   */
  syncSpritePosition() {
    this.sprite.x = this.x;
    this.sprite.y = this.groundY; // 開発初期は groundY を直接使用
    this.sprite.setFlipX(!this.facingRight);
  }

  /**
   * 死亡処理
   */
  die() {
    this.alive = false;
    this.changeState('dead');
    
    // 死亡演出
    this.sprite.setTint(0x666666);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.destroy();
      }
    });

    // スポーンシステムに通知
    if (this.scene.spawnSystem) {
      this.scene.spawnSystem.onEnemyDead();
    }

    // スコア加算
    this.scene.events.emit('enemyDefeated', { score: 100 });
  }

  /**
   * エンティティ破棄
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /**
   * デバッグ情報取得
   */
  getDebugInfo() {
    return {
      state: this.state,
      hp: this.hp,
      position: { x: this.x, y: this.groundY },
      isAttacking: this.isAttacking,
      isHurt: this.isHurt,
      facingRight: this.facingRight
    };
  }
}