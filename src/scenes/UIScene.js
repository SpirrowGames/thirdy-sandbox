export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: true });
    
    // UI要素の参照
    this.playerHpHearts = [];
    this.scoreText = null;
    this.comboText = null;
    this.weaponBar = null;
    this.weaponDurabilityText = null;
    this.bossHpBar = null;
    this.bossHpBg = null;
    
    // 状態管理
    this.currentPlayerHp = 100;
    this.maxPlayerHp = 100;
    this.currentScore = 0;
    this.currentCombo = 0;
    this.currentWeapon = null;
    this.bossHp = 0;
    this.maxBossHp = 0;
    this.bossVisible = false;
  }

  create() {
    // GameSceneの参照を取得
    this.gameScene = this.scene.get('GameScene');
    
    this.createPlayerHpDisplay();
    this.createScoreDisplay();
    this.createComboDisplay();
    this.createWeaponDisplay();
    this.createBossHpDisplay();
    
    this.setupEventListeners();
  }

  createPlayerHpDisplay() {
    const startX = 20;
    const startY = 20;
    const heartSize = 32;
    const heartSpacing = 36;
    
    // プレイヤーHP用のハートを5個作成
    for (let i = 0; i < 5; i++) {
      const heart = this.add.rectangle(
        startX + i * heartSpacing, 
        startY, 
        heartSize, 
        heartSize, 
        0xff4444
      );
      heart.setStrokeStyle(2, 0x000000);
      this.playerHpHearts.push(heart);
    }
  }

  createScoreDisplay() {
    this.scoreText = this.add.text(200, 20, 'SCORE: 00000', {
      fontSize: '20px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.scoreText.setOrigin(0, 0.5);
  }

  createComboDisplay() {
    this.comboText = this.add.text(400, 20, 'COMBO: 0x', {
      fontSize: '20px',
      fontFamily: 'Arial',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.comboText.setOrigin(0, 0.5);
    this.comboText.setVisible(false); // コンボが0の時は非表示
  }

  createWeaponDisplay() {
    const weaponY = 480;
    
    // 武器名表示
    this.weaponNameText = this.add.text(20, weaponY, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.weaponNameText.setOrigin(0, 0.5);
    
    // 武器耐久度バー背景
    this.weaponBarBg = this.add.rectangle(20, weaponY + 25, 200, 12, 0x333333);
    this.weaponBarBg.setOrigin(0, 0.5);
    this.weaponBarBg.setStrokeStyle(1, 0x000000);
    
    // 武器耐久度バー
    this.weaponBar = this.add.rectangle(20, weaponY + 25, 200, 12, 0x00ff00);
    this.weaponBar.setOrigin(0, 0.5);
    
    // 耐久度テキスト
    this.weaponDurabilityText = this.add.text(230, weaponY + 25, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.weaponDurabilityText.setOrigin(0, 0.5);
    
    // 初期状態では非表示
    this.hideWeaponDisplay();
  }

  createBossHpDisplay() {
    const bossHpY = 450;
    const barWidth = 600;
    const barHeight = 20;
    const centerX = 480; // 画面中央
    
    // ボスHP バー背景
    this.bossHpBg = this.add.rectangle(centerX, bossHpY, barWidth, barHeight, 0x333333);
    this.bossHpBg.setStrokeStyle(2, 0x000000);
    
    // ボスHP バー
    this.bossHpBar = this.add.rectangle(centerX, bossHpY, barWidth, barHeight, 0xff0000);
    
    // ボスHP ラベル
    this.bossHpLabel = this.add.text(centerX, bossHpY + 15, 'BOSS HP', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.bossHpLabel.setOrigin(0.5, 0);
    
    // 初期状態では非表示
    this.hideBossHpDisplay();
  }

  setupEventListeners() {
    if (!this.gameScene) return;
    
    // GameSceneからのイベントをリッスン
    this.gameScene.events.on('playerHpChange', this.updatePlayerHp, this);
    this.gameScene.events.on('scoreUpdate', this.updateScore, this);
    this.gameScene.events.on('comboUpdate', this.updateCombo, this);
    this.gameScene.events.on('weaponChange', this.updateWeapon, this);
    this.gameScene.events.on('bossHpChange', this.updateBossHp, this);
    this.gameScene.events.on('bossAppear', this.showBossHpDisplay, this);
    this.gameScene.events.on('bossDefeated', this.hideBossHpDisplay, this);
  }

  update() {
    // 必要に応じてGameSceneから直接状態を取得
    if (this.gameScene && this.gameScene.player) {
      // 例: リアルタイムでプレイヤー状態を確認
      const player = this.gameScene.player;
      if (player.hp !== this.currentPlayerHp) {
        this.updatePlayerHp({ current: player.hp, max: player.maxHp });
      }
    }
  }

  updatePlayerHp({ current, max }) {
    this.currentPlayerHp = current;
    this.maxPlayerHp = max;
    
    const heartsToShow = Math.ceil((current / max) * this.playerHpHearts.length);
    
    this.playerHpHearts.forEach((heart, index) => {
      if (index < heartsToShow) {
        heart.setVisible(true);
        // 部分的なダメージの表現（最後のハートを薄くする等）
        const alpha = (index === heartsToShow - 1) ? 
          ((current % (max / this.playerHpHearts.length)) / (max / this.playerHpHearts.length)) : 1;
        heart.setAlpha(Math.max(alpha, 0.3));
      } else {
        heart.setVisible(false);
      }
    });
  }

  updateScore({ score }) {
    this.currentScore = score;
    this.scoreText.setText(`SCORE: ${score.toString().padStart(5, '0')}`);
  }

  updateCombo({ count }) {
    this.currentCombo = count;
    
    if (count > 0) {
      this.comboText.setText(`COMBO: ${count}x`);
      this.comboText.setVisible(true);
      
      // コンボ数に応じて色を変更
      if (count >= 10) {
        this.comboText.setFill('#ff00ff'); // 紫
      } else if (count >= 5) {
        this.comboText.setFill('#ff8800'); // オレンジ
      } else {
        this.comboText.setFill('#ffff00'); // 黄色
      }
    } else {
      this.comboText.setVisible(false);
    }
  }

  updateWeapon({ weapon }) {
    this.currentWeapon = weapon;
    
    if (weapon) {
      this.showWeaponDisplay();
      this.weaponNameText.setText(`武器: ${weapon.name}`);
      this.weaponDurabilityText.setText(`${weapon.durability}/${weapon.maxDurability}`);
      
      // 耐久度バーの更新
      const durabilityRatio = weapon.durability / weapon.maxDurability;
      this.weaponBar.setScale(durabilityRatio, 1);
      
      // 耐久度に応じて色を変更
      if (durabilityRatio > 0.6) {
        this.weaponBar.setFillStyle(0x00ff00); // 緑
      } else if (durabilityRatio > 0.3) {
        this.weaponBar.setFillStyle(0xffff00); // 黄色
      } else {
        this.weaponBar.setFillStyle(0xff0000); // 赤
      }
    } else {
      this.hideWeaponDisplay();
    }
  }

  updateBossHp({ current, max }) {
    this.bossHp = current;
    this.maxBossHp = max;
    
    if (this.bossVisible && max > 0) {
      const hpRatio = current / max;
      this.bossHpBar.setScale(hpRatio, 1);
    }
  }

  showWeaponDisplay() {
    this.weaponNameText.setVisible(true);
    this.weaponBarBg.setVisible(true);
    this.weaponBar.setVisible(true);
    this.weaponDurabilityText.setVisible(true);
  }

  hideWeaponDisplay() {
    this.weaponNameText.setVisible(false);
    this.weaponBarBg.setVisible(false);
    this.weaponBar.setVisible(false);
    this.weaponDurabilityText.setVisible(false);
  }

  showBossHpDisplay() {
    this.bossVisible = true;
    this.bossHpBg.setVisible(true);
    this.bossHpBar.setVisible(true);
    this.bossHpLabel.setVisible(true);
  }

  hideBossHpDisplay() {
    this.bossVisible = false;
    this.bossHpBg.setVisible(false);
    this.bossHpBar.setVisible(false);
    this.bossHpLabel.setVisible(false);
  }

  // クリーンアップ
  destroy() {
    if (this.gameScene) {
      this.gameScene.events.off('playerHpChange', this.updatePlayerHp, this);
      this.gameScene.events.off('scoreUpdate', this.updateScore, this);
      this.gameScene.events.off('comboUpdate', this.updateCombo, this);
      this.gameScene.events.off('weaponChange', this.updateWeapon, this);
      this.gameScene.events.off('bossHpChange', this.updateBossHp, this);
      this.gameScene.events.off('bossAppear', this.showBossHpDisplay, this);
      this.gameScene.events.off('bossDefeated', this.hideBossHpDisplay, this);
    }
    super.destroy();
  }
}