export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // UI要素の初期化
    this.initializeUIElements();
    
    // GameSceneからのイベントリスナーを設定
    this.setupEventListeners();
    
    // 初期状態を設定
    this.initializeUIState();
  }

  initializeUIElements() {
    // プレイヤーHP表示（左上）
    this.playerHpContainer = this.add.container(20, 20);
    this.playerHpText = this.add.text(0, 0, 'HP:', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fill: '#ffffff'
    });
    this.playerHpBar = this.add.graphics();
    this.playerHpContainer.add([this.playerHpText, this.playerHpBar]);

    // スコア表示（上部中央）
    this.scoreText = this.add.text(480, 20, 'SCORE: 00000', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5, 0);

    // コンボ表示（右上）
    this.comboText = this.add.text(940, 20, 'COMBO: 0x', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fill: '#ffff00',
      align: 'right'
    }).setOrigin(1, 0);

    // 武器情報表示（左下）- 初期は非表示
    this.weaponContainer = this.add.container(20, 480);
    this.weaponNameText = this.add.text(0, 0, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fill: '#00ff00'
    });
    this.weaponDurabilityBar = this.add.graphics();
    this.weaponDurabilityText = this.add.text(0, 25, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fill: '#ffffff'
    });
    this.weaponContainer.add([this.weaponNameText, this.weaponDurabilityBar, this.weaponDurabilityText]);
    this.weaponContainer.setVisible(false);

    // ボスHP表示（下部中央）- 初期は非表示
    this.bossHpContainer = this.add.container(480, 500);
    this.bossHpText = this.add.text(0, 0, 'BOSS HP', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fill: '#ff0000',
      align: 'center'
    }).setOrigin(0.5, 0);
    this.bossHpBar = this.add.graphics();
    this.bossHpContainer.add([this.bossHpText, this.bossHpBar]);
    this.bossHpContainer.setVisible(false);
  }

  setupEventListeners() {
    // GameSceneが存在する場合のみイベントリスナーを設定
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.on('playerHpChange', this.updatePlayerHp, this);
      gameScene.events.on('scoreUpdate', this.updateScore, this);
      gameScene.events.on('comboUpdate', this.updateCombo, this);
      gameScene.events.on('weaponChange', this.updateWeapon, this);
      gameScene.events.on('bossHpChange', this.updateBossHp, this);
      gameScene.events.on('showBossHp', this.showBossHp, this);
      gameScene.events.on('hideBossHp', this.hideBossHp, this);
    }
  }

  initializeUIState() {
    // 初期UI状態を設定
    this.updatePlayerHp({ current: 100, max: 100 });
    this.updateScore({ score: 0 });
    this.updateCombo({ count: 0 });
  }

  updatePlayerHp(data) {
    const { current, max } = data;
    const percentage = current / max;
    
    // HPバーの描画
    this.playerHpBar.clear();
    
    // 背景（グレー）
    this.playerHpBar.fillStyle(0x666666);
    this.playerHpBar.fillRect(40, 0, 200, 20);
    
    // 現在HP（緑→黄→赤のグラデーション）
    let color = 0x00ff00; // 緑
    if (percentage < 0.5) {
      color = 0xffff00; // 黄
    }
    if (percentage < 0.25) {
      color = 0xff0000; // 赤
    }
    
    this.playerHpBar.fillStyle(color);
    this.playerHpBar.fillRect(40, 0, 200 * percentage, 20);
    
    // 枠線
    this.playerHpBar.lineStyle(2, 0xffffff);
    this.playerHpBar.strokeRect(40, 0, 200, 20);
  }

  updateScore(data) {
    const { score } = data;
    this.scoreText.setText(`SCORE: ${score.toString().padStart(5, '0')}`);
  }

  updateCombo(data) {
    const { count } = data;
    if (count > 0) {
      this.comboText.setText(`COMBO: ${count}x`);
      this.comboText.setFill('#ffff00');
      
      // コンボが高い場合は色を変更
      if (count >= 10) {
        this.comboText.setFill('#ff00ff');
      } else if (count >= 5) {
        this.comboText.setFill('#ff8800');
      }
    } else {
      this.comboText.setText('COMBO: 0x');
      this.comboText.setFill('#888888');
    }
  }

  updateWeapon(data) {
    if (!data || !data.name) {
      // 武器なし
      this.weaponContainer.setVisible(false);
      return;
    }

    const { name, durability, max } = data;
    this.weaponContainer.setVisible(true);
    
    this.weaponNameText.setText(`[${name}]`);
    this.weaponDurabilityText.setText(`${durability}/${max}`);
    
    // 耐久度バーの描画
    this.weaponDurabilityBar.clear();
    
    const barWidth = 150;
    const barHeight = 8;
    const percentage = durability / max;
    
    // 背景
    this.weaponDurabilityBar.fillStyle(0x333333);
    this.weaponDurabilityBar.fillRect(0, 15, barWidth, barHeight);
    
    // 耐久度
    let color = 0x00ff00;
    if (percentage < 0.5) color = 0xffff00;
    if (percentage < 0.25) color = 0xff0000;
    
    this.weaponDurabilityBar.fillStyle(color);
    this.weaponDurabilityBar.fillRect(0, 15, barWidth * percentage, barHeight);
    
    // 枠線
    this.weaponDurabilityBar.lineStyle(1, 0xffffff);
    this.weaponDurabilityBar.strokeRect(0, 15, barWidth, barHeight);
  }

  updateBossHp(data) {
    const { current, max } = data;
    const percentage = current / max;
    
    // ボスHPバーの描画
    this.bossHpBar.clear();
    
    const barWidth = 400;
    const barHeight = 20;
    
    // 背景
    this.bossHpBar.fillStyle(0x333333);
    this.bossHpBar.fillRect(-barWidth / 2, 25, barWidth, barHeight);
    
    // 現在HP
    this.bossHpBar.fillStyle(0xff0000);
    this.bossHpBar.fillRect(-barWidth / 2, 25, barWidth * percentage, barHeight);
    
    // 枠線
    this.bossHpBar.lineStyle(2, 0xffffff);
    this.bossHpBar.strokeRect(-barWidth / 2, 25, barWidth, barHeight);
  }

  showBossHp() {
    this.bossHpContainer.setVisible(true);
    
    // 登場アニメーション
    this.bossHpContainer.setAlpha(0);
    this.tweens.add({
      targets: this.bossHpContainer,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
  }

  hideBossHp() {
    // 退場アニメーション
    this.tweens.add({
      targets: this.bossHpContainer,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.bossHpContainer.setVisible(false);
      }
    });
  }

  // GameSceneが破棄される際のクリーンアップ
  shutdown() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.events) {
      gameScene.events.off('playerHpChange', this.updatePlayerHp, this);
      gameScene.events.off('scoreUpdate', this.updateScore, this);
      gameScene.events.off('comboUpdate', this.updateCombo, this);
      gameScene.events.off('weaponChange', this.updateWeapon, this);
      gameScene.events.off('bossHpChange', this.updateBossHp, this);
      gameScene.events.off('showBossHp', this.showBossHp, this);
      gameScene.events.off('hideBossHp', this.hideBossHp, this);
    }
  }
}