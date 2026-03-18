import { GAME_CONFIG, PLAYER_CONFIG } from '../constants.js';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // 基本ステータス
    this.hp = PLAYER_CONFIG.MAX_HP;
    this.maxHp = PLAYER_CONFIG.MAX_HP;
    this.speed = PLAYER_CONFIG.SPEED;
    this.groundY = y;           // 奥行き判定用Y（ジャンプ中も固定）
    this.displayY = y;          // 描画Y（ジャンプ時に変動）
    
    // 戦闘関連
    this.comboCount = 0;
    this.comboTimer = 0;
    this.heldWeapon = null;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // 移動関連
    this.facingRight = true;
    this.isMoving = false;
    
    // 状態管理
    this.state = 'idle';
    
    // スプライト作成（開発初期は矩形）
    this.sprite = scene.add.rectangle(0, 0, 48, 64, 0x3399ff);
    this.add(this.sprite);
    
    // 物理ボディを追加
    scene.physics.add.existing(this);
    this.body.setSize(48, 64);
    this.body.setCollideWorldBounds(true);
    
    // シーンに追加
    scene.add.existing(this);
    
    // 入力システムの初期化
    this.initInput(scene);
  }
  
  initInput(scene) {
    // キーボード入力の設定
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      'left': Phaser.Input.Keyboard.KeyCodes.LEFT,
      'right': Phaser.Input.Keyboard.KeyCodes.RIGHT,
      'up': Phaser.Input.Keyboard.KeyCodes.UP,
      'down': Phaser.Input.Keyboard.KeyCodes.DOWN,
      'z': Phaser.Input.Keyboard.KeyCodes.Z,
      'x': Phaser.Input.Keyboard.KeyCodes.X,
    });
  }
  
  update(time, delta) {
    // 移動処理の更新
    this.updateMovement(delta);
    
    // コンボタイマーの更新
    this.updateComboTimer(delta);
    
    // 無敵フレームの更新
    this.updateInvincibleTimer(delta);
    
    // 表示位置の同期
    this.updateDisplay();
  }
  
  updateMovement(delta) {
    if (this.state === 'hurt' || this.state === 'knockdown') {
      return; // ダメージ中は移動不可
    }
    
    let velocityX = 0;
    let velocityY = 0;
    this.isMoving = false;
    
    // X軸移動（左右）
    if (this.keys.left.isDown) {
      velocityX = -this.speed;
      this.facingRight = false;
      this.isMoving = true;
    } else if (this.keys.right.isDown) {
      velocityX = this.speed;
      this.facingRight = true;
      this.isMoving = true;
    }
    
    // Y軸移動（奥行き）
    if (this.keys.up.isDown) {
      velocityY = -this.speed; // 上方向（奥側）
      this.isMoving = true;
    } else if (this.keys.down.isDown) {
      velocityY = this.speed;  // 下方向（手前側）
      this.isMoving = true;
    }
    
    // 速度を設定
    this.body.setVelocity(velocityX, velocityY);
    
    // Y座標のクランプ処理
    this.clampGroundY();
    
    // スプライトの向きを更新
    this.updateFacing();
    
    // 状態の更新
    this.updateMovementState();
  }
  
  clampGroundY() {
    // groundYを制限範囲内にクランプ
    const currentY = this.y;
    const clampedY = Phaser.Math.Clamp(
      currentY, 
      GAME_CONFIG.GROUND_Y_MIN, 
      GAME_CONFIG.GROUND_Y_MAX
    );
    
    if (currentY !== clampedY) {
      this.y = clampedY;
      this.groundY = clampedY;
      this.body.setVelocityY(0); // Y軸の速度をリセット
    } else {
      this.groundY = currentY;
    }
  }
  
  updateFacing() {
    // スプライトの向きを更新（左向きの時は反転）
    this.sprite.setFlipX(!this.facingRight);
  }
  
  updateMovementState() {
    if (this.state === 'idle' || this.state === 'walk') {
      if (this.isMoving) {
        this.state = 'walk';
      } else {
        this.state = 'idle';
      }
    }
  }
  
  updateComboTimer(delta) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }
  
  updateInvincibleTimer(delta) {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1); // 透明度を元に戻す
      } else {
        // 無敵中は点滅
        const alpha = Math.sin(this.invincibleTimer * 0.02) * 0.5 + 0.5;
        this.sprite.setAlpha(alpha);
      }
    }
  }
  
  updateDisplay() {
    // 表示Y座標を更新（ジャンプ処理などで使用）
    this.displayY = this.groundY;
  }
  
  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
  }
  
  // 移動を一時停止する（攻撃中など）
  stopMovement() {
    this.body.setVelocity(0, 0);
  }
  
  // 強制移動（ノックバックなど）
  forceMove(velocityX, velocityY, duration = 200) {
    this.body.setVelocity(velocityX, velocityY);
    this.scene.time.delayedCall(duration, () => {
      if (this.body) {
        this.body.setVelocity(0, 0);
      }
    });
  }
  
  // デバッグ情報の取得
  getDebugInfo() {
    return {
      position: { x: Math.round(this.x), y: Math.round(this.y) },
      groundY: Math.round(this.groundY),
      state: this.state,
      facing: this.facingRight ? 'right' : 'left',
      isMoving: this.isMoving,
      velocity: { 
        x: Math.round(this.body.velocity.x), 
        y: Math.round(this.body.velocity.y) 
      }
    };
  }
}