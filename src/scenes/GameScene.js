import { Player } from '../entities/Player.js';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y_MIN, GROUND_Y_MAX } from '../constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create() {
    // 背景の作成
    this.createBackground();
    
    // プレイヤーの作成
    const startX = 100;
    const startY = (GROUND_Y_MIN + GROUND_Y_MAX) / 2; // 中央の奥行き
    this.player = new Player(this, startX, startY);
    
    // カメラの設定
    this.setupCamera();
    
    // デバッグ用の境界線表示
    this.createDebugLines();
  }
  
  createBackground() {
    // 開発初期は単色背景
    this.add.rectangle(1500, 270, 3000, 540, 0x2c3e50);
    
    // 奥行きの視覚的な目安線
    const lineColor = 0x34495e;
    this.add.line(1500, GROUND_Y_MIN, 0, 0, 3000, 0, lineColor);
    this.add.line(1500, GROUND_Y_MAX, 0, 0, 3000, 0, lineColor);
  }
  
  setupCamera() {
    // ステージ全幅 3000px、画面幅 960px の横スクロール
    this.cameras.main.setBounds(0, 0, 3000, GAME_HEIGHT);
    
    // プレイヤーをX軸のみ追従（Y軸は固定）
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    
    // カメラの追従範囲を制限（プレイヤーが画面中央より少し左に表示されるように）
    this.cameras.main.setFollowOffset(-200, 0);
  }
  
  createDebugLines() {
    // 奥行き範囲の可視化（開発用）
    const minLine = this.add.line(1500, GROUND_Y_MIN, 0, 0, 3000, 0, 0xff0000);
    const maxLine = this.add.line(1500, GROUND_Y_MAX, 0, 0, 3000, 0, 0xff0000);
    minLine.setAlpha(0.3);
    maxLine.setAlpha(0.3);
    
    // 中央線
    const centerY = (GROUND_Y_MIN + GROUND_Y_MAX) / 2;
    const centerLine = this.add.line(1500, centerY, 0, 0, 3000, 0, 0x00ff00);
    centerLine.setAlpha(0.3);
  }
  
  update(time, delta) {
    // プレイヤーの更新
    this.player.update(time, delta);
    
    // カメラ位置の制限チェック
    this.checkCameraBounds();
  }
  
  checkCameraBounds() {
    // プレイヤーがステージ左端を超えないように制限
    if (this.player.sprite.x < 50) {
      this.player.sprite.x = 50;
      this.player.body.x = 50;
      this.player.body.setVelocityX(0);
    }
    
    // プレイヤーがステージ右端を超えないように制限
    if (this.player.sprite.x > 2950) {
      this.player.sprite.x = 2950;
      this.player.body.x = 2950;
      this.player.body.setVelocityX(0);
    }
  }
  
  // スクロールロック機能（ウェーブ戦用）
  lockScroll() {
    this.cameras.main.stopFollow();
  }
  
  unlockScroll() {
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
  }
}