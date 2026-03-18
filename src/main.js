import UIScene from './scenes/UIScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  physics: {
    default: 'arcade',
    arcade: { 
      gravity: { y: 0 }, 
      debug: false 
    }
  },
  scene: [GameScene, UIScene] // GameSceneを先に起動してからUISceneを並行実行
};

const game = new Phaser.Game(config);

// GameSceneとUISceneを並行実行するための設定
game.scene.start('GameScene');
game.scene.launch('UIScene'); // launchを使用して並行実行