// 将来的なアセット管理の拡張用ユーティリティ

export class AssetLoader {
  static createAssetManifest() {
    // 将来的にJSONファイルから読み込む想定
    return {
      sprites: [
        // { key: 'player', path: 'assets/sprites/player.png', frameWidth: 48, frameHeight: 64 },
        // { key: 'enemy', path: 'assets/sprites/enemy.png', frameWidth: 40, frameHeight: 56 }
      ],
      images: [
        // { key: 'bg_alley', path: 'assets/backgrounds/alley.png' }
      ],
      audio: [
        // { key: 'bgm_stage1', path: 'assets/audio/bgm_stage1.ogg' },
        // { key: 'sfx_punch', path: 'assets/audio/punch.wav' }
      ]
    };
  }

  static loadAssetsFromManifest(scene, manifest) {
    // スプライトシートの読み込み
    manifest.sprites.forEach(sprite => {
      scene.load.spritesheet(sprite.key, sprite.path, {
        frameWidth: sprite.frameWidth,
        frameHeight: sprite.frameHeight
      });
    });

    // 画像の読み込み
    manifest.images.forEach(image => {
      scene.load.image(image.key, image.path);
    });

    // オーディオの読み込み
    manifest.audio.forEach(audio => {
      scene.load.audio(audio.key, audio.path);
    });
  }

  static validateAssets(scene, requiredAssets) {
    const missing = [];
    
    requiredAssets.forEach(asset => {
      if (!scene.cache.image.exists(asset) && 
          !scene.cache.audio.exists(asset) && 
          !scene.cache.json.exists(asset)) {
        missing.push(asset);
      }
    });

    if (missing.length > 0) {
      console.warn('Missing assets:', missing);
      return false;
    }
    
    return true;
  }
}