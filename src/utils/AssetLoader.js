// 将来的な拡張用のアセットローダーユーティリティ

export class AssetLoader {
  constructor(scene) {
    this.scene = scene;
    this.loadQueue = [];
    this.totalAssets = 0;
    this.loadedAssets = 0;
  }

  /**
   * アセットをキューに追加
   * @param {string} type - 'image', 'spritesheet', 'audio'など
   * @param {string} key - アセットキー
   * @param {string} path - ファイルパス
   * @param {Object} config - 追加設定（spritesheetのframeConfig等）
   */
  addToQueue(type, key, path, config = {}) {
    this.loadQueue.push({ type, key, path, config });
    this.totalAssets++;
  }

  /**
   * キューのアセットを一括ロード
   * @returns {Promise} ロード完了Promise
   */
  loadAll() {
    return new Promise((resolve, reject) => {
      if (this.loadQueue.length === 0) {
        resolve();
        return;
      }

      this.scene.load.on('filecomplete', this.onFileComplete, this);
      this.scene.load.on('complete', () => {
        this.scene.load.off('filecomplete', this.onFileComplete, this);
        resolve();
      });

      // キューのアセットを順次ロード
      this.loadQueue.forEach(asset => {
        this.loadAsset(asset);
      });

      this.scene.load.start();
    });
  }

  loadAsset(asset) {
    const { type, key, path, config } = asset;

    switch (type) {
      case 'image':
        this.scene.load.image(key, path);
        break;
      case 'spritesheet':
        this.scene.load.spritesheet(key, path, config.frameConfig);
        break;
      case 'audio':
        this.scene.load.audio(key, path);
        break;
      default:
        console.warn(`Unknown asset type: ${type}`);
    }
  }

  onFileComplete(key) {
    this.loadedAssets++;
    const progress = this.loadedAssets / this.totalAssets;
    
    // カスタムイベントを発火（UIの更新用）
    this.scene.events.emit('assetLoadProgress', {
      key,
      progress,
      loaded: this.loadedAssets,
      total: this.totalAssets
    });
  }

  /**
   * 開発フェーズ用の矩形テクスチャ生成
   */
  generateDevTextures() {
    const devTextures = [
      { key: 'player_dev', color: 0x3399ff, width: 48, height: 64 },
      { key: 'enemy_dev', color: 0xff3333, width: 40, height: 56 },
      { key: 'boss_dev', color: 0x990000, width: 80, height: 96 },
      { key: 'weapon_dev', color: 0x33ff33, width: 32, height: 16 },
    ];

    devTextures.forEach(({ key, color, width, height }) => {
      this.createColorTexture(key, color, width, height);
    });
  }

  createColorTexture(key, color, width = 64, height = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, width, height);
    
    // 境界線を追加（デバッグ用）
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    this.scene.textures.addCanvas(key, canvas);
  }
}