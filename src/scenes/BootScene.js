export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 開発初期は矩形ボックスのみ使用
    // 将来的にここでアセットをロードする
    console.log('BootScene: アセットロード開始（現在は矩形ボックスのみ）');
    
    // 1x1の白いピクセルを作成（ヒットボックス用）
    this.add.graphics()
      .fillStyle(0xffffff)
      .fillRect(0, 0, 1, 1)
      .generateTexture('__WHITE', 1, 1);
  }

  create() {
    console.log('BootScene: 初期化完了、GameSceneへ移行');
    this.scene.start('GameScene');
    this.scene.start('UIScene');
  }
}