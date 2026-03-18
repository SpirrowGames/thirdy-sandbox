import { Enemy } from './Enemy.js';
import { ENEMY_TYPES } from '../config/constants.js';

/**
 * 工場労働者型の雑魚敵
 */
export class Grunt extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, ENEMY_TYPES.grunt);
    
    // グラント固有の設定
    this.sprite.setFillStyle(0x996633); // 茶色
    this.sprite.setStrokeStyle(2, 0x664422);
  }

  /**
   * グラント固有の攻撃演出
   */
  createAttackHitbox() {
    super.createAttackHitbox();
    
    // 追加の視覚効果（パンチエフェクト）
    const effect = this.scene.add.circle(
      this.x + (this.facingRight ? 30 : -30),
      this.groundY,
      15,
      0xffff00
    );
    effect.setAlpha(0.7);
    
    // フェードアウトアニメーション
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      onComplete: () => effect.destroy()
    });
  }
}