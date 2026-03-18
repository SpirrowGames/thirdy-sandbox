import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants.js';

/**
 * Phaser.js ゲーム設定とメインエントリーポイント
 */
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false // 開発時はtrueに設定
    }
  },
  scene: [BootScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 480,
      height: 270
    },
    max: {
      width: 1920,
      height: 1080
    }
  }
};

// ゲーム開始
const game = new Phaser.Game(config);

// グローバルエラーハンドリング
window.addEventListener('error', (event) => {
  console.error('Game error:', event.error);
});

export default game;