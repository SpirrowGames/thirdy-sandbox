import { Player } from '../entities/Player.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create() {
    // 背景色設定
    this.cameras.main.setBackgroundColor('#2c3e50');
    
    // プレイヤー生成
    this.player = new Player(this, 100, 420);
    
    // カメラ設定
    this.cameras.main.setBounds(0, 0, 3000, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    
    // ステージ境界の視覚化（開発用）
    this.drawStageBounds();
    
    // UIScene起動
    this.scene.launch('UIScene');
  }
  
  drawStageBounds() {
    // 奥行き境界線の描画（開発用）
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xff0000, 0.5);
    graphics.moveTo(0, 360); // GROUND_Y_MIN
    graphics.lineTo(3000, 360);
    graphics.moveTo(0, 480); // GROUND_Y_MAX
    graphics.lineTo(3000, 480);
    graphics.stroke();
    
    // ステージ端の境界線
    graphics.lineStyle(2, 0x00ff00, 0.5);
    graphics.moveTo(0, 0);
    graphics.lineTo(0, GAME_HEIGHT);
    graphics.moveTo(3000, 0);
    graphics.lineTo(3000, GAME_HEIGHT);
    graphics.stroke();
  }
  
  update(time, delta) {
    // プレイヤー更新
    if (this.player) {
      this.player.update(time, delta);
    }
  }
}