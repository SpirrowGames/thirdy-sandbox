import { Player } from '../entities/Player.js';
import { GAME_CONFIG } from '../constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create() {
    // プレイヤーの作成
    this.player = new Player(this, 100, 420);
    
    // カメラ設定
    this.cameras.main.setBounds(0, 0, 3000, GAME_CONFIG.GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0); // X軸のみ追従
    
    // デバッグ用テキスト
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '16px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });
    this.debugText.setScrollFactor(0); // カメラに固定
  }
  
  update(time, delta) {
    // プレイヤーの更新
    this.player.update(time, delta);
    
    // デバッグ情報の表示
    this.updateDebugInfo();
  }
  
  updateDebugInfo() {
    const info = this.player.getDebugInfo();
    this.debugText.setText([
      `Position: (${info.position.x}, ${info.position.y})`,
      `Ground Y: ${info.groundY}`,
      `State: ${info.state}`,
      `Facing: ${info.facing}`,
      `Moving: ${info.isMoving}`,
      `Velocity: (${info.velocity.x}, ${info.velocity.y})`,
      `Y Range: ${GAME_CONFIG.GROUND_Y_MIN} - ${GAME_CONFIG.GROUND_Y_MAX}`
    ].join('\n'));
  }
}