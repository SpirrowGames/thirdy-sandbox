import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { BootScene } from './scenes/BootScene.js';

// ゲーム定数の定義
export const GAME_CONSTANTS = {
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,
  GROUND_Y_MIN: 360,
  GROUND_Y_MAX: 480,
  DEPTH_THRESHOLD: 40,
  COMMAND_WINDOW: 400,
  STAGE_WIDTH: 3000,
  COMBO_RESET: 1500,
};

// Phaser設定
const config = {
  type: Phaser.AUTO,
  width: GAME_CONSTANTS.GAME_WIDTH,
  height: GAME_CONSTANTS.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2c3e50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
      debugShowBody: false,
      debugShowStaticBody: false,
    }
  },
  scene: [BootScene, GameScene, UIScene],
  render: {
    antialias: false,
    pixelArt: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    keyboard: true,
    gamepad: false,
  },
  audio: {
    disableWebAudio: false,
  }
};

// ゲームインスタンスの生成と起動
class GameManager {
  constructor() {
    this.game = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) {
      console.warn('Game is already initialized');
      return this.game;
    }

    try {
      this.game = new Phaser.Game(config);
      this.isInitialized = true;
      
      // グローバルエラーハンドリング
      this.setupErrorHandling();
      
      // デバッグ情報の設定
      if (process.env.NODE_ENV === 'development') {
        this.setupDebugMode();
      }

      console.log('ベルトスクロールアクションゲーム起動完了');
      return this.game;
    } catch (error) {
      console.error('ゲーム初期化エラー:', error);
      this.handleInitError(error);
      throw error;
    }
  }

  setupErrorHandling() {
    // Phaserエラーの監視
    this.game.events.on('error', (error) => {
      console.error('Phaser Error:', error);
      this.handleGameError(error);
    });

    // ブラウザエラーの監視
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('phaser')) {
        console.error('Phaser Runtime Error:', event.error);
        this.handleGameError(event.error);
      }
    });
  }

  setupDebugMode() {
    // デバッグ用のグローバル変数を設定
    window.GAME_DEBUG = {
      game: this.game,
      constants: GAME_CONSTANTS,
      togglePhysicsDebug: () => {
        const gameScene = this.game.scene.getScene('GameScene');
        if (gameScene && gameScene.physics) {
          gameScene.physics.world.debugGraphic.visible = 
            !gameScene.physics.world.debugGraphic.visible;
        }
      },
      getGameState: () => {
        const gameScene = this.game.scene.getScene('GameScene');
        return gameScene ? gameScene.getDebugInfo() : null;
      }
    };

    console.log('デバッグモード有効 - window.GAME_DEBUG でアクセス可能');
  }

  handleInitError(error) {
    // 初期化エラー時の処理
    const errorContainer = document.getElementById('error-container') || 
                          this.createErrorContainer();
    
    errorContainer.innerHTML = `
      <div class="error-message">
        <h2>ゲーム初期化エラー</h2>
        <p>ゲームの起動に失敗しました。ページを再読み込みしてください。</p>
        <details>
          <summary>エラー詳細</summary>
          <pre>${error.message}</pre>
        </details>
        <button onclick="location.reload()">再読み込み</button>
      </div>
    `;
    errorContainer.style.display = 'block';
  }

  handleGameError(error) {
    // ゲーム実行時エラーの処理
    console.error('Game Runtime Error:', error);
    
    // 致命的エラーの場合はゲームを一時停止
    if (this.isCriticalError(error)) {
      this.game.scene.pause();
      this.showErrorMessage('致命的なエラーが発生しました。ゲームを再起動してください。');
    }
  }

  isCriticalError(error) {
    const criticalKeywords = ['memory', 'webgl', 'context', 'fatal'];
    const errorString = error.toString().toLowerCase();
    return criticalKeywords.some(keyword => errorString.includes(keyword));
  }

  createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(container);
    return container;
  }

  showErrorMessage(message) {
    const errorContainer = document.getElementById('error-container') || 
                          this.createErrorContainer();
    
    errorContainer.innerHTML = `
      <div class="error-message">
        <h2>エラー</h2>
        <p>${message}</p>
        <button onclick="location.reload()">再起動</button>
      </div>
    `;
    errorContainer.style.display = 'flex';
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
      this.isInitialized = false;
    }
  }

  restart() {
    this.destroy();
    setTimeout(() => this.init(), 100);
  }
}

// ゲームマネージャーのインスタンス作成
const gameManager = new GameManager();

// DOMContentLoaded時にゲーム開始
document.addEventListener('DOMContentLoaded', () => {
  try {
    gameManager.init();
  } catch (error) {
    console.error('Failed to start game:', error);
  }
});

// グローバルアクセス用のエクスポート
export { gameManager, GAME_CONSTANTS as default };