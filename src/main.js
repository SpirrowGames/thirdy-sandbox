import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { BootScene } from './scenes/BootScene.js';

// ゲーム全体で使用される定数
export const GAME_CONFIG = {
    // 画面サイズ
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    
    // 奥行き（Y座標）の範囲
    GROUND_Y_MIN: 360,
    GROUND_Y_MAX: 480,
    
    // 奥行き判定閾値
    DEPTH_THRESHOLD: 40,
    
    // コマンド入力猶予時間
    COMMAND_WINDOW: 400,
    
    // ステージ設定
    STAGE_WIDTH: 3000,
    
    // コンボ設定
    COMBO_RESET_TIME: 1500,
    
    // プレイヤー設定
    PLAYER_SPEED: 200,
    PLAYER_MAX_HP: 100,
    
    // 敵設定
    ENEMY_SPEED: 80,
    ENEMY_HP: 30,
    ENEMY_ATTACK_RANGE: 60,
    ENEMY_ATTACK_DAMAGE: 10,
    ENEMY_ATTACK_COOLDOWN: 1500,
    
    // ボス設定
    BOSS_HP: 200,
    BOSS_PHASE2_THRESHOLD: 0.5,
    
    // 物理設定
    HITSTOP_DURATION: 80,
    KNOCKBACK_FORCE: 300,
    KNOCKBACK_DURATION: 200,
    HURT_RECOVERY_TIME: 150
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
            debug: false // 開発中はtrueに設定可能
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

// デバッグ用のグローバル参照（開発時のみ）
if (typeof window !== 'undefined') {
    window.game = game;
    window.GAME_CONFIG = GAME_CONFIG;
}

export default game;