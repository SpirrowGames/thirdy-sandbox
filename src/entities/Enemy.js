import { GAME_CONFIG } from '../config/constants.js';

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
    this.y = y;
    this.groundY = y; // 奥行き判定用Y座標（固定）
    this.displayY = y; // 描画用Y座標
    
    // 状態管理
    this.state = 'idle';
    this.alive = true;
    this.facingRight = false;
    
    // タイマー
    this.stateTimer = 0;
    this.lastAttackTime = 0;
    this.hurtTimer = 0;
    
    // 物理・描画オブジェクト
    this.createSprite();
    this.createHitbox();
  }

  createSprite() {
    // 開発初期は矩形ボックスで実装
    this.sprite = this.scene.add.rectangle(this.x, this.displayY, 48, 64, 0xff6666);
    this.sprite.setDepth(this.groundY); // Y座標に応じて描画順を設定
    
    // 将来のスプライト移行用の準備
    // this.sprite = this.scene.add.sprite(this.x, this.displayY, 'enemy_grunt');
    // this.sprite.play('enemy_idle');
  }

  createHitbox() {
    // 当たり判定用の物理ボディ
    this.hitbox = this.scene.physics.add.image(this.x, this.groundY, '__WHITE');
    this.hitbox.setSize(48, 64);
    this.hitbox.setVisible(false); // 当たり判定は非表示
    this.hitbox.body.setImmovable(false);
    
    // Enemyオブジェクトへの参照を設定（衝突判定で使用）
    this.hitbox.enemyRef = this;
  }

  update(time, delta, player) {
    if (!this.alive) return;

    this.stateTimer += delta;
    this.updateState(time, delta, player);
    this.updatePosition();
    this.updateFacing(player);
  }

  updateState(time, delta, player) {
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
    // スポーン後0.5秒でwalk状態に移行
    if (this.stateTimer > 500) {
      this.changeState('walk');
    }
  }

  handleWalkState(time, delta, player) {
    if (!player || !player.alive) return;

    // プレイヤーに向かって移動
    this.moveTowardsPlayer(player, delta);
    
    // 攻撃範囲内かつ攻撃可能な場合
    if (this.inAttackRange(player) && this.canAttack(time)) {
      this.changeState('attack');
    }
  }

  handleAttackState(time, delta, player) {
    // 攻撃開始時の処理
    if (this.stateTimer < 100) {
      // 攻撃予備動作
      this.hitbox.body.setVelocity(0, 0);
    } else if (this.stateTimer >= 300 && this.stateTimer < 400) {
      // 実際の攻撃判定
      if (this.inAttackRange(player)) {
        this.performAttack(player);
      }
    } else if (this.stateTimer > 600) {
      // 攻撃終了、クールダウン設定
      this.lastAttackTime = time;
      this.changeState('idle');
    }
  }

  handleHurtState(time, delta, player) {
    // ノックバック中は移動停止
    if (this.stateTimer > 300) {
      if (this.hp <= 0) {
        this.changeState('knockdown');
      } else {
        this.changeState('idle');
      }
    }
  }

  handleKnockdownState(time, delta, player) {
    // 倒れた状態、一定時間後に消滅
    if (this.stateTimer > 1000) {
      this.destroy();
    }
  }

  moveTowardsPlayer(player, delta) {
    const dx = player.x - this.x;
    const dy = player.groundY - this.groundY;
    
    // X方向の移動
    if (Math.abs(dx) > 10) {
      const dirX = Math.sign(dx);
      const velocityX = dirX * this.speed;
      this.hitbox.body.setVelocityX(velocityX);
    } else {
      this.hitbox.body.setVelocityX(0);
    }
    
    // Y方向の移動（奥行き）
    if (Math.abs(dy) > 10) {
      const dirY = Math.sign(dy);
      const velocityY = dirY * this.speed * 0.6; // Y移動は少し遅く
      this.hitbox.body.setVelocityY(velocityY);
    } else {
      this.hitbox.body.setVelocityY(0);
    }
    
    // 境界チェック
    this.clampToPlayArea();
  }

  clampToPlayArea() {
    const minY = GAME_CONFIG.GROUND_Y_MIN;
    const maxY = GAME_CONFIG.GROUND_Y_MAX;
    
    if (this.hitbox.y < minY) {
      this.hitbox.y = minY;
      this.groundY = minY;
    } else if (this.hitbox.y > maxY) {
      this.hitbox.y = maxY;
      this.groundY = maxY;
    }
  }

  inAttackRange(player) {
    if (!player || !player.alive) return false;
    
    const dx = Math.abs(this.x - player.x);
    const dy = Math.abs(this.groundY - player.groundY);
    
    return dx < this.attackRange && dy < GAME_CONFIG.DEPTH_THRESHOLD;
  }

  canAttack(currentTime) {
    return currentTime - this.lastAttackTime > this.attackCooldown;
  }

  performAttack(player) {
    if (!player || !player.alive) return;
    
    // 攻撃ヒットボックスを一時的に生成
    const dir = this.facingRight ? 1 : -1;
    const hitboxX = this.x + dir * (this.attackRange * 0.5);
    
    const attackHitbox = this.scene.physics.add.image(hitboxX, this.groundY, '__WHITE');
    attackHitbox.setSize(this.attackRange, GAME_CONFIG.DEPTH_THRESHOLD * 2);
    attackHitbox.setVisible(false);
    
    // プレイヤーとの衝突判定
    this.scene.physics.add.overlap(attackHitbox, player.hitbox, () => {
      if (this.inAttackRange(player)) {
        player.takeDamage(this.attackDamage, this.x);
      }
    });
    
    // 攻撃ヒットボックスを短時間で削除
    this.scene.time.delayedCall(100, () => {
      if (attackHitbox && attackHitbox.active) {
        attackHitbox.destroy();
      }
    });
  }

  updatePosition() {
    // 物理ボディの位置を同期
    this.x = this.hitbox.x;
    this.groundY = this.hitbox.y;
    this.displayY = this.groundY;
    
    // スプライトの位置を更新
    this.sprite.x = this.x;
    this.sprite.y = this.displayY;
    this.sprite.setDepth(this.groundY); // 奥行きに応じた描画順
  }

  updateFacing(player) {
    if (player && player.alive) {
      this.facingRight = player.x > this.x;
      this.sprite.setFlipX(!this.facingRight);
    }
  }

  changeState(newState) {
    if (this.state === newState) return;
    
    this.state = newState;
    this.stateTimer = 0;
    
    // 状態変更時の色変更（デバッグ用）
    switch (newState) {
      case 'idle':
        this.sprite.setFillStyle(0xff6666);
        break;
      case 'walk':
        this.sprite.setFillStyle(0xffaa66);
        break;
      case 'attack':
        this.sprite.setFillStyle(0xff3333);
        break;
      case 'hurt':
        this.sprite.setFillStyle(0xffffff);
        break;
      case 'knockdown':
        this.sprite.setFillStyle(0x666666);
        break;
    }
  }

  takeDamage(amount, sourceX = null) {
    if (!this.alive || this.state === 'hurt' || this.state === 'knockdown') {
      return;
    }

    this.hp -= amount;
    this.changeState('hurt');
    
    // ノックバック処理
    if (sourceX !== null) {
      const knockbackDir = this.x > sourceX ? 1 : -1;
      this.hitbox.body.setVelocityX(knockbackDir * 200);
      
      // ノックバック終了後に速度をリセット
      this.scene.time.delayedCall(200, () => {
        if (this.hitbox && this.hitbox.body) {
          this.hitbox.body.setVelocityX(0);
        }
      });
    }
    
    // ヒットストップ効果
    this.scene.time.delayedCall(80, () => {
      // 短時間の停止演出
    });

    // スコア加算（GameSceneに通知）
    if (this.hp <= 0) {
      this.scene.events.emit('enemyDefeated', { 
        type: 'grunt', 
        score: 100,
        x: this.x,
        y: this.groundY
      });
    }
  }

  destroy() {
    this.alive = false;
    
    if (this.sprite) {
      this.sprite.destroy();
    }
    
    if (this.hitbox) {
      this.hitbox.destroy();
    }
    
    // SpawnSystemに敵の死亡を通知
    this.scene.events.emit('enemyDestroyed');
  }

  // デバッグ用：敵の状態を表示
  getDebugInfo() {
    return {
      state: this.state,
      hp: `${this.hp}/${this.maxHp}`,
      position: `(${Math.round(this.x)}, ${Math.round(this.groundY)})`,
      stateTimer: Math.round(this.stateTimer)
    };
  }
}