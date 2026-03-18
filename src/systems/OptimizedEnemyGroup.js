/**
 * 最適化された敵グループ管理クラス
 * Physics.add.group()を活用し、効率的な更新と衝突判定を実現
 */
export class OptimizedEnemyGroup {
  constructor(scene) {
    this.scene = scene;
    
    // Physics Groupの作成（自動更新有効）
    this.group = scene.physics.add.group({
      runChildUpdate: true, // 子要素の自動update実行
      maxSize: 20,         // 最大同時存在数
      createCallback: this.onEnemyCreate.bind(this),
      removeCallback: this.onEnemyRemove.bind(this)
    });

    // 敵タイプ別のプール
    this.enemyPools = new Map();
    this.initializePools();
    
    // パフォーマンス統計
    this.stats = {
      spawned: 0,
      destroyed: 0,
      reused: 0
    };
  }

  /**
   * 敵タイプ別オブジェクトプールの初期化
   */
  initializePools() {
    const enemyTypes = ['grunt', 'boss', 'heavy', 'fast'];
    
    enemyTypes.forEach(type => {
      this.enemyPools.set(type, {
        available: [],
        inUse: new Set(),
        created: 0
      });
    });
  }

  /**
   * 敵のスポーン（オブジェクトプール活用）
   */
  spawn(type, x, groundY) {
    const pool = this.enemyPools.get(type);
    let enemy;

    // プールから再利用可能なオブジェクトを取得
    if (pool.available.length > 0) {
      enemy = pool.available.pop();
      enemy.reset(x, groundY);
      this.stats.reused++;
    } else {
      // 新規作成
      enemy = this.createEnemy(type, x, groundY);
      pool.created++;
      this.stats.spawned++;
    }

    // グループに追加
    this.group.add(enemy);
    pool.inUse.add(enemy);
    
    return enemy;
  }

  /**
   * 敵の作成
   */
  createEnemy(type, x, groundY) {
    let enemy;
    
    switch (type) {
      case 'grunt':
        enemy = new OptimizedEnemy(this.scene, x, groundY, type);
        break;
      case 'boss':
        enemy = new OptimizedBoss(this.scene, x, groundY, type);
        break;
      default:
        enemy = new OptimizedEnemy(this.scene, x, groundY, type);
    }

    // 共通初期化
    enemy.setCollideWorldBounds(false); // 画面外移動を許可
    enemy.enemyType = type;
    
    return enemy;
  }

  /**
   * 敵の破棄（プールに戻す）
   */
  destroyEnemy(enemy) {
    const type = enemy.enemyType;
    const pool = this.enemyPools.get(type);
    
    if (pool && pool.inUse.has(enemy)) {
      // グループから削除
      this.group.remove(enemy);
      pool.inUse.delete(enemy);
      
      // プールに戻す
      enemy.setActive(false);
      enemy.setVisible(false);
      enemy.cleanup(); // 敵固有のクリーンアップ
      pool.available.push(enemy);
      
      this.stats.destroyed++;
    }
  }

  /**
   * 画面外カリング実行
   */
  cullOffScreen(performanceManager) {
    performanceManager.cullOffScreenEntities(this.group);
  }

  /**
   * 全敵の強制削除
   */
  clear() {
    this.group.clear(true, true);
    
    // プールもクリア
    this.enemyPools.forEach(pool => {
      pool.available = [];
      pool.inUse.clear();
    });
  }

  /**
   * グループ作成時のコールバック
   */
  onEnemyCreate(enemy) {
    // Physics設定の最適化
    enemy.body.setCollideWorldBounds(false);
    enemy.body.onWorldBounds = false;
  }

  /**
   * グループ削除時のコールバック
   */
  onEnemyRemove(enemy) {
    // メモリリーク防止
    if (enemy.body) {
      enemy.body.destroy();
    }
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      ...this.stats,
      activeCount: this.group.countActive(),
      totalCount: this.group.children.size,
      poolStats: Array.from(this.enemyPools.entries()).map(([type, pool]) => ({
        type,
        available: pool.available.length,
        inUse: pool.inUse.size,
        created: pool.created
      }))
    };
  }

  destroy() {
    this.clear();
    this.group.destroy();
    this.enemyPools.clear();
  }
}