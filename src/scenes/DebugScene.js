import { DEBUG_CONFIG, DEBUG_KEYS } from '../debug/DebugConfig.js';

export class DebugScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DebugScene', active: true });
    this.debugTexts = {};
    this.debugGraphics = null;
    this.performanceStats = {
      fps: 0,
      entityCount: 0,
      memoryUsage: 0,
      renderTime: 0
    };
  }

  create() {
    if (!DEBUG_CONFIG.enabled) return;
    
    this.setupDebugUI();
    this.setupDebugControls();
    this.setupPerformanceMonitor();
    
    // デバッグ情報表示エリア作成
    this.createDebugPanel();
  }

  setupDebugUI() {
    // デバッグ情報表示用のグラフィックス
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(1000); // 最前面に表示
    
    // デバッグテキスト表示エリア
    this.debugPanel = this.add.container(10, 10);
    this.debugPanel.setDepth(1001);
  }

  setupDebugControls() {
    // デバッグ用キー設定
    Object.entries(DEBUG_KEYS).forEach(([action, key]) => {
      this.input.keyboard.on(`keydown-${key}`, () => {
        this.handleDebugKey(action);
      });
    });
    
    // マウス操作（エンティティ情報表示）
    this.input.on('pointermove', (pointer) => {
      if (DEBUG_CONFIG.showEntityInfo) {
        this.updateEntityInfo(pointer.worldX, pointer.worldY);
      }
    });
  }

  setupPerformanceMonitor() {
    // パフォーマンス監視タイマー
    this.time.addEvent({
      delay: 100, // 100ms間隔で更新
      callback: this.updatePerformanceStats,
      callbackScope: this,
      loop: true
    });
  }

  createDebugPanel() {
    const panelBg = this.add.rectangle(0, 0, 300, 400, 0x000000, 0.7);
    panelBg.setOrigin(0, 0);
    this.debugPanel.add(panelBg);
    
    // デバッグ情報テキスト初期化
    this.debugTexts.fps = this.add.text(10, 10, 'FPS: --', DEBUG_CONFIG.textStyle);
    this.debugTexts.entities = this.add.text(10, 30, 'Entities: --', DEBUG_CONFIG.textStyle);
    this.debugTexts.memory = this.add.text(10, 50, 'Memory: --', DEBUG_CONFIG.textStyle);
    this.debugTexts.camera = this.add.text(10, 70, 'Camera: --', DEBUG_CONFIG.textStyle);
    this.debugTexts.player = this.add.text(10, 90, 'Player: --', DEBUG_CONFIG.textStyle);
    this.debugTexts.commands = this.add.text(10, 130, 'Commands: --', DEBUG_CONFIG.textStyle);
    
    Object.values(this.debugTexts).forEach(text => {
      this.debugPanel.add(text);
    });
  }

  handleDebugKey(action) {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;
    
    switch (action) {
      case 'TOGGLE_DEBUG':
        DEBUG_CONFIG.enabled = !DEBUG_CONFIG.enabled;
        this.debugPanel.setVisible(DEBUG_CONFIG.enabled);
        break;
        
      case 'TOGGLE_COLLISION':
        DEBUG_CONFIG.showCollisionBoxes = !DEBUG_CONFIG.showCollisionBoxes;
        gameScene.physics.world.drawDebug = DEBUG_CONFIG.showCollisionBoxes;
        break;
        
      case 'TOGGLE_PERFORMANCE':
        DEBUG_CONFIG.showPerformanceStats = !DEBUG_CONFIG.showPerformanceStats;
        break;
        
      case 'GOD_MODE':
        if (gameScene.player) {
          gameScene.player.godMode = !gameScene.player.godMode;
          console.log('God Mode:', gameScene.player.godMode ? 'ON' : 'OFF');
        }
        break;
        
      case 'KILL_ALL_ENEMIES':
        gameScene.enemies.children.entries.forEach(enemy => {
          if (enemy.alive) enemy.destroy();
        });
        break;
        
      case 'SPAWN_ENEMY':
        const camera = gameScene.cameras.main;
        gameScene.spawnEnemy('grunt', camera.scrollX + 800, 440);
        break;
        
      case 'NEXT_WAVE':
        if (gameScene.spawnSystem) {
          gameScene.spawnSystem.forceNextWave();
        }
        break;
        
      case 'RESET_STAGE':
        gameScene.scene.restart();
        break;
    }
  }

  update() {
    if (!DEBUG_CONFIG.enabled) return;
    
    this.updateDebugDisplay();
    this.updateCollisionVisualization();
    this.updateDepthZones();
  }

  updateDebugDisplay() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;
    
    // FPS表示
    if (DEBUG_CONFIG.showFPS) {
      this.debugTexts.fps.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }
    
    // エンティティ数表示
    const entityCount = this.getEntityCount(gameScene);
    this.debugTexts.entities.setText(`Entities: ${entityCount}`);
    
    // メモリ使用量（概算）
    if (performance.memory) {
      const memMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      this.debugTexts.memory.setText(`Memory: ${memMB}MB`);
    }
    
    // カメラ情報
    const camera = gameScene.cameras.main;
    this.debugTexts.camera.setText(
      `Camera: (${Math.round(camera.scrollX)}, ${Math.round(camera.scrollY)})`
    );
    
    // プレイヤー情報
    if (gameScene.player) {
      const p = gameScene.player;
      this.debugTexts.player.setText(
        `Player: (${Math.round(p.x)}, ${Math.round(p.groundY)}) HP:${p.hp} State:${p.state}`
      );
    }
    
    // コマンドバッファ表示
    if (DEBUG_CONFIG.showCommandBuffer && gameScene.player?.commandBuffer) {
      const buffer = gameScene.player.commandBuffer.buffer;
      const bufferStr = buffer.map(b => b.key).join('-');
      this.debugTexts.commands.setText(`Commands: ${bufferStr}`);
    }
  }

  updateCollisionVisualization() {
    if (!DEBUG_CONFIG.showCollisionBoxes) return;
    
    this.debugGraphics.clear();
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;
    
    // プレイヤー当たり判定表示
    if (gameScene.player) {
      this.drawCollisionBox(gameScene.player, 0x00ff00);
    }
    
    // 敵当たり判定表示
    gameScene.enemies.children.entries.forEach(enemy => {
      if (enemy.alive) {
        this.drawCollisionBox(enemy, 0xff0000);
      }
    });
    
    // 武器当たり判定表示
    if (gameScene.weapons) {
      gameScene.weapons.children.entries.forEach(weapon => {
        this.drawCollisionBox(weapon, 0xffff00);
      });
    }
  }

  drawCollisionBox(entity, color) {
    if (!entity.body) return;
    
    const body = entity.body;
    this.debugGraphics.lineStyle(2, color, 1);
    this.debugGraphics.strokeRect(
      body.x - this.cameras.main.scrollX,
      body.y - this.cameras.main.scrollY,
      body.width,
      body.height
    );
    
    // 中心点表示
    this.debugGraphics.fillStyle(color, 1);
    this.debugGraphics.fillCircle(
      entity.x - this.cameras.main.scrollX,
      entity.y - this.cameras.main.scrollY,
      3
    );
  }

  updateDepthZones() {
    if (!DEBUG_CONFIG.showDepthZones) return;
    
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;
    
    // 奥行き範囲表示
    this.debugGraphics.lineStyle(1, 0x00ffff, 0.5);
    
    // GROUND_Y_MIN ライン
    this.debugGraphics.moveTo(0, 360 - this.cameras.main.scrollY);
    this.debugGraphics.lineTo(this.scale.width, 360 - this.cameras.main.scrollY);
    
    // GROUND_Y_MAX ライン
    this.debugGraphics.moveTo(0, 480 - this.cameras.main.scrollY);
    this.debugGraphics.lineTo(this.scale.width, 480 - this.cameras.main.scrollY);
    
    this.debugGraphics.strokePath();
  }

  updateEntityInfo(worldX, worldY) {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;
    
    // マウス位置の近くにあるエンティティを検索
    const nearbyEntity = this.findNearbyEntity(gameScene, worldX, worldY);
    
    if (nearbyEntity && this.debugTexts.entityInfo) {
      const info = this.getEntityInfo(nearbyEntity);
      this.debugTexts.entityInfo.setText(info);
    }
  }

  findNearbyEntity(gameScene, x, y) {
    const threshold = 50;
    
    // プレイヤーチェック
    if (gameScene.player && 
        Math.abs(gameScene.player.x - x) < threshold && 
        Math.abs(gameScene.player.y - y) < threshold) {
      return gameScene.player;
    }
    
    // 敵チェック
    for (const enemy of gameScene.enemies.children.entries) {
      if (enemy.alive &&
          Math.abs(enemy.x - x) < threshold && 
          Math.abs(enemy.y - y) < threshold) {
        return enemy;
      }
    }
    
    return null;
  }

  getEntityInfo(entity) {
    const type = entity.constructor.name;
    return `${type}\nHP: ${entity.hp}/${entity.maxHp}\nPos: (${Math.round(entity.x)}, ${Math.round(entity.y)})\nState: ${entity.state || 'N/A'}`;
  }

  getEntityCount(gameScene) {
    let count = 0;
    if (gameScene.player) count++;
    count += gameScene.enemies.children.entries.filter(e => e.alive).length;
    if (gameScene.weapons) count += gameScene.weapons.children.entries.length;
    return count;
  }

  updatePerformanceStats() {
    if (!DEBUG_CONFIG.showPerformanceStats) return;
    
    this.performanceStats.fps = Math.round(this.game.loop.actualFps);
    this.performanceStats.entityCount = this.getEntityCount(this.scene.get('GameScene'));
    
    if (performance.memory) {
      this.performanceStats.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    
    // レンダリング時間計測（概算）
    this.performanceStats.renderTime = this.game.loop.delta;
  }
}