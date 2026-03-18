import { DEPTH_THRESHOLD, GROUND_Y_MIN, GROUND_Y_MAX } from '../config/constants.js';

/**
 * 雑魚敵（工場労働者型）クラス
 * ステートマシンによる行動制御とプレイヤー追跡AI
 */
export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, groundY) {
    super(scene, x, y);
    
    // 基本ステータス
    this.hp = 30;
    this.maxHp = 30;
    this.speed = 80; // px/s
    this.attackRange = 60; // px（X軸）
    this.attackDamage = 10;
    this.attackCooldown = 1500; // ms
    this.lastAttackTime = 0;
    
    // 位置情報
    this.groundY = groundY || y;
    this.displayY = this.groundY;
    this.facingRight = false; // 初期は左向き（プレイヤー方向）
    
    // AI状態
    this.state = 'idle';
    this.stateTimer = 0;
    this.alive = true;
    
    // 移動関連
    this.velocity = { x: 0, y: 0 };
    this.targetX = x;
    this.targetY = groundY;
    
    // 描画用スプライト（開発初期は矩形）
    this.sprite = scene.add.rectangle(0, 0, 48, 64, 0xff6666);
    this.add(this.sprite);
    
    // 当たり判定用ボディ
    scene.physics.add.existing(this);
    this.body.setSize(48, 64);
    this.body.setCollideWorldBounds(true);
    
    // シーンに追加
    scene.add.existing(this);
    
    // デバッグ情報表示（開発用）
    this.debugText = scene.add.text(0, -40, '', {
      fontSize: '12px',
      fill: '#ffffff'
    });
    this.add(this.debugText);
  }

  /**
   * メインアップデートループ
   * ステートマシンとAIロジックを実行
   */
  update(time, delta, player) {
    if (!this.alive || !player) return;
    
    this.stateTimer += delta;
    
    // ステート別処理
    switch (this.state) {
      case 'idle':
        this.updateIdle(time, delta, player);
        break;
      case 'walk':
        this.updateWalk(time, delta, player);
        break;
      case 'attack':
        this.updateAttack(time, delta, player);
        break;
      case 'hurt':
        this.updateHurt(time, delta, player);
        break;
      case 'knockdown':
        this.updateKnockdown(time, delta, player);
        break;
    }
    
    // 物理更新
    this.updatePhysics(delta);
    
    // デバッグ情報更新
    this.updateDebugInfo(player);
  }

  /**
   * IDLE状態の処理
   * スポーン後の初期待機
   */
  updateIdle(time, delta, player) {
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    // 0.5秒後にwalk状態へ移行
    if (this.stateTimer >= 500) {
      this.changeState('walk');
    }
  }

  /**
   * WALK状態の処理
   * プレイヤーに向かって移動
   */
  updateWalk(time, delta, player) {
    // プレイヤーへの追跡
    this.moveTowardsPlayer(player);
    
    // 攻撃範囲内かチェック
    if (this.inAttackRange(player) && this.canAttack(time)) {
      this.changeState('attack');
    }
  }

  /**
   * ATTACK状態の処理
   * 攻撃実行とクールダウン管理
   */
  updateAttack(time, delta, player) {
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    // 攻撃開始（ステート移行直後）
    if (this.stateTimer < 50) {
      this.performAttack(player);
      this.lastAttackTime = time;
    }
    
    // 攻撃アニメーション完了後にwalkへ戻る
    if (this.stateTimer >= 600) {
      this.changeState('walk');
    }
  }

  /**
   * HURT状態の処理
   * 被弾後の硬直
   */
  updateHurt(time, delta, player) {
    // 150ms後に復帰
    if (this.stateTimer >= 150) {
      if (this.hp <= 0) {
        this.changeState('knockdown');
      } else {
        this.changeState('walk');
      }
    }
  }

  /**
   * KNOCKDOWN状態の処理
   * 撃破後の消滅処理
   */
  updateKnockdown(time, delta, player) {
    this.velocity.x *= 0.9; // 慣性で減速
    
    // 1秒後に消滅
    if (this.stateTimer >= 1000) {
      this.destroy();
    }
  }

  /**
   * プレイヤーに向かって移動
   */
  moveTowardsPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.groundY - this.groundY;
    
    // X軸方向の移動
    if (Math.abs(dx) > 5) {
      const moveX = Math.sign(dx) * this.speed;
      this.velocity.x = moveX;
      this.facingRight = dx > 0;
    } else {
      this.velocity.x = 0;
    }
    
    // Y軸方向の移動（奥行き）
    if (Math.abs(dy) > 5) {
      const moveY = Math.sign(dy) * this.speed * 0.7; // Y軸は少し遅めに
      this.velocity.y = moveY;
    } else {
      this.velocity.y = 0;
    }
  }

  /**
   * 攻撃範囲内判定
   */
  inAttackRange(player) {
    const dx = Math.abs(this.x - player.x) < this.attackRange;
    const dy = this.isDepthAligned(player);
    return dx && dy;
  }

  /**
   * 奥行き判定（Y軸）
   */
  isDepthAligned(target) {
    return Math.abs(this.groundY - target.groundY) < DEPTH_THRESHOLD;
  }

  /**
   * 攻撃可能判定（クールダウンチェック）
   */
  canAttack(currentTime) {
    return currentTime - this.lastAttackTime >= this.attackCooldown;
  }

  /**
   * 攻撃実行
   */
  performAttack(player) {
    // 攻撃範囲内かつ奥行きが合っている場合のみダメージ
    if (this.inAttackRange(player)) {
      // プレイヤーにダメージを与える
      const knockbackDir = this.facingRight ? 1 : -1;
      player.takeDamage(this.attackDamage, this.x);
      
      // 攻撃エフェクト（簡易）
      this.scene.cameras.main.shake(100, 0.01);
    }
  }

  /**
   * ダメージ処理
   */
  takeDamage(amount, sourceX = null) {
    if (!this.alive || this.state === 'hurt' || this.state === 'knockdown') {
      return;
    }
    
    this.hp -= amount;
    
    // ノックバック処理
    if (sourceX !== null) {
      const knockbackDir = this.x > sourceX ? 1 : -1;
      this.velocity.x = knockbackDir * 200;
    }
    
    // 状態変更
    if (this.hp <= 0) {
      this.changeState('knockdown');
      this.alive = false;
      
      // スコア加算イベント
      this.scene.events.emit('enemyDefeated', { 
        enemy: this, 
        score: 100 
      });
    } else {
      this.changeState('hurt');
    }
    
    // 被弾エフェクト
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });
  }

  /**
   * 状態変更
   */
  changeState(newState) {
    this.state = newState;
    this.stateTimer = 0;
  }

  /**
   * 物理更新
   */
  updatePhysics(delta) {
    // 速度を位置に適用
    this.x += this.velocity.x * (delta / 1000);
    this.groundY += this.velocity.y * (delta / 1000);
    
    // Y軸境界チェック
    this.groundY = Phaser.Math.Clamp(this.groundY, GROUND_Y_MIN, GROUND_Y_MAX);
    
    // 表示位置更新
    this.y = this.groundY;
    
    // 向き反映
    this.sprite.setFlipX(!this.facingRight);
  }

  /**
   * デバッグ情報更新
   */
  updateDebugInfo(player) {
    if (this.scene.sys.game.config.physics.arcade.debug) {
      const distance = Phaser.Math.Distance.Between(this.x, this.groundY, player.x, player.groundY);
      const inRange = this.inAttackRange(player) ? 'YES' : 'NO';
      this.debugText.setText(`${this.state}\nHP:${this.hp}\nRange:${inRange}\nDist:${Math.floor(distance)}`);
    }
  }

  /**
   * 破棄処理
   */
  destroy() {
    if (this.debugText) {
      this.debugText.destroy();
    }
    
    // SpawnSystemに通知
    this.scene.events.emit('enemyDestroyed', this);
    
    super.destroy();
  }
}