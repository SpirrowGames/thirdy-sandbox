/**
 * ヒットストップ（打撃感演出）システム
 * 攻撃ヒット時に一時的にゲーム進行を停止する
 */
export class HitStopSystem {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.duration = 0;
    this.timer = 0;
    
    // 停止対象の管理
    this.pausedObjects = new Set();
    this.pausedTweens = new Set();
    this.pausedTimers = new Set();
    
    // 物理世界の元の設定を保存
    this.originalTimeScale = 1;
  }

  /**
   * ヒットストップ実行
   * @param {number} duration - 停止時間（ms）
   * @param {Object} options - オプション
   * @param {boolean} options.pausePhysics - 物理演算を停止するか
   * @param {boolean} options.pauseAnimations - アニメーションを停止するか
   * @param {Array} options.excludeObjects - 停止対象から除外するオブジェクト
   */
  execute(duration = 80, options = {}) {
    if (this.isActive) {
      // 既にヒットストップ中の場合、より長い時間を採用
      this.duration = Math.max(this.duration, duration);
      return;
    }

    this.isActive = true;
    this.duration = duration;
    this.timer = 0;

    const config = {
      pausePhysics: true,
      pauseAnimations: true,
      excludeObjects: [],
      ...options
    };

    // 物理世界の停止
    if (config.pausePhysics) {
      this.pausePhysics();
    }

    // アニメーションの停止
    if (config.pauseAnimations) {
      this.pauseAnimations(config.excludeObjects);
    }

    // Tweenの停止
    this.pauseTweens(config.excludeObjects);

    // タイマーの停止
    this.pauseTimers(config.excludeObjects);

    // カメラシェイク効果（オプション）
    if (duration > 60) {
      this.scene.cameras.main.shake(duration * 0.5, 2);
    }
  }

  /**
   * 物理演算の停止
   */
  pausePhysics() {
    if (this.scene.physics && this.scene.physics.world) {
      this.originalTimeScale = this.scene.physics.world.timeScale;
      this.scene.physics.world.timeScale = 0;
    }
  }

  /**
   * アニメーションの停止
   */
  pauseAnimations(excludeObjects = []) {
    // すべてのアニメーション対象を取得して停止
    this.scene.anims.getAllKeys().forEach(key => {
      const anim = this.scene.anims.get(key);
      if (anim && anim.isPlaying) {
        // 除外対象でない場合のみ停止
        const shouldPause = !excludeObjects.some(obj => 
          obj.anims && obj.anims.currentAnim && obj.anims.currentAnim.key === key
        );
        
        if (shouldPause) {
          anim.pause();
          this.pausedObjects.add(anim);
        }
      }
    });

    // 個別スプライトのアニメーション停止
    this.scene.children.list.forEach(child => {
      if (child.anims && child.anims.isPlaying && !excludeObjects.includes(child)) {
        child.anims.pause();
        this.pausedObjects.add(child);
      }
    });
  }

  /**
   * Tweenの停止
   */
  pauseTweens(excludeObjects = []) {
    this.scene.tweens.getAllTweens().forEach(tween => {
      if (tween.isPlaying() && !excludeObjects.includes(tween.targets[0])) {
        tween.pause();
        this.pausedTweens.add(tween);
      }
    });
  }

  /**
   * タイマーの停止
   */
  pauseTimers(excludeObjects = []) {
    // Phaserのタイマーイベントは直接制御が困難なため、
    // カスタムタイマーシステムと連携する場合に実装
  }

  /**
   * フレーム更新
   */
  update(time, delta) {
    if (!this.isActive) return;

    this.timer += delta;
    
    if (this.timer >= this.duration) {
      this.resume();
    }
  }

  /**
   * ヒットストップ終了・再開
   */
  resume() {
    if (!this.isActive) return;

    this.isActive = false;
    this.timer = 0;
    this.duration = 0;

    // 物理世界の再開
    if (this.scene.physics && this.scene.physics.world) {
      this.scene.physics.world.timeScale = this.originalTimeScale;
    }

    // アニメーションの再開
    this.pausedObjects.forEach(obj => {
      if (obj.resume) {
        obj.resume();
      } else if (obj.anims && obj.anims.resume) {
        obj.anims.resume();
      }
    });
    this.pausedObjects.clear();

    // Tweenの再開
    this.pausedTweens.forEach(tween => {
      if (tween.resume) {
        tween.resume();
      }
    });
    this.pausedTweens.clear();

    // タイマーの再開
    this.pausedTimers.forEach(timer => {
      if (timer.resume) {
        timer.resume();
      }
    });
    this.pausedTimers.clear();
  }

  /**
   * 強制停止
   */
  stop() {
    if (this.isActive) {
      this.resume();
    }
  }

  /**
   * リソース解放
   */
  destroy() {
    this.stop();
    this.pausedObjects.clear();
    this.pausedTweens.clear();
    this.pausedTimers.clear();
  }
}