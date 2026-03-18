import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y_MIN, GROUND_Y_MAX, DEPTH_THRESHOLD } from '../constants.js';

export class Enemy {
  constructor(scene, x, y, type = 'grunt') {
    this.scene = scene;
    this.type = type;
    
    // 基本ステータス
    this.hp = 30;
    this.maxHp = 30;
    this.speed = 80;
    this.attackRange = 60;
    this.attackDamage = 10;
    this.attackCooldown = 1500;
    this.lastAttackTime = 0;
    
    // 位置情報
    this.x = x;
    this.groundY = Math.max(GROUND_Y_MIN, Math.min(GROUND_Y_MAX, y));
    this.displayY = this.groundY;
    this.facingRight = false; // デフォルトでプレイヤー方向（左）を向く
    
    // 状態管理
    this.state = 'idle';
    this.stateTimer = 0;
    this.alive = true;
    
    // 被弾・ノックバック
    this.invincible = false;
    this.invincibleTimer = 0;
    this.knockbackVelocity = { x: 0, y: 0 };
    
    // Phaserスプライト作成
    this.createSprite();
    
    // 物理ボディ設定
    this.setupPhysics();
    
    // 初期状態設定
    this.enterState('idle');
  }
  
  createSprite() {
    // 開発初期は矩形ボックスで実装
    this.sprite = this.scene.add.rectangle(this.x, this.displayY, 48, 64, 0xff6666);
    this.sprite.setStrokeStyle(2, 0x660000);
    
    // 将来のスプライト対応用
    // this.sprite = this.scene.add.sprite(this.x, this.displayY, 'enemy_grunt');
    // this.sprite.play('grunt_idle');
  }
  
  setupPhysics() {
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(40, 60);
    this.sprite.body.setOffset(4, 2);
    this.sprite.body.setCollideWorldBounds(true);
    
    // 重力無効化（2Dベルトスクロール）
    this.sprite.body.setGravityY(0);
  }
  
  update(time, delta) {
    if (!this.alive) return;
    
    this.stateTimer += delta;
    this.updateInvincibility(delta);
    this.updateKnockback(delta);
    this.updateState(time, delta);
    this.updateSprite();
  }
  
