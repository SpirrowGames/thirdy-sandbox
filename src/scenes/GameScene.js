import { Player } from '../entities/Player.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { STAGE1 } from '../data/stage1.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // 基本設定
    this.setupWorld();
    this.setupCamera();
    this.setupGroups();
    this.setupPlayer();
    this.setupSpawnSystem();
    this.setupInput();
    this.setupCollisions();
    
    // 初期状態
    this.scrollLocked = false;
    this.gameState = 'playing'; // playing, paused, gameover, cleared
    
    console.log('GameScene created');
  }

  setupWorld() {
    // 物理世界の設定
    this.physics.world.setBounds(0, 0, STAGE1.width, 540);
    
    // 背景の設定（仮で色付き矩形）
    this.add.rectangle(STAGE1.width / 2, 270, STAGE1.width, 540, 0x2c3e50);
    
    // 地面の視覚的表現（仮）
    this.add.rectangle(STAGE1.width / 2, 500, STAGE1.width, 80, 0x34495e);
  }

  setupCamera() {
    // カメラの境界設定
    this.cameras.main.setBounds(0, 0, STAGE1.width, 540);
    
    // カメラのスムーシング設定（X軸のみ追従）
    this.cameraFollowConfig = {
      lerp: 0.1,
      offsetX: -200, // プレイヤーを画面左寄りに配置
      offsetY: 0
    };
  }

  setupGroups() {
    // エンティティグループの作成
    this.enemies = this.physics.add.group({
      runChildUpdate: true
    });
    
    this.weapons = this.physics.add.group();
    
    this.projectiles = this.physics.add.group({
      runChildUpdate: true
    });
    
    this.hitboxes = this.physics.add.group();
  }

  setupPlayer() {
    // プレイヤーの生成
    const startX = 100;
    const startY = 440;
    
    this.player = new Player(this, startX, startY);
    
    // カメラをプレイヤーに追従させる
    this.cameras.main.startFollow(
      this.player.sprite, 
      false, // Y軸は追従しない
      this.cameraFollowConfig.lerp, 
      0
    );
    
    // カメラオフセット設定
    this.cameras.main.setFollowOffset(
      this.cameraFollowConfig.offsetX, 
      this.cameraFollowConfig.offsetY
    );
  }

  setupSpawnSystem() {
    // スポーンシステムの初期化
    this.spawnSystem = new SpawnSystem(this, STAGE1.spawnEvents, {
      onWaveStart: () => this.lockScroll(),
      onWaveClear: () => this.unlockScroll(),
      onStageClear: () => this.onStageClear(),
      onSpawn: (type, x, y) => this.spawnEnemy(type, x, y)
    });
  }

  setupInput() {
    // キーボード入力の設定
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('Z,X,SPACE');
  }

  setupCollisions() {
    // 衝突判定の設定
    this.physics.add.overlap(
      this.player.sprite,
      this.weapons,
      this.onPlayerWeaponOverlap,
      null,
      this
    );
  }

  update(time, delta) {
    if (this.gameState !== 'playing') return;

    try {
      // プレイヤーの更新
      if (this.player && this.player.alive) {
        this.player.update(time, delta);
      }

      // スポーンシステムの更新
      if (this.spawnSystem) {
        this.spawnSystem.update(this.cameras.main.scrollX);
      }

      // UI更新イベントの送信
      this.updateUI();

    } catch (error) {
      console.error('GameScene update error:', error);
    }
  }

  updateUI() {
    // UISceneへの状態通知
    if (this.player) {
      this.events.emit('playerHpChange', {
        current: this.player.hp,
        max: this.player.maxHp
      });
      
      this.events.emit('comboUpdate', {
        count: this.player.comboCount
      });
      
      if (this.player.heldWeapon) {
        this.events.emit('weaponChange', {
          name: this.player.heldWeapon.name,
          durability: this.player.heldWeapon.durability,
          max: this.player.heldWeapon.maxDurability
        });
      } else {
        this.events.emit('weaponChange', null);
      }
    }
  }

  // スポーン関連メソッド
  spawnEnemy(type, x, y) {
    try {
      let enemy;
      
      switch (type) {
        case 'grunt':
          // 仮実装：Enemy クラスが完成次第置き換え
          enemy = this.createTempEnemy(x, y);
          break;
        case 'boss':
          // 仮実装：Boss クラスが完成次第置き換え
          enemy = this.createTempBoss(x, y);
          break;
        default:
          console.warn(`Unknown enemy type: ${type}`);
          return;
      }
      
      if (enemy) {
        this.enemies.add(enemy);
        console.log(`Spawned ${type} at (${x}, ${y})`);
      }
    } catch (error) {
      console.error('Error spawning enemy:', error);
    }
  }

  createTempEnemy(x, y) {
    // 一時的な敵実装（Enemy クラス完成まで）
    const enemy = this.add.rectangle(x, y, 32, 48, 0xff6b6b);
    this.physics.add.existing(enemy);
    enemy.body.setCollideWorldBounds(true);
    
    // 基本プロパティ
    enemy.hp = 30;
    enemy.alive = true;
    enemy.groundY = y;
    
    return enemy;
  }

  createTempBoss(x, y) {
    // 一時的なボス実装（Boss クラス完成まで）
    const boss = this.add.rectangle(x, y, 64, 96, 0xff4757);
    this.physics.add.existing(boss);
    boss.body.setCollideWorldBounds(true);
    
    // 基本プロパティ
    boss.hp = 200;
    boss.maxHp = 200;
    boss.alive = true;
    boss.groundY = y;
    boss.isBoss = true;
    
    return boss;
  }

  // スクロール制御
  lockScroll() {
    this.scrollLocked = true;
    this.cameras.main.stopFollow();
    console.log('Scroll locked');
  }

  unlockScroll() {
    this.scrollLocked = false;
    this.cameras.main.startFollow(
      this.player.sprite,
      false,
      this.cameraFollowConfig.lerp,
      0
    );
    this.cameras.main.setFollowOffset(
      this.cameraFollowConfig.offsetX,
      this.cameraFollowConfig.offsetY
    );
    console.log('Scroll unlocked');
  }

  // 衝突処理
  onPlayerWeaponOverlap(playerSprite, weaponSprite) {
    if (this.player && this.player.canPickupWeapon()) {
      this.player.pickupWeapon(weaponSprite.weaponData);
      weaponSprite.destroy();
    }
  }

  // 攻撃ヒット処理
  handleHit(attacker, target, damage = 10) {
    if (!target.alive) return;

    try {
      // ダメージ処理
      target.hp -= damage;
      
      // ヒットストップ
      this.hitStop(80);
      
      // ノックバック
      const knockbackDirection = target.x > attacker.x ? 1 : -1;
      if (target.body) {
        target.body.setVelocityX(knockbackDirection * 200);
      }
      
      // エフェクト（仮）
      this.createHitEffect(target.x, target.y);
      
      // 死亡判定
      if (target.hp <= 0) {
        this.onEnemyDeath(target);
      }
      
      console.log(`Hit! ${target.hp} HP remaining`);
      
    } catch (error) {
      console.error('Error in handleHit:', error);
    }
  }

  hitStop(duration = 80) {
    // 物理世界を一時停止
    this.physics.world.pause();
    
    this.time.delayedCall(duration, () => {
      this.physics.world.resume();
    });
  }

  createHitEffect(x, y) {
    // 簡単なヒットエフェクト
    const effect = this.add.circle(x, y, 20, 0xffff00, 0.8);
    
    this.tweens.add({
      targets: effect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => effect.destroy()
    });
  }

  onEnemyDeath(enemy) {
    enemy.alive = false;
    
    // スポーンシステムに通知
    if (this.spawnSystem) {
      this.spawnSystem.onEnemyDead();
    }
    
    // スコア加算
    const baseScore = enemy.isBoss ? 1000 : 100;
    this.events.emit('scoreUpdate', { score: baseScore });
    
    // エンティティ削除
    this.time.delayedCall(500, () => {
      if (enemy && enemy.destroy) {
        enemy.destroy();
      }
    });
  }

  // ゲーム状態管理
  onStageClear() {
    this.gameState = 'cleared';
    console.log('Stage cleared!');
    
    // クリア演出
    this.cameras.main.flash(1000, 255, 255, 255);
    
    // スコア計算とUI更新
    const timeBonus = Math.max(0, 10000 - this.time.now);
    this.events.emit('stageClear', { timeBonus });
  }

  pauseGame() {
    this.gameState = 'paused';
    this.physics.pause();
  }

  resumeGame() {
    this.gameState = 'playing';
    this.physics.resume();
  }

  // クリーンアップ
  shutdown() {
    // イベントリスナーのクリーンアップ
    this.events.removeAllListeners();
    
    // タイマーのクリーンアップ
    this.time.removeAllEvents();
    
    console.log('GameScene shutdown');
  }
}