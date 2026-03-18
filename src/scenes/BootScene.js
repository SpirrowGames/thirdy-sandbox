export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ローディングバー作成
    this.createLoadingBar();
    
    // 最小限のアセットをロード（開発用プレースホルダー）
    this.loadPlaceholderAssets();
    
    // ロード進捗の監視
    this.load.on('progress', this.updateLoadingBar, this);
    this.load.on('complete', this.onLoadComplete, this);
  }

  createLoadingBar() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // ローディングテキスト
    this.loadingText = this.add.text(centerX, centerY - 50, 'Loading...', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // ローディングバー背景
    this.loadingBg = this.add.rectangle(centerX, centerY, 400, 20, 0x444444);
    
    // ローディングバー
    this.loadingBar = this.add.rectangle(centerX - 200, centerY, 0, 20, 0x00aaff);
    this.loadingBar.setOrigin(0, 0.5);

    // パーセンテージテキスト
    this.percentText = this.add.text(centerX, centerY + 50, '0%', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);
  }

  updateLoadingBar(progress) {
    this.loadingBar.width = progress * 400;
    this.percentText.setText(Math.round(progress * 100) + '%');
  }

  loadPlaceholderAssets() {
    // 1x1の白いピクセルを作成（当たり判定用）
    this.load.image('__WHITE', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // プレースホルダー音声（無音）
    this.load.audio('__SILENT', ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE']);
  }

  onLoadComplete() {
    // ローディング完了演出
    this.tweens.add({
      targets: [this.loadingText, this.loadingBg, this.loadingBar, this.percentText],
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // GameSceneとUISceneを同時起動
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      }
    });
  }
}