  updateState(time, delta) {
    const player = this.scene.player;
    if (!player || !player.alive) return;
    
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
  
  handleIdleState(time, delta, player) {
    // スポーン後0.5秒でwalk状態へ移行
    if (this.stateTimer > 500) {
      this.enterState('walk');
    }
  }
  
  handleWalkState(time, delta, player) {
    // プレイヤーに向かって移動
    this.moveTowardsPlayer(player, delta);
    
    // 攻撃範囲内に入ったら攻撃状態へ
    if (this.inAttackRange(player)) {
      this.enterState('attack');
    }
  }
  
  handleAttackState(time, delta, player) {
    // 攻撃実行
    if (this.stateTimer > 300 && time - this.lastAttackTime > this.attackCooldown) {
      this.performAttack(player);
      this.lastAttackTime = time;
    }
    
    // 攻撃アニメーション終了後はwalk状態に戻る
    if (this.stateTimer > 800) {
      this.enterState('walk');
    }
  }
  
  handleHurtState(time, delta, player) {
    // 被弾硬直時間（150ms）後にwalk状態に復帰
    if (this.stateTimer > 150) {
      this.enterState('walk');
    }
  }
  
  handleKnockdownState(time, delta, player) {
    // ノックダウン時間（1000ms）後に復帰または死亡
    if (this.stateTimer > 1000) {
      if (this.hp <= 0) {
        this.destroy();
      } else {
        this.enterState('walk');
      }
    }
  }
  
  enterState(newState) {
    this.state = newState;
    this.stateTimer = 0;
    
    // 状態変更時の処理
    switch (newState) {
      case 'idle':
        this.sprite.body.setVelocity(0, 0);
        break;
      case 'walk':
        // 移動可能状態
        break;
      case 'attack':
        this.sprite.body.setVelocity(0, 0);
        break;
      case 'hurt':
        // 被弾時は移動停止
        this.sprite.body.setVelocity(0, 0);
        break;
      case 'knockdown':
        this.sprite.body.setVelocity(0, 0);
        break;
    }
    
    // 将来のアニメーション対応
    this.updateAnimation();
  }
  
  moveTowardsPlayer(player, delta) {
    if (this.state !== 'walk') return;
    
    const dx = player.x - this.x;
    const dy = player.groundY - this.groundY;
    
    // X軸移動
    if (Math.abs(dx) > 5) {
      const dirX = Math.sign(dx);
      this.sprite.body.setVelocityX(dirX * this.speed);
      this.facingRight = dirX > 0;
    } else {
      this.sprite.body.setVelocityX(0);
    }
    
    // Y軸移動（奥行き）
    if (Math.abs(dy) > 5) {
      const dirY = Math.sign(dy);
      this.sprite.body.setVelocityY(dirY * this.speed * 0.7); // Y移動は少し遅く
    } else {
      this.sprite.body.setVelocityY(0);
    }
    
    // 移動範囲制限
    this.groundY = Math.max(GROUND_Y_MIN, Math.min(GROUND_Y_MAX, this.sprite.y));
  }
  
  inAttackRange(player) {
    const dx = Math.abs(this.x - player.x);
    const dy = Math.abs(this.groundY - player.groundY);
    
    return dx < this.attackRange && dy < DEPTH_THRESHOLD;
  }
  
  performAttack(player) {
    if (!this.inAttackRange(player)) return;
    
    // プレイヤーにダメージを与える
    player.takeDamage(this.attackDamage, this.x);
    
    // 攻撃エフェクト（簡単な点滅）
    this.sprite.setTint(0xffaaaa);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite) this.sprite.clearTint();
    });
  }
  
  takeDamage(amount, sourceX = null, knockback = true) {
    if (this.invincible || !this.alive) return false;
    
    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = 300; // 300ms無敵時間
    
    // 被弾エフェクト
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite) this.sprite.clearTint();
    });
    
    // ノックバック処理
    if (knockback && sourceX !== null) {
      const direction = this.x > sourceX ? 1 : -1;
      this.knockbackVelocity.x = direction * 200;
      this.sprite.body.setVelocityX(this.knockbackVelocity.x);
    }
    
    // 状態遷移
    if (this.hp <= 0) {
      this.enterState('knockdown');
      this.scene.events.emit('enemyDefeated', { enemy: this, score: 100 });
    } else {
      this.enterState('hurt');
    }
    
    return true;
  }
  
  updateInvincibility(delta) {
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1);
      } else {
        // 点滅エフェクト
        this.sprite.setAlpha(Math.sin(this.invincibleTimer * 0.02) * 0.5 + 0.5);
      }
    }
  }
  
  updateKnockback(delta) {
    // ノックバック減衰
    if (Math.abs(this.knockbackVelocity.x) > 0) {
      this.knockbackVelocity.x *= 0.95;
      if (Math.abs(this.knockbackVelocity.x) < 10) {
        this.knockbackVelocity.x = 0;
        this.sprite.body.setVelocityX(0);
      }
    }
  }
  
  updateSprite() {
    // 座標同期
    this.x = this.sprite.x;
    this.displayY = this.sprite.y;
    this.groundY = this.displayY; // 簡略化（ジャンプ未実装）
    
    // 向き反映
    this.sprite.setFlipX(!this.facingRight);
    
    // 奥行きによるスケール調整（オプション）
    const scale = 0.8 + (this.groundY - GROUND_Y_MIN) / (GROUND_Y_MAX - GROUND_Y_MIN) * 0.4;
    this.sprite.setScale(scale);
  }
  
  updateAnimation() {
    // 将来のスプライトアニメーション対応用
    // 現在は矩形なので色で状態を表現
    switch (this.state) {
      case 'idle':
        this.sprite.fillColor = 0xff6666;
        break;
      case 'walk':
        this.sprite.fillColor = 0xff9999;
        break;
      case 'attack':
        this.sprite.fillColor = 0xff3333;
        break;
      case 'hurt':
        this.sprite.fillColor = 0xffaaaa;
        break;
      case 'knockdown':
        this.sprite.fillColor = 0x666666;
        break;
    }
  }
  
  destroy() {
    this.alive = false;
    
    // 死亡エフェクト（簡単なフェードアウト）
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 300,
      onComplete: () => {
        if (this.sprite) {
          this.sprite.destroy();
        }
      }
    });
    
    // SpawnSystemに通知
    this.scene.events.emit('enemyDestroyed', this);
  }
  
  // デバッグ用
  getDebugInfo() {
    return {
      type: this.type,
      state: this.state,
      hp: this.hp,
      position: { x: this.x, y: this.groundY },
      alive: this.alive
    };
  }
}