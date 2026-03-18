import { GAME_HEIGHT, DEPTH_THRESHOLD } from '../config.js';

/**
 * 雑魚敵（工場労働者型）
 * ステートマシン: idle → walk → attack → hurt → knockdown
 */
export class Enemy {
  constructor(scene, x, groundY, type = 'grunt') {
    this.scene = scene;
    this.type = type;
    
    // 基本プロパティ
    this.hp = 30;
    this.maxHp = 30;
    this.speed = 80; // px/s
    this.attackRange = 60; // px（X軸）
    this.attackDamage = 10;
    this.attackCooldown = 1500; // ms
    this.lastAttackTime = 0;
    
    // 位置
    this.x = x;
    this.groundY = groundY;
    this.displayY = groundY;
    this.facingRight = false; // プレイヤーの方向を向く
    
    // ステートマシン
    this.state = 'idle';
    this.stateTimer = 0;
    this.alive = true;
    
    // 無敵フレーム（被弾時）
    this.invincible = false;
    this.invincibleTimer = 0;
    this.INVINCIBLE_DURATION = 300; // ms
    
    // ノックバック
    this.knockbackVelocity = { x: 0, y: 0 };
    this.KNOCKBACK_FRICTION = 0.9;
    
    this.createSprite();
  }
  
  createSprite() {
    // 矩形スプライトで描画（48x64px、赤色）
    this.sprite = this.scene.add.rectangle(this.x, this.displayY, 48, 64, 0xff4444);
    this.scene.physics.add.existing(this.sprite);
    
    // 当たり判定設定
    this.sprite.body.setSize(48, 64);
    this.sprite.body.setOffset(0, 0);
    
    // 敵グループに追加（GameSceneで管理）
    if (this.scene.enemies) {
      this.scene.enemies.add(this.sprite);
    }
    
    // スプライトに自身の参照を保存
    this.sprite.enemyRef = this;
  }
  
  update(time, delta) {
    if (!this.alive) return;
    
    this.stateTimer += delta;
    this.updateInvincibility(delta);
    this.updateKnockback(delta);
    
    // プレイヤー参照を取得
    const player = this.scene.player;
    if (!player || !player.alive) return;
    
    // ステートマシン実行
    this.executeStateMachine(player, time, delta);
    
    // スプライト位置更新
    this.updateSpritePosition();
  }
  
  executeStateMachine(player, time, delta) {
    switch (this.state) {
      case 'idle':
        this.handleIdleState();
        break;
        
      case 'walk':
        this.handleWalkState(player, delta);
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
  
  handleIdleState() {
    // スポーン後0.5秒でwalkへ遷移
    if (this.stateTimer > 500) {
      this.changeState('walk');
    }
  }
  
  handleWalkState(player, delta) {
    // プレイヤーに向かって移動
    this.moveTowardsPlayer(player, delta);
    
    // 攻撃範囲に入ったら攻撃状態へ
    if (this.inAttackRange(player)) {
      this.changeState('attack');
    }
  }
  
  handleAttackState(player, time) {
    // クールダウン中は待機
    if (time - this.lastAttackTime < this.attackCooldown) {
      return;
    }
    
    // 攻撃実行
    if (this.inAttackRange(player)) {
      this.performAttack(player);
      this.lastAttackTime = time;
    }
    
    // 攻撃後はwalkに戻る
    this.changeState('walk');
  }
  
  handleHurtState() {
    // 150ms後にwalkに復帰
    if (this.stateTimer > 150) {
      this.changeState('walk');
    }
  }
  
  handleKnockdownState() {
    // 500ms後に消滅
    if (this.stateTimer > 500) {
      this.destroy();
    }
  }
  
  moveTowardsPlayer(player, delta) {
    const dx = player.x - this.x;
    const moveSpeed = this.speed * (delta / 1000);
    
    if (Math.abs(dx) > 5) {
      // X方向移動
      this.x += Math.sign(dx) * moveSpeed;
      this.facingRight = dx > 0;
    }
    
    // Y方向（奥行き）もプレイヤーに近づく
    const dy = player.groundY - this.groundY;
    if (Math.abs(dy) > 5) {
      this.groundY += Math.sign(dy) * moveSpeed * 0.5;
    }
  }
  
  inAttackRange(player) {
    const dx = Math.abs(this.x - player.x) < this.attackRange;
    const dy = Math.abs(this.groundY - player.groundY) < DEPTH_THRESHOLD;
    return dx && dy;
  }
  
  performAttack(player) {
    // 攻撃ヒット判定
    if (this.inAttackRange(player) && !player.invincible) {
      player.takeDamage(this.attackDamage, this.x);
    }
    
    // 攻撃エフェクト（矩形を一瞬点滅）
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
      }
    });
  }
  
  takeDamage(amount, sourceX = null) {
    if (!this.alive || this.invincible) return;
    
    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = 0;
    
    // ダメージエフェクト（赤点滅）
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
      }
    });
    
    // ノックバック適用
    if (sourceX !== null) {
      const knockbackDirection = this.x > sourceX ? 1 : -1;
      this.knockbackVelocity.x = knockbackDirection * 200;
    }
    
    // HP判定
    if (this.hp <= 0) {
      this.changeState('knockdown');
      // 敵撃破をGameSceneに通知
      if (this.scene.onEnemyDefeated) {
        this.scene.onEnemyDefeated(this);
      }
    } else {
      this.changeState('hurt');
    }
  }
  
  updateInvincibility(delta) {
    if (this.invincible) {
      this.invincibleTimer += delta;
      if (this.invincibleTimer >= this.INVINCIBLE_DURATION) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }
  }
  
  updateKnockback(delta) {
    // ノックバック適用
    if (Math.abs(this.knockbackVelocity.x) > 1) {
      this.x += this.knockbackVelocity.x * (delta / 1000);
      this.knockbackVelocity.x *= this.KNOCKBACK_FRICTION;
    } else {
      this.knockbackVelocity.x = 0;
    }
  }
  
  updateSpritePosition() {
    this.sprite.x = this.x;
    this.sprite.y = this.displayY;
    
    // 向きに応じてスプライトを反転
    this.sprite.scaleX = this.facingRight ? 1 : -1;
    
    // 無敵フレーム中は半透明
    this.sprite.alpha = this.invincible ? 0.5 : 1.0;
  }
  
  changeState(newState) {
    this.state = newState;
    this.stateTimer = 0;
  }
  
  destroy() {
    this.alive = false;
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}