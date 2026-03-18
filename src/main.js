import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

// ゲーム定数
export const GAME_CONFIG = {
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    GROUND_Y_MIN: 360,
    GROUND_Y_MAX: 480,
    DEPTH_THRESHOLD: 40,
    COMMAND_WINDOW: 400,
};

// Phaser設定
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.GAME_WIDTH,
    height: GAME_CONFIG.GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, GameScene, UIScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// ゲーム開始
const game = new Phaser.Game(config);

// ローディング表示制御
game.events.once('ready', () => {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
});

// グローバル参照用（デバッグ・開発時）
window.game = game;
window.GAME_CONFIG = GAME_CONFIG;

console.log('🎮 ベルトスクロールアクション - スチームパンク 起動中...');