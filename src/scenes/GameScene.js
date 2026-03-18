import { Player } from '../entities/Player.js';
import { GAME_CONFIG } from '../config/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create() {
    this.setupPhysics();
    this.createPlayer();
    this.setupCamera();
    this.setupDebugDisplay();
  }
  
  setupPhysics() {
    // 物理エンジンの設定
    this.physics.world.setBounds(0, 0, 3000, GAME_CONFIG.GAME_HEIGHT);
  }
  
  createPlayer() {
    // プレイヤーを初期位置に生成
    const startX = 100;
    const startY = (GAME_CONFIG.GROUND_Y_MIN + GAME_CONFIG.GROUND_Y_MAX) / 2;
    this.player = new Player(this, startX, startY);
  }
  
  setupCamera() {
    // カメラの設定
    this.cameras.main.setBounds(0, 0, 3000, GAME_CONFIG.GAME_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    
    // Y軸フォローは無効化（横スクロールのみ）
    this.cameras.main.setFollowOffset(0, 0);
  }
  
  setupDebugDisplay() {
    // デバッグ情報表示（開発時のみ）
    this.debugText = this.add.text(16, 16, '', {
      fontSize: '16px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.debugText.setScrollFactor(0); // カメラに追従させない
    this.debugText.setDepth(1000);     // 最前面に表示
  }
  
  update(time, delta) {
    // プレイヤーの更新
    this.player.update(time, delta);
    
    // デバッグ情報の更新
    this.updateDebugDisplay();
  }
  
  updateDebugDisplay() {
    const debugInfo = this.player.getDebugInfo();
    const cameraX = Math.round(this.cameras.main.scrollX);
    
    this.debugText.setText([
      `Player: (${debugInfo.x}, ${debugInfo.groundY})`,
      `Display Y: ${debugInfo.displayY}`,
      `State: ${debugInfo.state}`,
      `Facing: ${debugInfo.facingRight ? 'Right' : 'Left'}`,
      `Scale: ${debugInfo.scale}`,
      `Camera X: ${cameraX}`
    ]);
  }
}