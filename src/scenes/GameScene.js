import { SpawnSystem } from '../systems/SpawnSystem.js';
import { STAGE1 } from '../data/stage1.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ... 他の初期化処理 ...

    // SpawnSystemの初期化
    this.spawnSystem = new SpawnSystem(this, STAGE1, {
      onWaveStart: () => this.onWaveStart(),
      onWaveClear: () => this.onWaveClear(),
      onStageClear: () => this.onStageClear(),
      onSpawn: (type, x, y) => this.spawnEnemy(type, x, y),
    });

    // 敵グループの初期化
    this.enemies = this.physics.add.group({
      runChildUpdate: true,
    });

    // UI更新用のイベント発行
    this.events.emit('waveStart', { wave: 1 });
  }

  update(time, delta) {
    // SpawnSystemの更新
    this.spawnSystem.update(this.cameras.main.scrollX);

    // ... 他の更新処理 ...
  }

  /**
   * 敵生成メソッド
   */
  spawnEnemy(type, x, y) {
    let enemy;
    
    switch (type) {
      case 'grunt':
        enemy = new Enemy(this, x, y);
        break;
      case 'boss':
        enemy = new Boss(this, x, y);
        this.currentBoss = enemy;
        // ボス出現時はBGM変更等の演出
        this.events.emit('bossAppear', { boss: enemy });
        break;
      default:
        console.warn(`Unknown enemy type: ${type}`);
        return null;
    }

    if (enemy) {
      this.enemies.add(enemy.sprite);
      // 敵撃破時のコールバックを設定
      enemy.onDestroy = () => {
        this.spawnSystem.onEnemyDefeated(enemy);
        this.enemies.remove(enemy.sprite);
      };
    }

    return enemy;
  }

  /**
   * ウェーブ開始時の処理
   */
  onWaveStart() {
    console.log('Wave started - UI effects can be triggered here');
    
    // UI更新イベント
    const waveInfo = this.spawnSystem.getCurrentWaveInfo();
    this.events.emit('waveStart', waveInfo);
    
    // 効果音再生
    // this.sound.play('wave_start');
  }

  /**
   * ウェーブクリア時の処理
   */
  onWaveClear() {
    console.log('Wave cleared - bonus points, effects, etc.');
    
    // UI更新イベント
    this.events.emit('waveClear');
    
    // スコア加算
    this.addScore(500); // ウェーブクリアボーナス
    
    // 効果音再生
    // this.sound.play('wave_clear');
  }

  /**
   * ステージクリア時の処理
   */
  onStageClear() {
    console.log('Stage cleared!');
    
    // UI更新イベント
    this.events.emit('stageClear');
    
    // 最終スコア計算
    this.calculateFinalScore();
    
    // クリア演出
    this.showClearScreen();
  }

  /**
   * スコア加算処理
   */
  addScore(points) {
    this.score = (this.score || 0) + points;
    this.events.emit('scoreUpdate', { score: this.score });
  }

  /**
   * 最終スコア計算
   */
  calculateFinalScore() {
    const baseScore = this.score || 0;
    const timeBonus = Math.max(0, (300 - this.time.now / 1000) * 10); // 残り時間ボーナス
    const comboBonus = this.maxCombo * 100; // 最大コンボボーナス
    
    this.finalScore = baseScore + timeBonus + comboBonus;
    
    console.log(`Final Score: ${this.finalScore} (Base: ${baseScore}, Time: ${timeBonus}, Combo: ${comboBonus})`);
  }

  /**
   * クリア画面表示
   */
  showClearScreen() {
    // 一時停止
    this.scene.pause();
    
    // クリア画面UI表示
    this.scene.launch('ClearScene', { 
      score: this.finalScore,
      time: this.time.now / 1000,
      maxCombo: this.maxCombo 
    });
  }
}