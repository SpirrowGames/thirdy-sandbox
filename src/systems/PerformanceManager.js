/**
 * パフォーマンス最適化を統括するマネージャークラス
 * 画面外エンティティの管理とメモリ使用量の監視を行う
 */
export class PerformanceManager {
  constructor(scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.metrics = {
      activeEntities: 0,
      inactiveEntities: 0,
      memoryUsage: 0,
      frameTime: 0
    };
    
    // パフォーマンス監視用タイマー
    this.monitorTimer = 0;
    this.MONITOR_INTERVAL = 1000; // 1秒間隔
  }

  update(time, delta) {
    this.monitorTimer += delta;
    
    if (this.monitorTimer >= this.MONITOR_INTERVAL) {
      this.updateMetrics();
      this.monitorTimer = 0;
    }
  }

  /**
   * エンティティが画面内にあるかチェック
   */
  isOnScreen(entity, buffer = 200) {
    const cameraBounds = this.camera.getBounds();
    const entityBounds = {
      x: entity.x - buffer,
      y: entity.y - buffer,
      width: (entity.width || 64) + buffer * 2,
      height: (entity.height || 64) + buffer * 2
    };

    return Phaser.Geom.Rectangle.Overlaps(cameraBounds, entityBounds);
  }

  /**
   * 画面外エンティティを非アクティブ化
   */
  cullOffScreenEntities(group) {
    let activeCount = 0;
    let inactiveCount = 0;

    group.children.entries.forEach(entity => {
      if (this.isOnScreen(entity)) {
        if (!entity.active) {
          entity.setActive(true);
          entity.setVisible(true);
          // Physics bodyも再有効化
          if (entity.body) {
            entity.body.enable = true;
          }
        }
        activeCount++;
      } else {
        if (entity.active) {
          entity.setActive(false);
          entity.setVisible(false);
          // Physics bodyを無効化してCPU負荷軽減
          if (entity.body) {
            entity.body.enable = false;
          }
        }
        inactiveCount++;
      }
    });

    this.metrics.activeEntities = activeCount;
    this.metrics.inactiveEntities = inactiveCount;
  }

  /**
   * パフォーマンスメトリクスの更新
   */
  updateMetrics() {
    // フレーム時間の計算（簡易版）
    this.metrics.frameTime = this.scene.game.loop.delta;
    
    // メモリ使用量（ブラウザがサポートしている場合）
    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // デバッグ用ログ（開発時のみ）
    if (this.scene.game.config.physics.arcade.debug) {
      console.log('Performance Metrics:', this.metrics);
    }
  }

  /**
   * パフォーマンス警告の発行
   */
  checkPerformanceWarnings() {
    if (this.metrics.frameTime > 16.67) { // 60FPS以下
      console.warn('Low FPS detected:', 1000 / this.metrics.frameTime, 'fps');
    }
    
    if (this.metrics.activeEntities > 50) {
      console.warn('High entity count:', this.metrics.activeEntities);
    }
  }

  destroy() {
    this.metrics = null;
  }
}