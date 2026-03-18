import { SpawnSystem } from '../systems/SpawnSystem.js';
import { Player } from '../entities/Player.js';
import { STAGE1 } from '../data/stage1.js';

// ゲーム設定定数
export const GAME_CONFIG = {
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,
  GROUND_Y_MIN: 360,
  GROUND_Y_MAX: 480,
  DEPTH_THRESHOLD: 40,
  STAGE_WIDTH: 3000,
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // エンティティ管理
    this.player = null;
    this.enemies = null;
    this.weapons = null;
    
    // システム
    this.spawnSystem = null;
    
    // カメラ制御
    this.scrollLocked = false;
    
    // ゲーム状態
    this.gameState = 'playing'; // playing, paused, cleared, gameover
  }

  create() {
    console.log('GameScene: 初期化開始');
    
    try {
      // 物理エンジン設定
      this.setupPhysics();
      
      // 背景とステージ設定
      this.setupStage();
      
      // エンティティグループ初期化
      this.setupEntityGroups();
      
      // プレイヤー生成
      this.createPlayer();
      
      // カメラ設定
      this.setupCamera();
      
      // スポーンシステム初期化
      this.setupSpawnSystem();
      
      // 衝突判定設定
      this.setupCollisions();
      
      // イベントリスナー設定
      this.setupEvents();
      
      console.log('GameScene: 初期化完了');
    } catch (error) {
      console.error('GameScene初期化エラー:', error);
      throw error;
    }
  }

  update(time, delta) {
    if (this.gameState !== 'playing') {
      return;
    }

    try {
      // プレイヤー更新
      if (this.player && this.player.active) {
        this.player.update(time, delta);
      }

      // 敵更新
      this.enemies.children.entries.forEach(enemy => {
        if (enemy.active && enemy.update) {
          enemy.update(this.player, time, delta);
        }
      });

      // スポーンシステム更新
      if (this.spawnSystem) {
        const cameraX = this.cameras.main.scrollX;
        this.spawnSystem.update(cameraX);
      }

      // 画面外エンティティのクリーンアップ
      this.cleanupOffscreenEntities();

    } catch (error) {
      console.error('GameScene更新エラー:', error);
    }
  }

  /**
   * 物理エンジンの基本設定
   */
  setupPhysics() {
    // 重力は使用しない（2Dベルトスクロール）
    this.physics.world.gravity.y = 0;
    
    // デバッグモード（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      this.physics.world.debugGraphic = this.add.graphics();
    }
  }

  /**
   * ステージ背景と境界の設定
   */
  setupStage() {
    // 背景色設定（後でスプライト背景に置き換え予定）
    this.cameras.main.setBackgroundColor('#2c3e50');
    
    // ステージ境界設定
    this.physics.world.setBounds(0, 0, GAME_CONFIG.STAGE_WIDTH, GAME_CONFIG.GAME_HEIGHT);
    
    // 地面の可視化（開発用）
    const groundGraphics = this.add.graphics();
    groundGraphics.lineStyle(2, 0x34495e);
    groundGraphics.beginPath();
    groundGraphics.moveTo(0, GAME_CONFIG.GROUND_Y_MIN);
    groundGraphics.lineTo(GAME_CONFIG.STAGE_WIDTH, GAME_CONFIG.GROUND_Y_MIN);
    groundGraphics.moveTo(0, GAME_CONFIG.GROUND_Y_MAX);
    groundGraphics.lineTo(GAME_CONFIG.STAGE_WIDTH, GAME_CONFIG.GROUND_Y_MAX);
    groundGraphics.strokePath();
  }

  /**
   * エンティティグループの初期化
   */
  setupEntityGroups() {
    // 敵グループ
    this.enemies = this.physics.add.group({
      runChildUpdate: true,
      maxSize: 10
    });

    // 武器グループ
    this.weapons = this.physics.add.group({
      runChildUpdate: false,
      maxSize: 5
    });

    // プレイヤー攻撃ヒットボックスグループ（一時的）
    this.playerAttackBoxes = this.physics.add.group({
      runChildUpdate: false,
      maxSize: 3
    });

    // 敵攻撃ヒットボックスグループ（一時的）
    this.enemyAttackBoxes = this.physics.add.group({
      runChildUpdate: false,
      maxSize: 5
    });
  }

  /**
   * プレイヤー生成
   */
  createPlayer() {
    const startX = 100;
    const startY = 440;
    
    this.player = new Player(this, startX, startY);
    
    if (!this.player || !this.player.sprite) {
      throw new Error('プレイヤーの生成に失敗しました');
    }

    console.log('プレイヤー生成完了:', { x: startX, y: startY });
  }

  /**
   * カメラ設定（横スクロール）
   */
  setupCamera() {
    const camera = this.cameras.main;
    
    // カメラの境界設定（ステージ全幅をカバー）
    camera.setBounds(0, 0, GAME_CONFIG.STAGE_WIDTH, GAME_CONFIG.GAME_HEIGHT);
    
    // プレイヤー追従設定（X軸のみ、滑らかに追従）
    camera.startFollow(this.player.sprite, true, 0.1, 0);
    
    // 追従のオフセット設定（プレイヤーを画面左寄りに配置）
    camera.setFollowOffset(-200, 0);
    
    console.log('カメラ設定完了');
  }

  /**
   * スポーンシステム初期化
   */
  setupSpawnSystem() {
    const callbacks = {
      onWaveStart: () => this.lockScroll(),
      onWaveClear: () => this.unlockScroll(),
      onStageClear: () => this.onStageClear(),
      onSpawn: (type, x, y) => this.spawnEnemy(type, x, y)
    };

    this.spawnSystem = new SpawnSystem(this, STAGE1.spawnEvents, callbacks);
    console.log('スポーンシステム初期化完了');
  }

  /**
   * 衝突判定設定
   */
  setupCollisions() {
    // プレイヤー攻撃 vs 敵
    this.physics.add.overlap(
      this.playerAttackBoxes,
      this.enemies,
      this.handlePlayerAttackHit,
      null,
      this
    );

    // 敵攻撃 vs プレイヤー
    this.physics.add.overlap(
      this.enemyAttackBoxes,
      this.player.sprite,
      this.handleEnemyAttackHit,
      null,
      this
    );

    // プレイヤー vs 武器（拾う）
    this.physics.add.overlap(
      this.player.sprite,
      this.weapons,
      this.handleWeaponPickup,
      null,
      this
    );
  }

  /**
   * イベントリスナー設定
   */
  setupEvents() {
    // プレイヤーからのイベント
    this.player.on('attack', (attackData) => {
      this.createPlayerAttackBox(attackData);
    });

    this.player.on('takeDamage', (damage) => {
      this.events.emit('playerHpChange', {
        current: this.player.hp,
        max: this.player.maxHp
      });
    });

    this.player.on('comboUpdate', (comboCount) => {
      this.events.emit('comboUpdate', { count: comboCount });
    });
  }

  /**
   * カメラスクロールをロック
   */
  lockScroll() {
    if (this.scrollLocked) return;
    
    this.scrollLocked = true;
    this.cameras.main.stopFollow();
    console.log('スクロールロック');
  }

  /**
   * カメラスクロールのロックを解除
   */
  unlockScroll() {
    if (!this.scrollLocked) return;
    
    this.scrollLocked = false;
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
    this.cameras.main.setFollowOffset(-200, 0);
    console.log('スクロールアンロック');
  }

  /**
   * 敵をスポーンする
   */
  spawnEnemy(type, x, y) {
    // 実装は後のタスクで行う
    console.log(`敵スポーン予定: ${type} at (${x}, ${y})`);
  }

  /**
   * プレイヤー攻撃ヒット処理
   */
  handlePlayerAttackHit(attackBox, enemy) {
    if (!this.isDepthAligned(this.player, enemy)) {
      return;
    }

    console.log('プレイヤー攻撃ヒット');
    // 実装は後のタスクで行う
  }

  /**
   * 敵攻撃ヒット処理
   */
  handleEnemyAttackHit(playerSprite, attackBox) {
    console.log('敵攻撃ヒット');
    // 実装は後のタスクで行う
  }

  /**
   * 武器拾い処理
   */
  handleWeaponPickup(playerSprite, weapon) {
    console.log('武器拾い');
    // 実装は後のタスクで行う
  }

  /**
   * プレイヤー攻撃ボックス生成
   */
  createPlayerAttackBox(attackData) {
    // 実装は後のタスクで行う
    console.log('攻撃ボックス生成:', attackData);
  }

  /**
   * 奥行き判定
   */
  isDepthAligned(entity1, entity2) {
    const groundY1 = entity1.groundY || entity1.y;
    const groundY2 = entity2.groundY || entity2.y;
    return Math.abs(groundY1 - groundY2) < GAME_CONFIG.DEPTH_THRESHOLD;
  }

  /**
   * 画面外エンティティのクリーンアップ
   */
  cleanupOffscreenEntities() {
    const cameraLeft = this.cameras.main.scrollX;
    const cameraRight = cameraLeft + GAME_CONFIG.GAME_WIDTH;
    const buffer = 200; // 画面外バッファ

    // 敵のクリーンアップ
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.x < cameraLeft - buffer || enemy.x > cameraRight + buffer) {
        enemy.setActive(false);
      } else {
        enemy.setActive(true);
      }
    });
  }

  /**
   * ステージクリア処理
   */
  onStageClear() {
    this.gameState = 'cleared';
    console.log('ステージクリア！');
    this.events.emit('stageClear');
  }

  /**
   * ゲームオーバー処理
   */
  onGameOver() {
    this.gameState = 'gameover';
    console.log('ゲームオーバー');
    this.events.emit('gameOver');
  }

  /**
   * シーンの一時停止
   */
  pauseGame() {
    this.gameState = 'paused';
    this.physics.world.pause();
  }

  /**
   * シーンの再開
   */
  resumeGame() {
    this.gameState = 'playing';
    this.physics.world.resume();
  }
}