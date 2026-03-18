export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.scrollLocked = false;
    this.lockedScrollX = 0;
  }

  create() {
    // プレイヤーの作成（仮実装）
    this.player = {
      sprite: this.add.rectangle(100, 440, 48, 64, 0x3399ff)
    };
    this.physics.add.existing(this.player.sprite);

    // カメラ設定
    this.cameras.main.setBounds(0, 0, 3000, 540);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    
    // カメラのY軸追従を無効化（横スクロールのみ）
    this.cameras.main.setLerp(0.1, 0);
  }

  update(time, delta) {
    // スクロールがロックされている場合、カメラ位置を固定
    if (this.scrollLocked) {
      this.cameras.main.setScroll(this.lockedScrollX, 0);
    }
  }

  /**
   * カメラスクロールをロックする
   * ウェーブ出現時に呼び出される
   */
  lockScroll() {
    if (this.scrollLocked) {
      return; // 既にロック済みの場合は何もしない
    }

    this.scrollLocked = true;
    this.lockedScrollX = this.cameras.main.scrollX;
    
    // プレイヤー追従を停止
    this.cameras.main.stopFollow();
    
    // 現在位置で固定
    this.cameras.main.setScroll(this.lockedScrollX, 0);

    // デバッグ用イベント発火
    this.events.emit('scrollLocked', { scrollX: this.lockedScrollX });
  }

  /**
   * カメラスクロールロックを解除する
   * ウェーブクリア時に呼び出される
   */
  unlockScroll() {
    if (!this.scrollLocked) {
      return; // 既にアンロック済みの場合は何もしない
    }

    this.scrollLocked = false;
    this.lockedScrollX = 0;
    
    // プレイヤー追従を再開
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    
    // Y軸追従を無効化（横スクロールのみ）
    this.cameras.main.setLerp(0.1, 0);

    // デバッグ用イベント発火
    this.events.emit('scrollUnlocked');
  }

  /**
   * スクロールロック状態を取得
   * @returns {boolean} ロック中かどうか
   */
  isScrollLocked() {
    return this.scrollLocked;
  }

  /**
   * 現在のロック位置を取得
   * @returns {number} ロック中のX座標（ロックされていない場合は0）
   */
  getLockedScrollX() {
    return this.scrollLocked ? this.lockedScrollX : 0;
  }

  /**
   * ウェーブクリア時の処理
   * SpawnSystemから呼び出される
   */
  onWaveClear() {
    this.unlockScroll();
    // その他のウェーブクリア処理...
  }

  /**
   * ウェーブ開始時の処理
   * SpawnSystemから呼び出される
   */
  onWaveStart() {
    this.lockScroll();
    // その他のウェーブ開始処理...
  }
}