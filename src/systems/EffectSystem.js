/**
 * ゲーム演出を管理するシステムクラス
 * フラッシュ、点滅、カメラシェイクなどの視覚効果を統合管理
 */
export class EffectSystem {
  constructor(scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
  }

  /**
   * 画面フラッシュ演出
   * @param {number} color - フラッシュ色（16進数）
   * @param {number} duration - 持続時間（ms）
   * @param {number} intensity - 強度（0.0-1.0）
   */
  flash(color = 0xffffff, duration = 300, intensity = 0.8) {
    return new Promise((resolve) => {
      try {
        // フラッシュ用の矩形オーバーレイを作成
        const flashRect = this.scene.add.rectangle(
          this.camera.centerX,
          this.camera.centerY,
          this.camera.width,
          this.camera.height,
          color,
          intensity
        );
        
        flashRect.setScrollFactor(0); // カメラスクロールの影響を受けない
        flashRect.setDepth(9999); // 最前面に表示
        
        // フェードアウトアニメーション
        this.scene.tweens.add({
          targets: flashRect,
          alpha: 0,
          duration: duration,
          ease: 'Power2.easeOut',
          onComplete: () => {
            flashRect.destroy();
            resolve();
          },
          onCompleteScope: this
        });
      } catch (error) {
        console.error('Flash effect error:', error);
        resolve(); // エラーが発生してもPromiseを解決
      }
    });
  }

  /**
   * オブジェクト点滅演出
   * @param {Phaser.GameObjects.GameObject} target - 対象オブジェクト
   * @param {number} count - 点滅回数
   * @param {number} interval - 点滅間隔（ms）
   */
  blink(target, count = 4, interval = 200) {
    return new Promise((resolve) => {
      if (!target || !target.active) {
        resolve();
        return;
      }

      let currentCount = 0;
      const originalAlpha = target.alpha;
      
      const blinkTween = this.scene.tweens.add({
        targets: target,
        alpha: 0,
        duration: interval / 2,
        ease: 'Power1.easeInOut',
        yoyo: true,
        repeat: count * 2 - 1, // 点滅回数 × 2 - 1（最後は表示状態で終了）
        onRepeat: () => {
          currentCount++;
        },
        onComplete: () => {
          target.alpha = originalAlpha; // 元の透明度に復元
          resolve();
        },
        onCompleteScope: this
      });

      // 安全のためのタイムアウト
      this.scene.time.delayedCall(interval * count * 2 + 1000, () => {
        if (blinkTween.isActive()) {
          blinkTween.stop();
          target.alpha = originalAlpha;
          resolve();
        }
      });
    });
  }

  /**
   * カメラシェイク演出
   * @param {number} intensity - 振動の強さ
   * @param {number} duration - 持続時間（ms）
   */
  shake(intensity = 10, duration = 300) {
    return new Promise((resolve) => {
      this.camera.shake(duration, intensity * 0.01);
      this.scene.time.delayedCall(duration, resolve);
    });
  }

  /**
   * スローモーション演出
   * @param {number} timeScale - 時間スケール（0.1-1.0）
   * @param {number} duration - 持続時間（ms）
   */
  slowMotion(timeScale = 0.3, duration = 1000) {
    return new Promise((resolve) => {
      this.scene.physics.world.timeScale = timeScale;
      this.scene.anims.globalTimeScale = timeScale;
      
      this.scene.time.delayedCall(duration, () => {
        this.scene.physics.world.timeScale = 1.0;
        this.scene.anims.globalTimeScale = 1.0;
        resolve();
      });
    });
  }
}