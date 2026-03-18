import { BaseEntity } from './BaseEntity.js';

export class Player extends BaseEntity {
  constructor(scene, x, y) {
    super(scene, x, y, { hp: 100 });
    
    // プレイヤー固有プロパティ
    this.speed = 200;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500;
    
    this.heldWeapon = null;
    this.state = 'idle';
    
    this.createSprites();
  }
  
  createSprites() {
    // 開発初期は矩形ボックス
    this.sprite = this.scene.add.rectangle(this.x, this.y, 48, 64, 0x3399ff);
    this.hitbox = this.scene.add.rectangle(this.x, this.groundY, 48, 64, 0x00ff00);
    this.hitbox.setAlpha(0.3); // デバッグ用半透明
    
    // 物理ボディ設定
    this.scene.physics.add.existing(this.sprite);
    this.scene.physics.add.existing(this.hitbox);
  }
  
  updateEntity(time, delta) {
    // プレイヤー固有の更新処理
    this.updateCombo(delta);
    this.handleInput();
    this.updateAnimation();
  }
  
  updateCombo(delta) {
    if (this.comboCount > 0) {
      this.comboTimer += delta;
      if (this.comboTimer > this.COMBO_RESET) {
        this.resetCombo();
      }
    }
  }
  
  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.scene.events.emit('comboUpdate', { count: 0 });
  }
  
  handleInput() {
    // 入力処理（簡略化）
    const cursors = this.scene.input.keyboard.createCursorKeys();
    
    let velocityX = 0;
    let velocityY = 0;
    
    if (cursors.left.isDown) velocityX = -this.speed;
    if (cursors.right.isDown) velocityX = this.speed;
    if (cursors.up.isDown) velocityY = -this.speed;
    if (cursors.down.isDown) velocityY = this.speed;
    
    this.sprite.body.setVelocity(velocityX, 0);
    this.hitbox.body.setVelocity(0, velocityY);
    
    // 位置同期
    this.x = this.sprite.x;
    this.groundY = this.hitbox.y;
  }
  
  updateAnimation() {
    // アニメーション処理（後で実装）
  }
  
  onDamaged(amount) {
    super.onDamaged(amount);
    
    // コンボリセット
    this.resetCombo();
    
    // HP変更通知
    this.scene.events.emit('playerHpChange', {
      current: this.hp,
      max: this.maxHp
    });
  }
  
  onDeathEffect() {
    super.onDeathEffect();
    
    // ゲームオーバー処理
    this.scene.time.delayedCall(1000, () => {
      this.scene.events.emit('gameOver');
    });
  }
}