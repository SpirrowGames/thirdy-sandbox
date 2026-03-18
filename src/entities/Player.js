import { GAME_CONFIG } from '../config/constants.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.alive = true;
    
    // 位置情報
    this.x = x;
    this.groundY = y;           // 奥行き判定用Y座標（ジャンプ中も固定）
    this.displayY = y;          // 描画用Y座標（ジャンプ時に変動）
    this.jumpHeight = 0;        // ジャンプの高さ
    
    // 移動関連
    this.speedX = GAME_CONFIG.PLAYER_SPEED_X;
    this.speedY = GAME_CONFIG.PLAYER_SPEED_Y;
    this.facingRight = true;
    
    // 戦闘関連
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500;    // ms
    this.heldWeapon = null;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // 状態管理
    this.state = 'idle';        // idle, walk, attack_1, attack_2, attack_3, dash, grab, special, hurt
    this.stateTimer = 0;
    
    this.createSprites();
    this.setupInput();
  }
  
  createSprites() {
    // 開発初期：矩形ボックスで表現
    this.sprite = this.scene.add.rectangle(this.x, this.displayY, 48, 64, 0x3399ff);
    this.scene.physics.add.existing(this.sprite);
    
    // 当たり判定用ボックス（不可視）
    this.hitbox = this.scene.add.rectangle(this.x, this.groundY, 40, 60, 0xff0000);
    this.hitbox.setVisible(false);
    this.scene.physics.add.existing(this.hitbox);
    
    // 初期スケール設定
    this.updateScale();
  }
  
  setupInput() {
    // Phaserのキーボード入力設定
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keys = this.scene.input.keyboard.addKeys('Z,X');
  }
  
  update(time, delta) {
    this.stateTimer += delta;
    this.updateMovement(delta);
    this.updatePosition();
    this.updateScale();
    this.updateState(time, delta);
  }
  
  updateMovement(delta) {
    // 移動中でない状態の場合のみ移動処理を実行
    if (!this.canMove()) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }
    
    let velocityX = 0;
    let velocityY = 0;
    let isMoving = false;
    
    // X方向の移動（横スクロール）
    if (this.cursors.left.isDown) {
      velocityX = -this.speedX;
      this.facingRight = false;
      isMoving = true;
    } else if (this.cursors.right.isDown) {
      velocityX = this.speedX;
      this.facingRight = true;
      isMoving = true;
    }
    
    // Y方向の移動（奥行き）
    if (this.cursors.up.isDown) {
      velocityY = -this.speedY; // 上方向（画面奥）
      isMoving = true;
    } else if (this.cursors.down.isDown) {
      velocityY = this.speedY;  // 下方向（画面手前）
      isMoving = true;
    }
    
    // 速度設定
    this.sprite.body.setVelocity(velocityX, velocityY);
    
    // 状態更新
    if (this.state === 'idle' && isMoving) {
      this.setState('walk');
    } else if (this.state === 'walk' && !isMoving) {
      this.setState('idle');
    }
  }
  
  updatePosition() {
    // スプライトの位置を取得
    this.x = this.sprite.x;
    const newGroundY = this.sprite.y;
    
    // Y座標をGROUND_Y範囲内にクランプ
    this.groundY = Phaser.Math.Clamp(
      newGroundY, 
      GAME_CONFIG.GROUND_Y_MIN, 
      GAME_CONFIG.GROUND_Y_MAX
    );
    
    // 表示Y座標の計算（ジャンプ考慮）
    this.displayY = this.groundY - this.jumpHeight;
    
    // スプライトの実際の位置を更新
    this.sprite.setPosition(this.x, this.displayY);
    
    // 当たり判定ボックスの位置更新（groundY固定）
    this.hitbox.setPosition(this.x, this.groundY);
    
    // 向きに応じてスプライトを反転
    this.sprite.setFlipX(!this.facingRight);
  }
  
  updateScale() {
    // Y座標に応じた遠近感スケールの計算
    const { GROUND_Y_MIN, GROUND_Y_MAX, SCALE_MIN, SCALE_MAX } = GAME_CONFIG;
    
    // groundYの範囲を0-1に正規化
    const normalizedY = (this.groundY - GROUND_Y_MIN) / (GROUND_Y_MAX - GROUND_Y_MIN);
    
    // スケール値を計算（奥が小さく、手前が大きく）
    const scale = SCALE_MIN + (SCALE_MAX - SCALE_MIN) * normalizedY;
    
    this.sprite.setScale(scale);
    
    // Z-indexの更新（手前のオブジェクトが上に描画される）
    this.sprite.setDepth(this.groundY);
  }
  
  canMove() {
    // 移動可能な状態かチェック
    return ['idle', 'walk'].includes(this.state);
  }
  
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateTimer = 0;
      this.onStateEnter(newState);
    }
  }
  
  onStateEnter(state) {
    switch (state) {
      case 'idle':
        // アイドル状態の初期化
        break;
      case 'walk':
        // 歩行状態の初期化
        break;
      // 他の状態は将来実装
    }
  }
  
  updateState(time, delta) {
    // 状態別の更新処理
    switch (this.state) {
      case 'idle':
        this.updateIdleState(time, delta);
        break;
      case 'walk':
        this.updateWalkState(time, delta);
        break;
      // 他の状態は将来実装
    }
  }
  
  updateIdleState(time, delta) {
    // アイドル状態での処理
    // 現在は特別な処理なし
  }
  
  updateWalkState(time, delta) {
    // 歩行状態での処理
    // 現在は特別な処理なし
  }
  
  // デバッグ用メソッド
  getDebugInfo() {
    return {
      x: Math.round(this.x),
      groundY: Math.round(this.groundY),
      displayY: Math.round(this.displayY),
      state: this.state,
      facingRight: this.facingRight,
      scale: Math.round(this.sprite.scaleX * 100) / 100
    };
  }
  
  destroy() {
    this.sprite.destroy();
    this.hitbox.destroy();
  }
}