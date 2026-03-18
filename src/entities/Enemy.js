import { DEPTH_THRESHOLD, GROUND_Y_MIN, GROUND_Y_MAX } from '../config/constants.js';

export class Enemy {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y; // 奥行き判定用Y座標（固定）
    this.displayY = y; // 描画用Y座標
    
    // 基本ステータス
    this.hp = config.hp || 30;
    this.maxHp = this.hp;
    this.speed = config.speed || 80;
    this.attackRange = config.attackRange || 60;
    this.attackDamage = config.attackDamage || 10;
    this.attackCooldown = config.attackCooldown || 1500;
    
    // 状態管理
    this.state = 'idle';
    this.facingRight = true;
    this.alive = true;
    this.lastAttackTime = 0;
    this.stateTimer = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // Phaserスプライト作成
    this.sprite = scene.add.rectangle(x, y, 40, 60, 0xff6666);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(40, 60);
    this.sprite.setDepth(this.groundY); // Y座標でソート
    
    // 参照をスプライトに保存（衝突判定用）
    this.sprite.entity = this;
    
    // 初期状態の設定
    this.enterState('idle');
  }

  update(player, time, delta) {
    if (!this.alive) return;
    
    this.stateTimer += delta;
    
    // 無敵時間の管理
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1.0);
      }
    }
    
    // 状態に応じた行動
    switch (this.state) {
      case 'idle':
        this.updateIdle(player, time, delta);
        break;
      case 'walk':
        this.updateWalk(player, time, delta);
        break;
      case 'attack':
        this.updateAttack(player, time, delta);
        break;
      case 'hurt':
        this.updateHurt(player, time, delta);
        break;
      case 'knockdown':
        this.updateKnockdown(player, time, delta);
        break;
    }
    
    // スプライト位置の更新
    this.sprite.x = this.x;
    this.sprite.y = this.displayY;
    
    // 向きに応じてスプライトを反転
    this.sprite.setFlipX(!this.facingRight);
  }

  updateIdle(player, time, delta) {
    // アイドル状態：0.5秒後に歩行開始
    if (this.stateTimer >= 500) {
      this.enterState('walk');
    }
  }

  updateWalk(player, time, delta) {
    // プレイヤーに向かって移動
    this.moveTowardsPlayer(player, delta);
    
    // 攻撃範囲内かチェック
    if (this.inAttackRange(player) && this.canAttack(time)) {
      this.enterState('attack');
    }
  }

  updateAttack(player, time, delta) {
    // 攻撃アニメーション時間（600ms）
    if (this.stateTimer >= 600) {
      if (this.stateTimer >= 300 && this.stateTimer <= 400) {
        // 攻撃判定フレーム（300-400ms）
        this.performAttack(player);
      }
      
      if (this.stateTimer >= 600) {
        this.lastAttackTime = time;
        this.enterState('walk');
      }
    }
  }

  updateHurt(player, time, delta) {
    // 怯み時間（300ms）
    if (this.stateTimer >= 300) {
      if (this.hp <= 0) {
        this.enterState('knockdown');
      } else {
        this.enterState('walk');
      }
    }
  }

  updateKnockdown(player, time, delta) {
    // ノックダウン時間（800ms）
    if (this.stateTimer >= 800) {
      this.destroy();
    }
  }

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
      const moveY = Math.sign(dy) * this.speed * 0.7 * (delta / 1000);
      this.groundY = Phaser.Math.Clamp(
        this.groundY + moveY, 
        GROUND_Y_MIN, 
        GROUND_Y_MAX
      );
      this.displayY = this.groundY;
    }
  }

  inAttackRange(player) {
    const dx = Math.abs(this.x - player.x);
    const dy = Math.abs(this.groundY - player.groundY);
    
    return dx <= this.attackRange && dy <= DEPTH_THRESHOLD;
  }

  canAttack(currentTime) {
    return currentTime - this.lastAttackTime >= this.attackCooldown;
  }

  performAttack(player) {
    if (this.inAttackRange(player) && !player.invincible) {
      // プレイヤーにダメージを与える
      const knockbackX = this.facingRight ? 100 : -100;
      player.takeDamage(this.attackDamage, { x: knockbackX, y: 0 });
      
      // 攻撃エフェクト（簡易）
      this.scene.add.circle(
        player.x, player.displayY - 30, 20, 0xffff00, 0.8
      ).setDepth(1000).setScale(0.1).setAlpha(1);
      
      this.scene.tweens.add({
        targets: this.scene.children.list[this.scene.children.list.length - 1],
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 200,
        onComplete: (tween) => {
          tween.targets[0].destroy();
        }
      });
    }
  }

  takeDamage(amount, knockback = { x: 0, y: 0 }) {
    if (this.invincible || !this.alive) return;
    
    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = 200;
    this.sprite.setAlpha(0.5);
    
    // ノックバック
    if (knockback.x !== 0) {
      this.x += knockback.x;
      // 画面外に出ないようにクランプ
      this.x = Phaser.Math.Clamp(this.x, 0, this.scene.cameras.main.worldView.width);
    }
    
    // 状態遷移
    if (this.hp <= 0) {
      this.enterState('knockdown');
      // スコア加算イベント
      this.scene.events.emit('enemyDefeated', { score: 100 });
    } else {
      this.enterState('hurt');
    }
    
    // ヒットエフェクト
    this.showHitEffect();
  }

  showHitEffect() {
    // 簡易ヒットエフェクト
    const effect = this.scene.add.circle(
      this.x, this.displayY - 20, 15, 0xff0000, 0.6
    );
    effect.setDepth(1000);
    
    this.scene.tweens.add({
      targets: effect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 150,
      onComplete: () => effect.destroy()
    });
  }

  enterState(newState) {
    this.state = newState;
    this.stateTimer = 0;
    
    // 状態に応じた初期化処理
    switch (newState) {
      case 'attack':
        // 攻撃時は移動停止
        this.sprite.body.setVelocity(0, 0);
        break;
      case 'hurt':
        // 怯み時は移動停止
        this.sprite.body.setVelocity(0, 0);
        break;
      case 'knockdown':
        // ノックダウン時は移動停止、色変更
        this.sprite.body.setVelocity(0, 0);
        this.sprite.setTint(0x666666);
        break;
    }
  }

  destroy() {
    this.alive = false;
    if (this.sprite) {
      this.sprite.destroy();
    }
    
    // スポーンシステムに死亡を通知
    this.scene.events.emit('enemyDestroyed');
  }

  // デバッグ用：状態情報を取得
  getDebugInfo() {
    return {
      state: this.state,
      hp: this.hp,
      position: { x: this.x, y: this.groundY },
      facingRight: this.facingRight,
      stateTimer: Math.floor(this.stateTimer)
    };
  }
}