class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y;
    this.displayY = y;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200;
    
    // コンボシステム
    this.state = 'idle';
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    this.attackTimer = 0;
    this.ATTACK_DURATION = 300; // ms
    this.COMBO_WINDOW = 200; // コンボ受付時間 ms
    this.canCombo = false;
    
    // 無敌フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // 武器
    this.heldWeapon = null;
    
    // Phaser スプライト
    this.sprite = scene.add.rectangle(x, y, 48, 64, 0x3399ff);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(48, 64);
    
    // 入力設定
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.dashKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }
  
  update(time, delta) {
    this.handleInput(delta);
    this.updateTimers(delta);
    this.updateMovement(delta);
    this.updatePosition();
  }
  
  handleInput(delta) {
    // 攻撃入力処理
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.tryAttack();
    }
    
    // 移動入力は状態によって制限
    if (this.canMove()) {
      this.handleMovementInput();
    }
  }
  
  tryAttack() {
    switch (this.state) {
      case 'idle':
      case 'walk':
        this.startAttack('attack_1');
        break;
        
      case 'attack_1':
      case 'attack_2':
        if (this.canCombo) {
          this.continueCombo();
        }
        break;
        
      case 'attack_3':
        // フィニッシャー中はコンボ不可
        break;
    }
  }
  
  startAttack(attackType) {
    this.state = attackType;
    this.attackTimer = this.ATTACK_DURATION;
    this.canCombo = false;
    this.comboCount = 1;
    this.comboTimer = this.COMBO_RESET;
    
    // コンボ受付開始（攻撃開始から少し後）
    this.scene.time.delayedCall(this.COMBO_WINDOW / 2, () => {
      if (this.state === attackType) {
        this.canCombo = true;
      }
    });
    
    // 攻撃ヒットボックス生成
    this.performAttack(attackType);
    
    // イベント発火
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
  }
  
  continueCombo() {
    const nextAttack = this.getNextAttack();
    if (nextAttack) {
      this.state = nextAttack;
      this.attackTimer = this.ATTACK_DURATION;
      this.canCombo = false;
      this.comboCount++;
      this.comboTimer = this.COMBO_RESET;
      
      // 次のコンボ受付設定（フィニッシャー以外）
      if (nextAttack !== 'attack_3') {
        this.scene.time.delayedCall(this.COMBO_WINDOW / 2, () => {
          if (this.state === nextAttack) {
            this.canCombo = true;
          }
        });
      }
      
      this.performAttack(nextAttack);
      this.scene.events.emit('comboUpdate', { count: this.comboCount });
    }
  }
  
  getNextAttack() {
    switch (this.state) {
      case 'attack_1': return 'attack_2';
      case 'attack_2': return 'attack_3';
      default: return null;
    }
  }
  
  performAttack(attackType) {
    const attackData = this.getAttackData(attackType);
    const direction = this.sprite.flipX ? -1 : 1;
    
    // ヒットボックス生成
    const hitboxX = this.x + direction * attackData.range * 0.5;
    const hitbox = this.scene.physics.add.image(hitboxX, this.groundY, '__WHITE');
    hitbox.setSize(attackData.range, 40);
    hitbox.setVisible(false);
    
    // 敵との衝突判定
    this.scene.physics.add.overlap(hitbox, this.scene.enemies, (hb, enemy) => {
      if (this.isDepthAligned(enemy)) {
        enemy.takeDamage(attackData.damage, this.x);
        this.onHitEnemy();
      }
    });
    
    // ヒットボックス削除
    this.scene.time.delayedCall(attackData.duration, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });
  }
  
  getAttackData(attackType) {
    const baseData = {
      attack_1: { damage: 15, range: 80, duration: 100 },
      attack_2: { damage: 18, range: 90, duration: 120 },
      attack_3: { damage: 25, range: 100, duration: 150 }
    };
    
    // 武器所持時はダメージ増加
    const data = { ...baseData[attackType] };
    if (this.heldWeapon) {
      data.damage += this.heldWeapon.damage;
      data.range = Math.max(data.range, this.heldWeapon.range);
    }
    
    return data;
  }
  
  onHitEnemy() {
    // ヒット時の処理（ヒットストップ等）
    this.scene.hitStop(60);
  }
  
  isDepthAligned(target) {
    return Math.abs(this.groundY - target.groundY) < 40; // DEPTH_THRESHOLD
  }
  
  updateTimers(delta) {
    // 攻撃タイマー
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.endAttack();
      }
    }
    
    // コンボタイマー
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
    
    // 無敵フレーム
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
  }
  
  endAttack() {
    this.state = 'idle';
    this.canCombo = false;
  }
  
  resetCombo() {
    this.comboCount = 0;
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
  }
  
  canMove() {
    return ['idle', 'walk'].includes(this.state);
  }
  
  handleMovementInput() {
    let velocityX = 0;
    let velocityY = 0;
    
    if (this.cursors.left.isDown) {
      velocityX = -this.speed;
      this.sprite.flipX = true;
    } else if (this.cursors.right.isDown) {
      velocityX = this.speed;
      this.sprite.flipX = false;
    }
    
    if (this.cursors.up.isDown) {
      velocityY = -this.speed * 0.5; // Y移動は遅め
    } else if (this.cursors.down.isDown) {
      velocityY = this.speed * 0.5;
    }
    
    this.sprite.body.setVelocity(velocityX, velocityY);
    
    // 状態更新
    if (velocityX !== 0 || velocityY !== 0) {
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }
  }
  
  updateMovement(delta) {
    // Y座標制限
    const minY = 360; // GROUND_Y_MIN
    const maxY = 480; // GROUND_Y_MAX
    
    if (this.sprite.y < minY) {
      this.sprite.y = minY;
      this.sprite.body.setVelocityY(0);
    } else if (this.sprite.y > maxY) {
      this.sprite.y = maxY;
      this.sprite.body.setVelocityY(0);
    }
  }
  
  updatePosition() {
    this.x = this.sprite.x;
    this.y = this.sprite.y;
    this.groundY = this.y; // 基本的にはgroundYとdisplayYは同じ
    this.displayY = this.y;
  }
  
  takeDamage(amount, sourceX = null) {
    if (this.invincible) return;
    
    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = 500; // 0.5秒無敵
    
    // コンボリセット
    this.resetCombo();
    
    // ノックバック
    if (sourceX !== null) {
      const direction = this.x > sourceX ? 1 : -1;
      this.sprite.body.setVelocityX(direction * 300);
      this.scene.time.delayedCall(200, () => {
        if (this.sprite && this.sprite.body) {
          this.sprite.body.setVelocityX(0);
        }
      });
    }
    
    // 状態変更
    this.state = 'hurt';
    this.attackTimer = 0;
    this.canCombo = false;
    
    // 復帰
    this.scene.time.delayedCall(300, () => {
      if (this.state === 'hurt') {
        this.state = 'idle';
      }
    });
    
    // HPイベント発火
    this.scene.events.emit('playerHpChange', { 
      current: this.hp, 
      max: this.maxHp 
    });
    
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  die() {
    this.state = 'dead';
    // ゲームオーバー処理
    this.scene.events.emit('playerDead');
  }
  
  // デバッグ用メソッド
  getDebugInfo() {
    return {
      state: this.state,
      comboCount: this.comboCount,
      comboTimer: Math.round(this.comboTimer),
      attackTimer: Math.round(this.attackTimer),
      canCombo: this.canCombo,
      hp: this.hp
    };
  }
}

export default Player;