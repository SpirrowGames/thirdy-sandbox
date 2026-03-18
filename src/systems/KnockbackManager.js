/**
 * ノックバック処理を管理するクラス
 * 被弾時の吹き飛び効果を演出する
 */
export class KnockbackManager {
  constructor(scene) {
    this.scene = scene;
    this.activeKnockbacks = new Map(); // entity -> knockback data
  }

  /**
   * ノックバックを適用
   * @param {object} target - 対象エンティティ
   * @param {number} sourceX - 攻撃元のX座標
   * @param {number} force - ノックバック力（px/s）
   * @param {number} duration - ノックバック時間（ms）
   * @param {object} options - オプション設定
   */
  apply(target, sourceX, force = 300, duration = 200, options = {}) {
    const {
      allowVertical = false,
      verticalForce = 0,
      friction = 0.9,
      minForce = 50
    } = options;

    if (!target.body) {
      console.warn('Knockback target has no physics body');
      return;
    }

    // ノックバック方向を計算
    const direction = target.x > sourceX ? 1 : -1;
    const velocityX = direction * force;
    const velocityY = allowVertical ? verticalForce : target.body.velocity.y;

    // 既存のノックバックを停止
    this.stop(target);

    // ノックバック適用
    target.body.setVelocity(velocityX, velocityY);

    // ノックバックデータを記録
    const knockbackData = {
      originalVelocity: {
        x: target.body.velocity.x,
        y: target.body.velocity.y
      },
      force: Math.abs(velocityX),
      direction,
      duration,
      elapsed: 0,
      friction,
      minForce,
      timer: null
    };

    this.activeKnockbacks.set(target, knockbackData);

    // 減衰処理のタイマー
    knockbackData.timer = this.scene.time.addEvent({
      delay: 16, // 約60fps
      callback: () => this.updateKnockback(target),
      repeat: Math.ceil(duration / 16)
    });

    // 完全停止タイマー
    this.scene.time.delayedCall(duration, () => {
      this.stop(target);
    });
  }

  /**
   * ノックバックの更新処理（減衰効果）
   * @param {object} target - 対象エンティティ
   */
  updateKnockback(target) {
    const data = this.activeKnockbacks.get(target);
    if (!data || !target.body) return;

    // 現在の速度を取得
    let currentVelocityX = target.body.velocity.x;
    
    // 摩擦による減衰
    currentVelocityX *= data.friction;

    // 最小力を下回ったら停止
    if (Math.abs(currentVelocityX) < data.minForce) {
      this.stop(target);
      return;
    }

    // 速度を更新
    target.body.setVelocityX(currentVelocityX);
  }

  /**
   * 特定エンティティのノックバックを停止
   * @param {object} target - 対象エンティティ
   */
  stop(target) {
    const data = this.activeKnockbacks.get(target);
    if (!data) return;

    // タイマー停止
    if (data.timer) {
      data.timer.remove();
    }

    // X方向の速度をリセット（Y方向は維持）
    if (target.body) {
      target.body.setVelocityX(0);
    }

    this.activeKnockbacks.delete(target);
  }

  /**
   * 全てのノックバックを停止
   */
  stopAll() {
    for (const target of this.activeKnockbacks.keys()) {
      this.stop(target);
    }
  }

  /**
   * エンティティがノックバック中かどうか
   * @param {object} target - 対象エンティティ
   * @returns {boolean}
   */
  isKnockingBack(target) {
    return this.activeKnockbacks.has(target);
  }

  /**
   * シーン破棄時のクリーンアップ
   */
  destroy() {
    this.stopAll();
    this.scene = null;
  }
}