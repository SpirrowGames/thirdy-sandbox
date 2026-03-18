export class Player {
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
    
    // 戦闘関連
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    
    // 状態管理
    this.state = 'idle';
    this.animationTimer = 0;
    this.canCancel = false; // キャンセル可能フレーム
    
    // 攻撃関連
    this.attackDamage = [15, 18, 25]; // 各段の攻撃力
    this.attackRange = [60, 80, 100]; // 各段のリーチ
    this.attackDuration = [300, 350, 500]; // 各段の持続時間
    this.cancelWindow = [150, 200, 0]; // キャンセル受付時間（3段目は不可）
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // 武器
    this.heldWeapon = null;
    
    this.createSprite();
    this.setupInput();
  }
  
  createSprite() {
    // 開発初期は矩形で実装
    this.sprite = this.scene.add.rectangle(this.x, this.displayY, 48, 64, 0x3399ff);
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(48, 64);
  }
  
  setupInput() {
    this.keys = this.scene.input.keyboard.addKeys('W,A,S,D,Z,X');
    this.cursors = this.scene.input.keyboard.createCursorKeys();
  }
  
  update(time, delta) {
    this.updateTimers(delta);
    this.handleInput();
    this.updateState(delta);
    this.updatePosition();
    this.updateCombo(delta);
  }
  
  updateTimers(delta) {
    if (this.animationTimer > 0) {
      this.animationTimer -= delta;
    }
    
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
  }
  
  handleInput() {
    // 攻撃入力の処理
    if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
      this.tryAttack();
    }
    
    // 移動入力の処理（攻撃中でなければ）
    if (!this.isAttacking()) {
      this.handleMovement();
    }
  }
  
  tryAttack() {
    switch (this.state) {
      case 'idle':
      case 'walk':
        this.startCombo();
        break;
      case 'attack_1':
        if (this.canCancel) {
          this.continueCombo(2);
        }
        break;
      case 'attack_2':
        if (this.canCancel) {
          this.continueCombo(3);
        }
        break;
      case 'attack_3':
        // 3段目からはコンボ継続不可
        break;
    }
  }
  
  startCombo() {
    this.state = 'attack_1';
    this.animationTimer = this.attackDuration[0];
    this.canCancel = false;
    
    // キャンセル受付開始をタイマーで設定
    this.scene.time.delayedCall(this.cancelWindow[0], () => {
      if (this.state === 'attack_1') {
        this.canCancel = true;
      }
    });
    
    this.performAttack(1);
    
    // コンボカウントリセット（新しいコンボ開始）
    this.comboCount = 1;
    this.comboTimer = this.COMBO_RESET;
    
    // UIに通知
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
  }
  
  continueCombo(stage) {
    this.state = `attack_${stage}`;
    this.animationTimer = this.attackDuration[stage - 1];
    this.canCancel = false;
    
    // キャンセル受付設定（3段目以外）
    if (stage < 3 && this.cancelWindow[stage - 1] > 0) {
      this.scene.time.delayedCall(this.cancelWindow[stage - 1], () => {
        if (this.state === `attack_${stage}`) {
          this.canCancel = true;
        }
      });
    }
    
    this.performAttack(stage);
    
    // コンボカウント増加
    this.comboCount++;
    this.comboTimer = this.COMBO_RESET;
    
    // UIに通知
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
  }
  
  performAttack(stage) {
    const damage = this.heldWeapon ? this.heldWeapon.damage : this.attackDamage[stage - 1];
    const range = this.heldWeapon ? this.heldWeapon.range : this.attackRange[stage - 1];
    
    // 攻撃ヒットボックス生成
    this.createAttackHitbox(damage, range, stage);
    
    // ヒットストップ効果
    if (stage === 3) {
      this.scene.hitStop(120); // フィニッシャーは長めのヒットストップ
    }
  }
  
  createAttackHitbox(damage, range, stage) {
    const direction = this.sprite.flipX ? -1 : 1;
    const hitboxX = this.x + (direction * range * 0.5);
    
    // 一時的なヒットボックス作成
    const hitbox = this.scene.physics.add.image(hitboxX, this.groundY, '__WHITE');
    hitbox.setSize(range, 40); // 奥行き判定用の高さ
    hitbox.setVisible(false);
    hitbox.attackData = {
      damage: damage,
      stage: stage,
      owner: this
    };
    
    // 敵との衝突判定
    this.scene.physics.add.overlap(hitbox, this.scene.enemies, (hb, enemy) => {
      if (this.isDepthAligned(enemy)) {
        this.onAttackHit(enemy, hb.attackData);
      }
    });
    
    // ヒットボックスを短時間で破棄
    this.scene.time.delayedCall(100, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });
  }
  
  onAttackHit(enemy, attackData) {
    if (enemy.takeDamage) {
      enemy.takeDamage(attackData.damage, this.x);
      
      // 武器耐久度減少
      if (this.heldWeapon) {
        const broken = this.heldWeapon.use();
        if (broken) {
          this.dropWeapon();
        }
      }
      
      // ヒット効果
      this.scene.showHitEffect(enemy.x, enemy.y, attackData.stage);
    }
  }
  
  updateState(delta) {
    if (this.animationTimer <= 0 && this.isAttacking()) {
      this.state = 'idle';
      this.canCancel = false;
    }
  }
  
  updateCombo(delta) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }
  
  resetCombo() {
    if (this.comboCount > 0) {
      this.comboCount = 0;
      this.comboTimer = 0;
      
      // UIに通知
      this.scene.events.emit('comboUpdate', { count: this.comboCount });
    }
  }
  
  handleMovement() {
    const speed = this.speed;
    let velocityX = 0;
    let velocityY = 0;
    
    // 横移動
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      velocityX = -speed;
      this.sprite.flipX = true;
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      velocityX = speed;
      this.sprite.flipX = false;
    }
    
    // 奥行き移動
    if (this.cursors.up.isDown || this.keys.W.isDown) {
      velocityY = -speed;
    } else if (this.cursors.down.isDown || this.keys.S.isDown) {
      velocityY = speed;
    }
    
    this.sprite.body.setVelocity(velocityX, velocityY);
    
    // 状態更新
    if (velocityX !== 0 || velocityY !== 0) {
      if (this.state === 'idle') {
        this.state = 'walk';
      }
    } else {
      if (this.state === 'walk') {
        this.state = 'idle';
      }
    }
  }
  
  updatePosition() {
    this.x = this.sprite.x;
    this.groundY = Phaser.Math.Clamp(this.sprite.y, 360, 480); // 奥行き制限
    this.sprite.y = this.groundY;
    this.displayY = this.groundY;
  }
  
  isAttacking() {
    return this.state.startsWith('attack_');
  }
  
  isDepthAligned(target) {
    const DEPTH_THRESHOLD = 40;
    return Math.abs(this.groundY - target.groundY) < DEPTH_THRESHOLD;
  }
  
  takeDamage(amount, sourceX = null) {
    if (this.invincible) return false;
    
    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = 500;
    
    // コンボリセット
    this.resetCombo();
    
    // ノックバック
    if (sourceX !== null) {
      const direction = this.x > sourceX ? 1 : -1;
      this.sprite.body.setVelocityX(direction * 300);
      this.scene.time.delayedCall(200, () => {
        this.sprite.body.setVelocityX(0);
      });
    }
    
    // UI更新
    this.scene.events.emit('playerHpChange', { 
      current: this.hp, 
      max: this.maxHp 
    });
    
    return true;
  }
  
  dropWeapon() {
    if (this.heldWeapon) {
      // 武器を地面に落とす
      const droppedWeapon = this.scene.spawnWeapon(
        this.heldWeapon.type, 
        this.x, 
        this.groundY
      );
      
      this.heldWeapon = null;
      this.scene.events.emit('weaponChange', null);
    }
  }
  
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}