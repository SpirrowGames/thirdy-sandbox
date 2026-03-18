/**
 * カメラ制御システム
 * プレイヤー追従、スクロールロック・アンロック、ステージ境界を管理
 */
export class CameraSystem {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    
    // デフォルト設定
    this.config = {
      followLerpX: 0.1,
      followLerpY: 0,
      stageBounds: { x: 0, y: 0, width: 3000, height: 540 },
      deadzone: { x: 100, y: 0, width: 200, height: 0 },
      ...config
    };
    
    // 状態管理
    this.isLocked = false;
    this.followTarget = null;
    this.lockedPosition = { x: 0, y: 0 };
    
    this.initialize();
  }

  /**
   * カメラシステムの初期化
   */
  initialize() {
    const bounds = this.config.stageBounds;
    
    // ステージ境界設定
    this.camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    
    // デッドゾーン設定（プレイヤーがこの範囲内にいる間はカメラが動かない）
    if (this.config.deadzone) {
      this.camera.setDeadzone(
        this.config.deadzone.width,
        this.config.deadzone.height
      );
    }
  }

  /**
   * プレイヤー追従開始
   * @param {Phaser.GameObjects.GameObject} target - 追従対象
   */
  startFollow(target) {
    if (this.isLocked) {
      console.warn('カメラがロック中のため追従を開始できません');
      return;
    }
    
    this.followTarget = target;
    
    // X軸のみ追従、Y軸は固定
    this.camera.startFollow(
      target,
      true, // roundPixels
      this.config.followLerpX,
      this.config.followLerpY
    );
    
    console.log('カメラ追従開始:', target.constructor.name);
  }

  /**
   * プレイヤー追従停止
   */
  stopFollow() {
    this.camera.stopFollow();
    this.followTarget = null;
    console.log('カメラ追従停止');
  }

  /**
   * カメラスクロールをロック
   * ウェーブ戦闘中などで使用
   */
  lockScroll() {
    if (this.isLocked) {
      console.warn('カメラは既にロック済みです');
      return;
    }
    
    // 現在位置を記録
    this.lockedPosition.x = this.camera.scrollX;
    this.lockedPosition.y = this.camera.scrollY;
    
    // 追従停止
    this.camera.stopFollow();
    this.isLocked = true;
    
    console.log('カメラスクロールロック:', this.lockedPosition);
  }

  /**
   * カメラスクロールをアンロック
   * ウェーブクリア後などで使用
   */
  unlockScroll() {
    if (!this.isLocked) {
      console.warn('カメラはロックされていません');
      return;
    }
    
    this.isLocked = false;
    
    // 追従対象が設定されている場合は追従再開
    if (this.followTarget) {
      this.camera.startFollow(
        this.followTarget,
        true,
        this.config.followLerpX,
        this.config.followLerpY
      );
    }
    
    console.log('カメラスクロールアンロック');
  }

  /**
   * カメラを指定位置に即座に移動
   * @param {number} x - X座標
   * @param {number} y - Y座標
   */
  setPosition(x, y) {
    this.camera.setScroll(x, y);
    
    if (this.isLocked) {
      this.lockedPosition.x = x;
      this.lockedPosition.y = y;
    }
  }

  /**
   * カメラを指定位置にスムーズに移動
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} duration - 移動時間（ms）
   * @param {string} ease - イージング関数名
   * @returns {Promise} - 移動完了時にresolve
   */
  panTo(x, y, duration = 1000, ease = 'Power2') {
    return new Promise((resolve) => {
      // 一時的に追従停止
      const wasFollowing = this.followTarget;
      this.camera.stopFollow();
      
      this.scene.tweens.add({
        targets: this.camera,
        scrollX: x,
        scrollY: y,
        duration: duration,
        ease: ease,
        onComplete: () => {
          // 元々追従していた場合は追従再開
          if (wasFollowing && !this.isLocked) {
            this.camera.startFollow(
              wasFollowing,
              true,
              this.config.followLerpX,
              this.config.followLerpY
            );
          }
          resolve();
        }
      });
    });
  }

  /**
   * カメラシェイク効果
   * @param {number} duration - シェイク時間（ms）
   * @param {number} intensity - シェイクの強さ
   */
  shake(duration = 100, intensity = 5) {
    this.camera.shake(duration, intensity);
  }

  /**
   * カメラフラッシュ効果
   * @param {number} duration - フラッシュ時間（ms）
   * @param {number} red - 赤成分（0-255）
   * @param {number} green - 緑成分（0-255）
   * @param {number} blue - 青成分（0-255）
   */
  flash(duration = 250, red = 255, green = 255, blue = 255) {
    this.camera.flash(duration, red, green, blue);
  }

  /**
   * カメラフェードイン
   * @param {number} duration - フェード時間（ms）
   * @param {number} red - 背景色赤成分
   * @param {number} green - 背景色緑成分
   * @param {number} blue - 背景色青成分
   * @returns {Promise} - フェード完了時にresolve
   */
  fadeIn(duration = 1000, red = 0, green = 0, blue = 0) {
    return new Promise((resolve) => {
      this.camera.fadeIn(duration, red, green, blue, (camera, progress) => {
        if (progress === 1) {
          resolve();
        }
      });
    });
  }

  /**
   * カメラフェードアウト
   * @param {number} duration - フェード時間（ms）
   * @param {number} red - 背景色赤成分
   * @param {number} green - 背景色緑成分
   * @param {number} blue - 背景色青成分
   * @returns {Promise} - フェード完了時にresolve
   */
  fadeOut(duration = 1000, red = 0, green = 0, blue = 0) {
    return new Promise((resolve) => {
      this.camera.fadeOut(duration, red, green, blue, (camera, progress) => {
        if (progress === 1) {
          resolve();
        }
      });
    });
  }

  /**
   * 現在のカメラ状態を取得
   * @returns {Object} カメラ状態
   */
  getState() {
    return {
      scrollX: this.camera.scrollX,
      scrollY: this.camera.scrollY,
      isLocked: this.isLocked,
      followTarget: this.followTarget,
      bounds: {
        x: this.camera._bounds.x,
        y: this.camera._bounds.y,
        width: this.camera._bounds.width,
        height: this.camera._bounds.height
      }
    };
  }

  /**
   * ステージ境界を更新
   * @param {Object} bounds - 新しい境界設定
   */
  updateStageBounds(bounds) {
    this.config.stageBounds = { ...this.config.stageBounds, ...bounds };
    this.camera.setBounds(
      this.config.stageBounds.x,
      this.config.stageBounds.y,
      this.config.stageBounds.width,
      this.config.stageBounds.height
    );
    
    console.log('ステージ境界更新:', this.config.stageBounds);
  }

  /**
   * 毎フレーム更新処理
   * @param {number} time - 経過時間
   * @param {number} delta - フレーム間隔
   */
  update(time, delta) {
    // ロック中は位置を固定
    if (this.isLocked) {
      this.camera.setScroll(this.lockedPosition.x, this.lockedPosition.y);
    }
  }

  /**
   * システム破棄
   */
  destroy() {
    this.stopFollow();
    this.followTarget = null;
    this.scene = null;
    this.camera = null;
  }
}