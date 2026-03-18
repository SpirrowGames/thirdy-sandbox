/**
 * ヒットストップ（打撃感演出）を管理するクラス
 * 攻撃ヒット時に全体の時間を一時停止し、打撃感を演出する
 */
export class HitStopManager {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.duration = 0;
    this.timer = null;
    this.pausedEntities = [];
  }

  /**
   * ヒットストップを開始
   * @param {number} duration - 停止時間（ms）
   * @param {Array} entities - 停止対象エンティティ（省略時は物理世界全体を停止）
   */
  start(duration = 80, entities = null) {
    if (this.isActive) {
      // 既にヒットストップ中の場合は時間を延長
      this.duration = Math.max(this.duration, duration);
      return;
    }

    this.isActive = true;
    this.duration = duration;

    if (entities) {
      // 指定エンティティのみ停止
      this.pausedEntities = entities;
      entities.forEach(entity => {
        if (entity.body) {
          entity._pausedVelocity = {
            x: entity.body.velocity.x,
            y: entity.body.velocity.y
          };
          entity.body.setVelocity(0, 0);
        }
        if (entity.anims) {
          entity.anims.pause();
        }
      });
    } else {
      // 物理世界全体を停止
      this.scene.physics.world.pause();
    }

    // 画面フラッシュ効果（オプション）
    this.scene.cameras.main.flash(duration * 0.3, 255, 255, 255, false);

    // タイマー設定
    this.timer = this.scene.time.delayedCall(duration, () => {
      this.stop();
    });
  }

  /**
   * ヒットストップを停止
   */
  stop() {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.pausedEntities.length > 0) {
      // 指定エンティティの停止を解除
      this.pausedEntities.forEach(entity => {
        if (entity.body && entity._pausedVelocity) {
          entity.body.setVelocity(
            entity._pausedVelocity.x,
            entity._pausedVelocity.y
          );
          delete entity._pausedVelocity;
        }
        if (entity.anims) {
          entity.anims.resume();
        }
      });
      this.pausedEntities = [];
    } else {
      // 物理世界の停止を解除
      this.scene.physics.world.resume();
    }

    if (this.timer) {
      this.timer.remove();
      this.timer = null;
    }
  }

  /**
   * 現在ヒットストップ中かどうか
   * @returns {boolean}
   */
  isHitStopping() {
    return this.isActive;
  }

  /**
   * シーン破棄時のクリーンアップ
   */
  destroy() {
    this.stop();
    this.scene = null;
  }
}