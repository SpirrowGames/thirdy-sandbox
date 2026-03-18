import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { BootScene } from './scenes/BootScene.js';

// ゲーム設定定数
export const GAME_CONFIG = {
  // 画面サイズ
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,
  
  // 奥行き設定（Y座標）
  GROUND_Y_MIN: 360,  // 奥行き上限（画面奥側）
  GROUND_Y_MAX: 480,  // 奥行き下限（画面手前側）
  DEPTH_THRESHOLD: 40, // 奥行き判定閾値（px）
  
  // 入力設定
  COMMAND_WINDOW: 400, // コマンド入力猶予時間（ms）
  
  // ゲームプレイ設定
  COMBO_RESET_TIME: 1500, // コンボリセット時間（ms）
  HITSTOP_DURATION: 80,   // ヒットストップ時間（ms）
  INVINCIBLE_TIME: 200,   // 無敵時間（ms）
  
  // ステージ設定
  STAGE_WIDTH: 3000,      // ステージ全幅（px）
  CAMERA_FOLLOW_LERP: 0.1, // カメラ追従の滑らかさ
  
  // 物理設定
  GRAVITY: 0,             // 重力（ベルトスクロールでは不使用）
  PHYSICS_DEBUG: false,   // 物理デバッグ表示
  
  // プレイヤー設定
  PLAYER_SPEED: 200,      // プレイヤー移動速度（px/s）
  PLAYER_MAX_HP: 100,     // プレイヤー最大HP
  
  // 敵設定
  ENEMY_SPEED: 80,        // 敵移動速度（px/s）
  ENEMY_ATTACK_RANGE: 60, // 敵攻撃範囲（px）
  ENEMY_ATTACK_COOLDOWN: 1500, // 敵攻撃クールダウン（ms）
  
  // ボス設定
  BOSS_MAX_HP: 200,       // ボス最大HP
  BOSS_PHASE2_THRESHOLD: 0.5, // フェーズ2移行HP割合
  
  // 武器設定
  WEAPON_THROW_FORCE: 300, // 武器投擲力
  WEAPON_DURABILITY_SPECIAL_COST: 2, // 特殊技の耐久度消費
  
  // スコア設定
  SCORE_ENEMY_BASE: 100,   // 敵撃破基本スコア
  SCORE_COMBO_MULTIPLIER: 1.2, // コンボボーナス倍率
  SCORE_TIME_BONUS: 10,    // タイムボーナス係数
  
  // エフェクト設定
  KNOCKBACK_FORCE: 300,    // ノックバック力
  KNOCKBACK_DURATION: 200, // ノックバック持続時間（ms）
  FLASH_DURATION: 100,     // ダメージフラッシュ時間（ms）
};

// 色定数
export const COLORS = {
  PLAYER: 0x3399ff,       // プレイヤー色（青）
  ENEMY: 0xff3333,        // 敵色（赤）
  BOSS: 0x9933ff,         // ボス色（紫）
  WEAPON: 0x33ff33,       // 武器色（緑）
  UI_PRIMARY: 0xffffff,   // UI主要色（白）
  UI_SECONDARY: 0xcccccc, // UI副色（灰色）
  HP_BAR: 0xff0000,       // HPバー色（赤）
  HP_BAR_BG: 0x333333,    // HPバー背景色（暗灰色）
};

// キー定数
export const KEYS = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN',
  Z: 'KeyZ',
  X: 'KeyX',
};

// ゲーム状態定数
export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  STAGE_CLEAR: 'stage_clear',
};

// エンティティ状態定数
export const ENTITY_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK_1: 'attack_1',
  ATTACK_2: 'attack_2',
  ATTACK_3: 'attack_3',
  SPECIAL: 'special',
  DASH: 'dash',
  GRAB: 'grab',
  THROW: 'throw',
  HURT: 'hurt',
  KNOCKDOWN: 'knockdown',
  DEAD: 'dead',
};

// Phaser設定
const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.GAME_WIDTH,
  height: GAME_CONFIG.GAME_HEIGHT,
  backgroundColor: '#2c3e50', // スチームパンクらしい暗めの背景
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME_CONFIG.GRAVITY },
      debug: GAME_CONFIG.PHYSICS_DEBUG
    }
  },
  scene: [BootScene, GameScene, UIScene],
  // パフォーマンス設定
  render: {
    pixelArt: true, // ドット絵対応
    antialias: false,
  },
  // 入力設定
  input: {
    keyboard: true,
    gamepad: false, // MVPでは非対応
  },
  // 音声設定
  audio: {
    disableWebAudio: false,
  }
};

// Phaserゲームインスタンス作成
const game = new Phaser.Game(config);

// グローバルに設定を公開（デバッグ用）
window.GAME_CONFIG = GAME_CONFIG;
window.game = game;

export default game;