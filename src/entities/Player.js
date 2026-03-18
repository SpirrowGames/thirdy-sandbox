import { GROUND_Y_MIN, GROUND_Y_MAX, DEPTH_THRESHOLD } from '../constants.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200; // px/s
    this.groundY = y; // 奥行き判定用Y（ジャンプ中も固定）
    this.displayY = y; // 描画Y（ジャンプ時に変動）
    
    // 戦闘関連
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    
    // 武器
    this.heldWeapon = null;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // 状態
    this.state = 'idle';
    this.facingRight = true;
    this.alive = true;
    
    // スプライト作成（開発初期は矩形ボックス）
    this.sprite = scene.add.rectangle(x, y, 48, 64, 0x3399ff);
    this.sprite.setStrokeStyle(2, 0x0066cc);
    
    // 物理ボディ追加
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
    this.body.setSize(40, 60); // 当たり判定サイズ
    this.body.setCollideWorldBounds(false); // ステージ境界は手動管理
    
    // 入力設定
    this.setupInput();
    
    // 初期位置設定
    this.x = x;
    this.y = y;
  }
  
  setupInput() {
    const cursors = this.scene.input.keyboard.createCursorKeys();
    this.keys = {
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      z: this.scene.input.keyboard.addKey('Z'),
      x: this.scene.input.keyboard.addKey('X')
    };
  }
  
  update(time, delta) {
    if (!this.alive) return;
    
    // 無敵フレーム更新
    this.updateInvincibility(delta);
    
    // コンボタイマー更新
    this.updateComboTimer(delta);
    
    // 移動処理
    this.handleMovement(delta);
    
    // 位置同期
    this.syncPosition();
  }
  
  handleMovement(delta) {
    // 移動中は状態をwalkに変更（攻撃中などは除く）
    const canMove = this.state === 'idle' || this.state === 'walk';
    if (!canMove) return;
    
    let velocityX = 0;
    let velocityY = 0;
    let moving = false;
    
    // X方向の移動（左右）
    if (this.keys.left.isDown) {
      velocityX = -this.speed;
      this.facingRight = false;
      moving = true;
    } else if (this.keys.right.isDown) {
      velocityX = this.speed;
      this.facingRight = true;
      moving = true;
    }
    
    // Y方向の移動（奥行き）
    if (this.keys.up.isDown) {
      velocityY = -this.speed;
      moving = true;
    } else if (this.keys.down.isDown) {
      velocityY = this.speed;
      moving = true;
    }
    
    // 速度設定
    this.body.setVelocity(velocityX, velocityY);
    
    // 状態更新
    if (moving) {
      this.state = 'walk';
    } else if (this.state === 'walk') {
      this.state = 'idle';
    }
    
    // Y座標のクランプ（奥行き制限）
    this.clampGroundY();
    
    // スプライトの向きを更新
    this.updateFacing();
  }
  
  clampGroundY() {
    // groundYをステージの奥行き範囲内に制限
    if (this.groundY < GROUND_Y_MIN) {
      this.groundY = GROUND_Y_MIN;
      this.sprite.y = this.groundY;
      this.body.y = this.groundY - this.body.height / 2;
    } else if (this.groundY > GROUND_Y_MAX) {
      this.groundY = GROUND_Y_MAX;
      this.sprite.y = this.groundY;
      this.body.y = this.groundY - this.body.height / 2;
    }
  }
  
  updateFacing() {
    // スプライトの水平反転（右向きが基本）
    this.sprite.setFlipX(!this.facingRight);
  }
  
  syncPosition() {
    // スプライトの位置を物理ボディと同期
    this.x = this.body.x + this.body.width / 2;
    this.groundY = this.body.y + this.body.height / 2;
    this.displayY = this.groundY; // ジャンプ未実装時は同じ
    
    // ステージ境界チェック（X方向）
    const stageWidth = 3000; // ステージ全幅
    if (this.x < 0) {
      this.x = 0;
      this.body.x = -this.body.width / 2;
    } else if (this.x > stageWidth) {
      this.x = stageWidth;
      this.body.x = stageWidth - this.body.width / 2;
    }
  }
  
  updateInvincibility(delta) {
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1.0); // 透明度を元に戻す
      } else {
        // 点滅効果
        const alpha = Math.sin(this.invincibleTimer * 0.02) > 0 ? 0.5 : 1.0;
        this.sprite.setAlpha(alpha);
      }
    }
  }
  
  updateComboTimer(delta) {
    if (this.comboCount > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }
  
  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    // コンボリセットイベントを発火
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
  }
  
  takeDamage(amount, sourceX = null) {
    if (this.invincible || !this.alive) return;
    
    this.hp -= amount;
    this.hp = Math.max(0, this.hp);
    
    // HPイベント発火
    this.scene.events.emit('playerHpChange', { 
      current: this.hp, 
      max: this.maxHp 
    });
    
    // ノックバック処理
    if (sourceX !== null) {
      const dir = this.x > sourceX ? 1 : -1;
      this.body.setVelocityX(dir * 300);
      this.scene.time.delayedCall(200, () => {
        if (this.alive) this.body.setVelocityX(0);
      });
    }
    
    // 無敵フレーム設定
    this.invincible = true;
    this.invincibleTimer = 1000; // 1秒間無敵
    
    // コンボリセット
    this.resetCombo();
    
    // 死亡判定
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  die() {
    this.alive = false;
    this.state = 'dead';
    this.body.setVelocity(0, 0);
    this.sprite.setTint(0x666666); // グレーアウト
    
    // ゲームオーバーイベント発火
    this.scene.events.emit('playerDead');
  }
  
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
  
  // ゲッター（他のシステムから参照用）
  get x() {
    return this._x || 0;
  }
  
  set x(value) {
    this._x = value;
  }
  
  get y() {
    return this.displayY;
  }
  
  set y(value) {
    this.groundY = value;
    this.displayY = value;
  }
}