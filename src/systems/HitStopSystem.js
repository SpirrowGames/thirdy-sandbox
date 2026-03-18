export class HitStopSystem {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.duration = 0;
    this.remainingTime = 0;
    
    // 一時停止前の状態保存
    this.savedTimeScale = 1;
    this.savedVelocities = new Map();
  }

  /**
   * ヒットストップを適用
   * @param {number} duration - 停止時間（ms）
   * @param {Object} options - オプション設定
   */
  apply(duration, options = {}) {
    if (this.isActive) {
      // 既にヒットストップ中の場合は長い方を採用
      this.remainingTime = Math.max(this.remainingTime, duration);
      return;
    }

    this.isActive = true;
    this.duration = duration;
    this.remainingTime = duration;

    // 物理世界を一時停止
    this.pausePhysics();
    
    // アニメーションを一時停止（オプション）
    if (options.pauseAnimations) {
      this.pauseAnimations();
    }

    // 画面フラッシュ効果（オプション）
    if (options.flash) {
      this.scene.cameras.main.flash(50, 255, 255, 255, false);
    }

    // 画面シェイク効果（オプション）
    if (options.shake) {
      this.scene.cameras.main.shake(duration, 0.01);
    }
  }

  /**
   * 物理演算を一時停止
   */
  pausePhysics() {
    const world = this.scene.physics.world;
    
    // 現在の速度を保存
    world.bodies.entries.forEach(body => {
      if (body.gameObject) {
        this.savedVelocities.set(body.gameObject, {
          velocityX: body.velocity.x,
          velocityY: body.velocity.y
        });
        // 速度を0に設定
        body.setVelocity(0, 0);
      }
    });
  }

  /**
   * アニメーションを一時停止
   */
  pauseAnimations() {
    // 全てのスプライトのアニメーションを一時停止
    this.scene.children.list.forEach(child => {
      if (child.anims && child.anims.isPlaying) {
        child.anims.pause();
      }
    });
  }

  /**
   * 物理演算を再開
   */
  resumePhysics() {
    const world = this.scene.physics.world;
    
    // 保存していた速度を復元
    world.bodies.entries.forEach(body => {
      if (body.gameObject && this.savedVelocities.has(body.gameObject)) {
        const saved = this.savedVelocities.get(body.gameObject);
        body.setVelocity(saved.velocityX, saved.velocityY);
      }
    });
    
    this.savedVelocities.clear();
  }

  /**
   * アニメーションを再開
   */
  resumeAnimations() {
    // 全てのスプライトのアニメーションを再開
    this.scene.children.list.forEach(child => {
      if (child.anims && child.anims.isPaused) {
        child.anims.resume();
      }
    });
  }

  /**
   * 更新処理
   * @param {number} delta - フレーム間隔（ms）
   */
  update(delta) {
    if (!this.isActive) return;

    this.remainingTime -= delta;

    if (this.remainingTime <= 0) {
      this.stop();
    }
  }

  /**
   * ヒットストップを停止
   */
  stop() {
    if (!this.isActive) return;

    this.isActive = false;
    this.resumePhysics();
    this.resumeAnimations();
  }

  /**
   * 強制停止
   */
  forceStop() {
    this.stop();
  }
}