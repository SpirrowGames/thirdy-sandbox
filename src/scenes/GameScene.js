import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y_MIN, GROUND_Y_MAX } from '../config/constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // プレイヤーエンティティの初期化（仮実装）
    this.player = {
      sprite: this.add.rectangle(100, 440, 48, 64, 0x3399ff)
    };
    this.physics.add.existing(this.player.sprite);

    // カメラ設定
    this.setupCamera();

    // スクロールロック状態の初期化
    this.scrollLocked = false;
    this.lockedScrollX = 0; // ロック時のX座標を記憶
  }

  setupCamera() {
    // ステージ全幅3000px、画面幅960pxの横スクロール
    this.cameras.main.setBounds(0, 0, 3000, GAME_HEIGHT);
    
    // プレイヤーをX軸のみ追従（Y軸は固定）
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    
    // カメラの追従範囲を制限（画面端でのプレイヤー位置調整）
    this.cameras.main.setLerp(0.1, 0); // X軸のみスムーズ追従
    this.cameras.main.setDeadzone(100, 0); // X軸100px分のデッドゾーン
  }

  /**
   * カメラスクロールをロックし、現在位置で固定する
   * ウェーブ出現時に呼び出される
   */
  lockScroll() {
    if (this.scrollLocked) {
      console.warn('カメラは既にロック済みです');
      return;
    }

    this.scrollLocked = true;
    this.lockedScrollX = this.cameras.main.scrollX;

    // プレイヤー追従を停止
    this.cameras.main.stopFollow();

    // カメラ位置を現在地で完全固定
    this.cameras.main.setScroll(this.lockedScrollX, 0);

    // デバッグ用ログ
    console.log(`カメラロック: X=${this.lockedScrollX}`);

    // UIシーンにロック状態を通知
    this.events.emit('scrollLocked', { x: this.lockedScrollX });
  }

  /**
   * カメラスクロールロックを解除し、プレイヤー追従を再開する
   * ウェーブクリア時に呼び出される
   */
  unlockScroll() {
    if (!this.scrollLocked) {
      console.warn('カメラは既にアンロック済みです');
      return;
    }

    this.scrollLocked = false;

    // プレイヤー追従を再開
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);

    // デッドゾーンを再設定（追従再開時の調整）
    this.cameras.main.setDeadzone(100, 0);

    // デバッグ用ログ
    console.log('カメラロック解除: プレイヤー追従再開');

    // UIシーンにアンロック状態を通知
    this.events.emit('scrollUnlocked');
  }

  /**
   * 現在のカメラロック状態を取得
   * @returns {boolean} ロック状態
   */
  isScrollLocked() {
    return this.scrollLocked;
  }

  /**
   * ロック中のカメラX座標を取得
   * @returns {number} ロック時のX座標（ロックされていない場合は現在のscrollX）
   */
  getLockedScrollX() {
    return this.scrollLocked ? this.lockedScrollX : this.cameras.main.scrollX;
  }

  /**
   * 強制的にカメラを特定位置に移動（緊急時用）
   * @param {number} x - 移動先X座標
   */
  forceScrollTo(x) {
    const clampedX = Phaser.Math.Clamp(x, 0, 3000 - GAME_WIDTH);
    
    if (this.scrollLocked) {
      this.lockedScrollX = clampedX;
    }
    
    this.cameras.main.setScroll(clampedX, 0);
    console.log(`カメラ強制移動: X=${clampedX}`);
  }

  update(time, delta) {
    // ロック中はプレイヤーが画面外に出ないよう制限
    if (this.scrollLocked) {
      this.constrainPlayerInLockedView();
    }
  }

  /**
   * スクロールロック中にプレイヤーが画面外に出ることを防ぐ
   */
  constrainPlayerInLockedView() {
    const leftBound = this.lockedScrollX + 50; // 画面左端から50px余裕
    const rightBound = this.lockedScrollX + GAME_WIDTH - 50; // 画面右端から50px余裕

    if (this.player.sprite.x < leftBound) {
      this.player.sprite.x = leftBound;
      // 物理ボディが存在する場合は速度もリセット
      if (this.player.sprite.body) {
        this.player.sprite.body.setVelocityX(0);
      }
    } else if (this.player.sprite.x > rightBound) {
      this.player.sprite.x = rightBound;
      if (this.player.sprite.body) {
        this.player.sprite.body.setVelocityX(0);
      }
    }
  }

  /**
   * デバッグ情報表示用（開発時のみ使用）
   */
  getDebugInfo() {
    return {
      scrollLocked: this.scrollLocked,
      currentScrollX: this.cameras.main.scrollX,
      lockedScrollX: this.lockedScrollX,
      playerX: this.player.sprite.x,
      cameraFollowing: this.cameras.main.followOffset !== null
    };
  }
}