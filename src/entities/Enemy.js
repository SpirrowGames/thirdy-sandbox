import { BaseEntity } from './BaseEntity.js';

export class Enemy extends BaseEntity {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // 敵固有設定
    this.maxHp = 30;
    this.hp = this.maxHp;
    this.scoreValue = 100;
    
    this.createSprite();
  }

  createSprite() {
    // 開発初期は矩形で表現
    this.sprite = this.scene.add.rectangle(this.x, this.y, 32, 48, 0xff6666);
    this.scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
  }

  /**
   * 敵死亡時の処理
   */
  onDeath() {
    // スコア加算
    this.scene.addScore(this.scoreValue);
    
    // SpawnSystemに通知
    if (this.scene.spawnSystem) {
      this.scene.spawnSystem.onEnemyDead();
    }
    
    // 死亡エフェクト
    this.playDeathEffect();
    
    super.onDeath();
  }

  /**
   * 死亡エフェクト
   */
  playDeathEffect() {
    // 簡単なフェードアウト
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Power2'
    });
  }
}