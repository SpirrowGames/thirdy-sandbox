export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: true });
    
    // UI要素の参照
    this.playerHpBar = null;
    this.playerHpText = null;
    this.scoreText = null;
    this.comboText = null;
    this.weaponBar = null;
    this.weaponText = null;
    this.bossHpBar = null;
    this.bossHpText = null;
    
    // 状態管理
    this.currentPlayerHp = 100;
    this.maxPlayerHp = 100;
    this.currentScore = 0;
    this.currentCombo = 0;
    this.currentWeapon = null;
    this.bossVisible = false;
  }

  create() {
    this.createPlayerHUD();
    this.createScoreHUD();
    this.createComboHUD();
    this.createWeaponHUD();
    this.createBossHUD();
    this.setupEventListeners();
  }

  createPlayerHUD() {
    // プレイヤーHP背景
    this.add.rectangle(20, 30, 200, 20, 0x333333)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0xffffff);

    // プレイヤーHPバー（緑色）
    this.playerHpBar = this.add.rectangle(20, 30, 200, 16, 0x00ff00)
      .setOrigin(0, 0.5);

    // HPテキスト
    this.playerHpText = this.add.text(230, 30, '100/100', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    // HPアイコン（ハート）
    this.add.text(5, 30, '♥', {
      fontSize: '20px',
      color: '#ff0000'
    }).setOrigin(0.5, 0.5);
  }

  createScoreHUD() {
    this.add.text(400, 30, 'SCORE:', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(480, 30, '000000', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);
  }

  createComboHUD() {
    this.comboText = this.add.text(650, 30, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ff8800',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
  }

  createWeaponHUD() {
    // 武器HUDコンテナ（初期は非表示）
    this.weaponContainer = this.add.container(20, 500);
    this.weaponContainer.setVisible(false);

    // 武器名背景
    const weaponBg = this.add.rectangle(0, 0, 250, 40, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff);
    this.weaponContainer.add(weaponBg);

    // 武器耐久度背景
    const durabilityBg = this.add.rectangle(10, 10, 200, 12, 0x333333)
      .setOrigin(0, 0.5);
    this.weaponContainer.add(durabilityBg);

    // 武器耐久度バー
    this.weaponBar = this.add.rectangle(10, 10, 200, 8, 0x00aaff)
      .setOrigin(0, 0.5);
    this.weaponContainer.add(this.weaponBar);

    // 武器名テキスト
    this.weaponText = this.add.text(0, -10, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0, 0.5);
    this.weaponContainer.add(this.weaponText);
  }

  createBossHUD() {
    // ボスHUDコンテナ（初期は非表示）
    this.bossContainer = this.add.container(300, 480);
    this.bossContainer.setVisible(false);

    // ボスHP背景
    const bossHpBg = this.add.rectangle(0, 0, 360, 25, 0x333333)
      .setStrokeStyle(3, 0xff0000);
    this.bossContainer.add(bossHpBg);

    // ボスHPバー
    this.bossHpBar = this.add.rectangle(-180, 0, 360, 20, 0xff4444)
      .setOrigin(0, 0.5);
    this.bossContainer.add(this.bossHpBar);

    // ボス名テキスト
    this.bossHpText = this.add.text(0, -15, 'STEAM ARMOR SOLDIER', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5);
    this.bossContainer.add(this.bossHpText);
  }

  setupEventListeners() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;

    // プレイヤーHP更新
    gameScene.events.on('playerHpChange', (data) => {
      this.updatePlayerHp(data.current, data.max);
    });

    // スコア更新
    gameScene.events.on('scoreUpdate', (data) => {
      this.updateScore(data.score);
    });

    // コンボ更新
    gameScene.events.on('comboUpdate', (data) => {
      this.updateCombo(data.count);
    });

    // 武器変更
    gameScene.events.on('weaponChange', (data) => {
      this.updateWeapon(data);
    });

    // ボスHP更新
    gameScene.events.on('bossHpChange', (data) => {
      this.updateBossHp(data.current, data.max);
    });

    // ボス出現/消滅
    gameScene.events.on('bossAppear', () => {
      this.showBossHUD();
    });

    gameScene.events.on('bossDefeated', () => {
      this.hideBossHUD();
    });
  }

  updatePlayerHp(current, max) {
    this.currentPlayerHp = current;
    this.maxPlayerHp = max;

    // HPバーの幅を調整
    const hpRatio = current / max;
    this.playerHpBar.setScale(hpRatio, 1);

    // HPバーの色を変更（危険時は赤）
    if (hpRatio <= 0.3) {
      this.playerHpBar.setFillStyle(0xff0000); // 赤
    } else if (hpRatio <= 0.6) {
      this.playerHpBar.setFillStyle(0xffff00); // 黄
    } else {
      this.playerHpBar.setFillStyle(0x00ff00); // 緑
    }

    // HPテキスト更新
    this.playerHpText.setText(`${current}/${max}`);

    // 低HP時の点滅演出
    if (hpRatio <= 0.2 && !this.playerHpBar.getData('blinking')) {
      this.playerHpBar.setData('blinking', true);
      this.tweens.add({
        targets: this.playerHpBar,
        alpha: 0.3,
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    } else if (hpRatio > 0.2 && this.playerHpBar.getData('blinking')) {
      this.playerHpBar.setData('blinking', false);
      this.tweens.killTweensOf(this.playerHpBar);
      this.playerHpBar.setAlpha(1);
    }
  }

  updateScore(score) {
    this.currentScore = score;
    // 6桁ゼロパディング
    this.scoreText.setText(score.toString().padStart(6, '0'));

    // スコア増加時のフラッシュ演出
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  updateCombo(count) {
    this.currentCombo = count;
    
    if (count === 0) {
      this.comboText.setText('');
      return;
    }

    this.comboText.setText(`COMBO: ${count}x`);

    // コンボ数に応じた色変更
    if (count >= 10) {
      this.comboText.setColor('#ff0088'); // マゼンタ
    } else if (count >= 5) {
      this.comboText.setColor('#ff8800'); // オレンジ
    } else {
      this.comboText.setColor('#ffff00'); // 黄色
    }

    // コンボ更新時のバウンス演出
    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }

  updateWeapon(weaponData) {
    if (!weaponData) {
      // 武器を失った場合
      this.weaponContainer.setVisible(false);
      this.currentWeapon = null;
      return;
    }

    this.currentWeapon = weaponData;
    this.weaponContainer.setVisible(true);

    // 武器名更新
    this.weaponText.setText(weaponData.name);

    // 耐久度バー更新
    const durabilityRatio = weaponData.durability / weaponData.max;
    this.weaponBar.setScale(durabilityRatio, 1);

    // 耐久度に応じた色変更
    if (durabilityRatio <= 0.3) {
      this.weaponBar.setFillStyle(0xff4444); // 赤
    } else if (durabilityRatio <= 0.6) {
      this.weaponBar.setFillStyle(0xffaa44); // オレンジ
    } else {
      this.weaponBar.setFillStyle(0x00aaff); // 青
    }

    // 武器取得時の出現演出
    if (weaponData.justPickedUp) {
      this.weaponContainer.setAlpha(0);
      this.tweens.add({
        targets: this.weaponContainer,
        alpha: 1,
        y: this.weaponContainer.y - 10,
        duration: 300,
        ease: 'Back.easeOut'
      });
    }
  }

  updateBossHp(current, max) {
    if (!this.bossVisible) return;

    // ボスHPバーの幅を調整
    const hpRatio = current / max;
    this.bossHpBar.setScale(hpRatio, 1);

    // フェーズ2移行時（HP50%以下）の色変更
    if (hpRatio <= 0.5) {
      this.bossHpBar.setFillStyle(0xff8800); // オレンジ
    }

    // 被ダメージ時のフラッシュ演出
    this.tweens.add({
      targets: this.bossHpBar,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  showBossHUD() {
    this.bossVisible = true;
    this.bossContainer.setVisible(true);
    
    // ボスHUD出現演出
    this.bossContainer.setY(540); // 画面下から
    this.tweens.add({
      targets: this.bossContainer,
      y: 480,
      duration: 500,
      ease: 'Power3.easeOut'
    });
  }

  hideBossHUD() {
    this.bossVisible = false;
    
    // ボスHUD消失演出
    this.tweens.add({
      targets: this.bossContainer,
      y: 540,
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.bossContainer.setVisible(false);
        this.bossContainer.setAlpha(1);
      }
    });
  }

  // デバッグ用メソッド
  debugUpdate(playerHp, score, combo, weapon, bossHp) {
    this.updatePlayerHp(playerHp.current, playerHp.max);
    this.updateScore(score);
    this.updateCombo(combo);
    if (weapon) this.updateWeapon(weapon);
    if (bossHp) {
      if (!this.bossVisible) this.showBossHUD();
      this.updateBossHp(bossHp.current, bossHp.max);
    }
  }
}