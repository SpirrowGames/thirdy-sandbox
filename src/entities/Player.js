export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200; // px/s
    this.alive = true;
    
    // 座標系
    this.x = x;
    this.y = y;
    this.groundY = y; // 奥行き判定用Y（ジャンプ中も固定）
    this.displayY = y; // 描画Y（ジャンプ時に変動）
    this.jumpHeight = 0; // ジャンプ高度
    
    // 戦闘関連
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    this.facingRight = true;
    
    // 武器システム
    this.heldWeapon = null;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    this.INVINCIBLE_DURATION = 1000; // ms
    
    // 状態管理
    this.state = 'idle';
    this.stateTimer = 0;
    
    // 移動関連
    this.velocityX = 0;
    this.velocityY = 0;
    
    // スプライト作成（開発初期は矩形ボックス）
    this.createSprite();
    
    // 物理ボディ設定
    this.setupPhysics();
  }
  
  createSprite() {
    // 開発初期：矩形ボックスで実装
    this.sprite = this.scene.add.rectangle(this.x, this.displayY, 48, 64, 0x3399ff);
    this.sprite.setStrokeStyle(2, 0x0066cc);
    
    // 後でスプライトに切り替える際のための予約
    // this.sprite = this.scene.add.sprite(this.x, this.displayY, 'player');
    // this.sprite.play('player_idle');
  }
  
  setupPhysics() {
    // 物理ボディを追加
    this.scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
    
    // 当たり判定サイズ設定
    this.body.setSize(40, 60);
    this.body.setOffset(4, 2);
    
    // 重力無効化（ベルトスクロールは2.5D空間）
    this.body.setGravityY(0);
    
    // 境界設定（奥行き制限）
    this.body.setCollideWorldBounds(false);
  }
  
  update(time, delta) {
    if (!this.alive) return;
    
    // タイマー更新
    this.updateTimers(delta);
    
    // 入力処理
    this.handleInput();
    
    // 移動処理
    this.updateMovement(delta);
    
    // 状態更新
    this.updateState(time, delta);
    
    // 表示位置更新
    this.updateDisplay();
    
    // コンボタイマー管理
    this.updateCombo(delta);
  }
  
  updateTimers(delta) {
    // 無敵時間更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1.0);
      } else {
        // 点滅エフェクト
        const alpha = Math.sin(this.invincibleTimer * 0.02) > 0 ? 0.5 : 1.0;
        this.sprite.setAlpha(alpha);
      }
    }
    
    // 状態タイマー更新
    this.stateTimer += delta;
  }
  
  handleInput() {
    const cursors = this.scene.cursors;
    if (!cursors) return;
    
    // X軸移動
    this.velocityX = 0;
    if (cursors.left.isDown) {
      this.velocityX = -this.speed;
      this.facingRight = false;
    } else if (cursors.right.isDown) {
      this.velocityX = this.speed;
      this.facingRight = true;
    }
    
    // Y軸移動（奥行き）
    this.velocityY = 0;
    if (cursors.up.isDown) {
      this.velocityY = -this.speed;
    } else if (cursors.down.isDown) {
      this.velocityY = this.speed;
    }
  }
  
  updateMovement(delta) {
    // X座標更新
    this.x += this.velocityX * (delta / 1000);
    
    // Y座標更新（奥行き制限）
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    
    this.groundY += this.velocityY * (delta / 1000);
    this.groundY = Phaser.Math.Clamp(this.groundY, GROUND_Y_MIN, GROUND_Y_MAX);
    
    // Phaser物理ボディに反映
    this.body.setVelocityX(this.velocityX);
    this.body.setVelocityY(this.velocityY);
    
    // スプライトの向き更新
    this.sprite.setFlipX(!this.facingRight);
  }
  
  updateState(time, delta) {
    switch (this.state) {
      case 'idle':
        if (this.velocityX !== 0 || this.velocityY !== 0) {
          this.setState('walk');
        }
        break;
        
      case 'walk':
        if (this.velocityX === 0 && this.velocityY === 0) {
          this.setState('idle');
        }
        break;
        
      case 'attack_1':
      case 'attack_2':
      case 'attack_3':
        // 攻撃アニメーション管理（後で実装）
        if (this.stateTimer > 300) { // 300ms後に復帰
          this.setState('idle');
        }
        break;
        
      case 'hurt':
        if (this.stateTimer > 200) {
          this.setState('idle');
        }
        break;
    }
  }
  
  updateDisplay() {
    // ジャンプ高度を考慮した表示Y座標
    this.displayY = this.groundY - this.jumpHeight;
    
    // スプライト位置更新
    this.sprite.x = this.x;
    this.sprite.y = this.displayY;
    
    // 遠近感表現（オプション）
    const scale = 0.8 + (this.groundY - 360) / (480 - 360) * 0.4;
    this.sprite.setScale(scale);
  }
  
  updateCombo(delta) {
    if (this.comboCount > 0) {
      this.comboTimer += delta;
      if (this.comboTimer > this.COMBO_RESET) {
        this.resetCombo();
      }
    }
  }
  
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateTimer = 0;
      
      // 状態変更時の処理
      this.onStateChange(newState);
    }
  }
  
  onStateChange(state) {
    // 色で状態を表現（開発用）
    switch (state) {
      case 'idle':
        this.sprite.setFillStyle(0x3399ff);
        break;
      case 'walk':
        this.sprite.setFillStyle(0x33ff99);
        break;
      case 'attack_1':
      case 'attack_2':
      case 'attack_3':
        this.sprite.setFillStyle(0xff3333);
        break;
      case 'hurt':
        this.sprite.setFillStyle(0xff9933);
        break;
    }
  }
  
  takeDamage(amount, sourceX = null, knockback = null) {
    if (!this.alive || this.invincible) return;
    
    this.hp -= amount;
    this.hp = Math.max(0, this.hp);
    
    // 無敵時間開始
    this.invincible = true;
    this.invincibleTimer = this.INVINCIBLE_DURATION;
    
    // ノックバック処理
    if (sourceX !== null) {
      const dir = this.x > sourceX ? 1 : -1;
      this.body.setVelocityX(dir * 300);
      this.scene.time.delayedCall(200, () => {
        if (this.body) this.body.setVelocityX(0);
      });
    }
    
    // コンボリセット
    this.resetCombo();
    
    // 状態変更
    this.setState('hurt');
    
    // HP変更イベント発行
    this.scene.events.emit('playerHpChange', {
      current: this.hp,
      max: this.maxHp
    });
    
    // 死亡判定
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  heal(amount) {
    this.hp += amount;
    this.hp = Math.min(this.maxHp, this.hp);
    
    this.scene.events.emit('playerHpChange', {
      current: this.hp,
      max: this.maxHp
    });
  }
  
  addCombo() {
    this.comboCount++;
    this.comboTimer = 0;
    
    this.scene.events.emit('comboUpdate', {
      count: this.comboCount
    });
  }
  
  resetCombo() {
    if (this.comboCount > 0) {
      this.comboCount = 0;
      this.comboTimer = 0;
      
      this.scene.events.emit('comboUpdate', {
        count: this.comboCount
      });
    }
  }
  
  pickupWeapon(weapon) {
    // 既に武器を持っている場合は捨てる
    if (this.heldWeapon) {
      this.dropWeapon();
    }
    
    this.heldWeapon = weapon;
    
    this.scene.events.emit('weaponChange', {
      name: weapon.name,
      durability: weapon.durability,
      max: weapon.maxDurability
    });
  }
  
  dropWeapon() {
    if (this.heldWeapon) {
      // 武器を地面に落とす処理（後で実装）
      this.heldWeapon = null;
      
      this.scene.events.emit('weaponChange', null);
    }
  }
  
  die() {
    this.alive = false;
    this.setState('dead');
    
    // 死亡エフェクト
    this.sprite.setTint(0x666666);
    
    // ゲームオーバー処理
    this.scene.events.emit('playerDeath');
  }
  
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
  
  // デバッグ用メソッド
  getDebugInfo() {
    return {
      hp: this.hp,
      state: this.state,
      position: { x: this.x, y: this.groundY },
      combo: this.comboCount,
      weapon: this.heldWeapon?.name || 'none',
      invincible: this.invincible
    };
  }
}