import { BaseEntity } from './BaseEntity.js';

export class Player extends BaseEntity {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // プレイヤー固有設定
    this.maxHp = 100;
    this.hp = this.maxHp;
    this.INVINCIBLE_DURATION = 800; // プレイヤーは長めの無敵時間
    
    // コンボシステム
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET_TIME = 1500;
    
    this.createSprite();
  }

  createSprite() {
    // 開発初期は矩形で表現
    this.sprite = this.scene.add.rectangle(this.x, this.y, 48, 64, 0x3399ff);
    this.scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
    this.body.setCollideWorldBounds(true);
  }

  /**
   * プレイヤー被ダメージ時の処理
   */
  onHurt() {
    // コンボリセット
    this.resetCombo();
    
    // UI更新通知
    this.scene.events.emit('playerHpChange', {
      current: this.hp,
      max: this.maxHp
    });
    
    // 状態をHURTに変更（将来の状態マシン用）
    this.state = 'hurt';
  }

  /**
   * プレイヤー死亡時の処理
   */
  onDeath() {
    super.onDeath();
    
    // ゲームオーバー処理
    this.scene.events.emit('playerDeath');
    this.scene.onGameOver();
  }

  /**
   * コンボリセット
   */
  resetCombo() {
    if (this.comboCount > 0) {
      this.comboCount = 0;
      this.comboTimer = 0;
      this.scene.events.emit('comboReset');
    }
  }

  /**
   * HP回復
   */
  heal(amount) {
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    
    if (this.hp !== oldHp) {
      this.scene.events.emit('playerHpChange', {
        current: this.hp,
        max: this.maxHp
      });
    }
  }

  update(time, delta) {
    super.update(time, delta);
    
    // コンボタイマー管理
    if (this.comboCount > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }
}