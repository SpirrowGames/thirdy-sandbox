import { GROUND_Y_MIN, GROUND_Y_MAX, DEPTH_THRESHOLD } from '../constants.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200; // px/s
    this.alive = true;
    
    // 位置情報
    this.groundY = y; // 奥行き判定用Y（ジャンプ中も固定）
    this.displayY = y; // 描画Y（ジャンプ時に変動）
    this.jumpHeight = 0; // ジャンプ高度
    
    // 戦闘関連
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    
    // 武器
    this.heldWeapon = null;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // 向き
    this.facingRight = true;
    
    // Phaserスプライトの作成（開発初期は矩形）
    this.createSprite(x, y);
    this.setupPhysics();
    this.setupInput();
  }
  
  createSprite(x, y) {
    // 開発初期は矩形ボックスで実装
    this.sprite = this.scene.add.rectangle(x, y, 48, 64, 0x3399ff);
    this.sprite.setStrokeStyle(2, 0x000000);
    
    // 当たり判定用のボディを追加
    this.scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
  }
  
  setupPhysics() {
    // 重力を無効化（ベルトスクロールなので）
    this.body.setGravityY(0);
    
    // 当たり判定のサイズ設定
    this.body.setSize(40, 60);
    
    // 移動の減衰を設定（滑らかな停止）
    this.body.setDrag(800);
  }
  
  setupInput() {
    // キーボード入力の設定
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keys = this.scene.input.keyboard.addKeys('Z,X');
  }
  
  update(time, delta) {
    if (!this.alive) return;
    
    this.handleMovement(delta);
    this.updatePosition();
    this.updateTimers(delta);
    this.updateVisuals();
  }
  
  handleMovement(delta) {
    const { left, right, up, down } = this.cursors;
    
    // X軸移動（左右）
    if (left.isDown) {
      this.body.setVelocityX(-this.speed);
      this.facingRight = false;
    } else if (right.isDown) {
      this.body.setVelocityX(this.speed);
      this.facingRight = true;
    } else {
      // キーが押されていない場合は減衰で自然停止
      // setDragで設定済みなので何もしない
    }
    
    // Y軸移動（奥行き）
    if (up.isDown) {
      this.body.setVelocityY(-this.speed);
    } else if (down.isDown) {
      this.body.setVelocityY(this.speed);
    } else {
      this.body.setVelocityY(0);
    }
  }
  
  updatePosition() {
    // Y座標を奥行き範囲内にクランプ
    if (this.sprite.y < GROUND_Y_MIN) {
      this.sprite.y = GROUND_Y_MIN;
      this.body.y = GROUND_Y_MIN;
      this.body.setVelocityY(0);
    } else if (this.sprite.y > GROUND_Y_MAX) {
      this.sprite.y = GROUND_Y_MAX;
      this.body.y = GROUND_Y_MAX;
      this.body.setVelocityY(0);
    }
    
    // groundYを更新（奥行き判定用）
    this.groundY = this.sprite.y;
    
    // displayYを更新（ジャンプ時に使用）
    this.displayY = this.groundY - this.jumpHeight;
    this.sprite.y = this.displayY;
    
    // 現在の位置を記録
    this.x = this.sprite.x;
    this.y = this.sprite.y;
  }
  
  updateTimers(delta) {
    // コンボタイマーの更新
    if (this.comboCount > 0) {
      this.comboTimer += delta;
      if (this.comboTimer >= this.COMBO_RESET) {
        this.resetCombo();
      }
    }
    
    // 無敵フレームの更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1);
      }
    }
  }
  
  updateVisuals() {
    // 向きに応じてスプライトを反転
    this.sprite.setFlipX(!this.facingRight);
    
    // 奥行きに応じてスケールを調整（遠近感の演出）
    const depthRatio = (this.groundY - GROUND_Y_MIN) / (GROUND_Y_MAX - GROUND_Y_MIN);
    const scale = 0.8 + (depthRatio * 0.4); // 0.8〜1.2の範囲
    this.sprite.setScale(scale);
    
    // 無敵フレーム中は点滅
    if (this.invincible) {
      const alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
      this.sprite.setAlpha(alpha);
    }
  }
  
  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.scene.events.emit('comboUpdate', { count: 0 });
  }
  
  takeDamage(amount, knockbackX = 0) {
    if (this.invincible || !this.alive) return;
    
    this.hp = Math.max(0, this.hp - amount);
    this.resetCombo();
    
    // ノックバック処理
    if (knockbackX !== 0) {
      this.body.setVelocityX(knockbackX);
    }
    
    // 無敵フレーム開始
    this.invincible = true;
    this.invincibleTimer = 1000; // 1秒間無敵
    
    // HPイベント発火
    this.scene.events.emit('playerHpChange', { 
      current: this.hp, 
      max: this.maxHp 
    });
    
    // HP0で死亡処理
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  die() {
    this.alive = false;
    this.body.setVelocity(0, 0);
    // 死亡アニメーションや処理をここに追加
  }
  
  // 奥行き判定用のヘルパーメソッド
  isDepthAligned(target) {
    return Math.abs(this.groundY - target.groundY) < DEPTH_THRESHOLD;
  }
  
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}