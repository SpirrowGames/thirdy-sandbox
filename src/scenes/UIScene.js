export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: true });
  }

  create() {
    // UI要素の初期化
    this.createPlayerUI();
    this.createScoreUI();
    this.createComboUI();
    this.createWeaponUI();
    this.createBossUI();
    
    // GameSceneからのイベントリスナー設定
    this.setupEventListeners();
    
    // デバッグ用の境界線（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      this.createDebugBorders();
    }
  }

  createPlayerUI() {
    // プレイヤーHP表示
    this.playerHpText = this.add.text(20, 20, 'HP:', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    });

    // HPハート表示用コンテナ
    this.playerHpContainer = this.add.container(60, 20);
    this.playerHpHearts = [];
    
    // 最大HP5個のハートを生成
    for (let i = 0; i < 5; i++) {
      const heart = this.add.text(i * 25, 0, '♥', {
        fontSize: '18px',
        fill: '#ff0000'
      });
      this.playerHpHearts.push(heart);
      this.playerHpContainer.add(heart);
    }
  }

  createScoreUI() {
    this.scoreText = this.add.text(300, 20, 'SCORE: 00000', {
      fontSize: '18px',
      fill: '#ffff00',
      fontFamily: 'Arial, sans-serif'
    });
  }

  createComboUI() {
    this.comboText = this.add.text(500, 20, 'COMBO: 0x', {
      fontSize: '18px',
      fill: '#00ff00',
      fontFamily: 'Arial, sans-serif'
    });
    this.comboText.setVisible(false); // コンボなしの時は非表示
  }

  createWeaponUI() {
    // 武器情報コンテナ（下部左）
    this.weaponContainer = this.add.container(20, 480);
    this.weaponContainer.setVisible(false); // 武器なしの時は非表示

    // 武器名
    this.weaponNameText = this.add.text(0, 0, '', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    });

    // 武器耐久度バー背景
    this.weaponDurabilityBg = this.add.rectangle(0, 25, 200, 10, 0x333333);
    this.weaponDurabilityBg.setOrigin(0, 0);

    // 武器耐久度バー
    this.weaponDurabilityBar = this.add.rectangle(0, 25, 200, 10, 0x00ff00);
    this.weaponDurabilityBar.setOrigin(0, 0);

    // 武器耐久度テキスト
    this.weaponDurabilityText = this.add.text(210, 25, '', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    });

    // コンテナに追加
    this.weaponContainer.add([
      this.weaponNameText,
      this.weaponDurabilityBg,
      this.weaponDurabilityBar,
      this.weaponDurabilityText
    ]);
  }

  createBossUI() {
    // ボスHP表示（下部中央）
    this.bossContainer = this.add.container(480, 450);
    this.bossContainer.setVisible(false); // ボス戦以外は非表示

    // ボス名
    this.bossNameText = this.add.text(0, 0, 'BOSS', {
      fontSize: '16px',
      fill: '#ff6600',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0);

    // ボスHPバー背景
    this.bossHpBg = this.add.rectangle(0, 25, 400, 15, 0x660000);
    this.bossHpBg.setOrigin(0.5, 0);

    // ボスHPバー
    this.bossHpBar = this.add.rectangle(0, 25, 400, 15, 0xff0000);
    this.bossHpBar.setOrigin(0.5, 0);

    // ボスHPテキスト
    this.bossHpText = this.add.text(0, 45, '', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0);

    this.bossContainer.add([
      this.bossNameText,
      this.bossHpBg,
      this.bossHpBar,
      this.bossHpText
    ]);
  }

  setupEventListeners() {
    // GameSceneからのイベントを購読
    const gameScene = this.scene.get('GameScene');
    
    if (gameScene) {
      gameScene.events.on('playerHpChange', this.updatePlayerHp, this);
      gameScene.events.on('scoreUpdate', this.updateScore, this);
      gameScene.events.on('comboUpdate', this.updateCombo, this);
      gameScene.events.on('weaponChange', this.updateWeapon, this);
      gameScene.events.on('bossHpChange', this.updateBossHp, this);
      gameScene.events.on('bossAppear', this.showBossUI, this);
      gameScene.events.on('bossDefeated', this.hideBossUI, this);
    }
  }

  createDebugBorders() {
    // 開発用：UI領域の境界線を表示
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xff00ff, 0.5);
    
    // 上部HUD領域
    graphics.strokeRect(10, 10, 940, 50);
    
    // 下部UI領域
    graphics.strokeRect(10, 470, 940, 60);
    
    // 中央ゲーム領域（参考）
    graphics.strokeRect(10, 70, 940, 390);
  }

  updatePlayerHp({ current, max }) {
    // ハートの表示/非表示を更新
    const heartsToShow = Math.ceil((current / max) * this.playerHpHearts.length);
    
    this.playerHpHearts.forEach((heart, index) => {
      if (index < heartsToShow) {
        heart.setVisible(true);
        // HPが少ない時は色を変更
        if (current / max < 0.3) {
          heart.setTint(0xff6666); // 薄い赤
        } else {
          heart.clearTint();
        }
      } else {
        heart.setVisible(false);
      }
    });
  }

  updateScore({ score }) {
    this.scoreText.setText(`SCORE: ${score.toString().padStart(5, '0')}`);
  }

  updateCombo({ count }) {
    if (count > 0) {
      this.comboText.setText(`COMBO: ${count}x`);
      this.comboText.setVisible(true);
      
      // コンボ数に応じて色を変更
      if (count >= 10) {
        this.comboText.setTint(0xff00ff); // マゼンタ
      } else if (count >= 5) {
        this.comboText.setTint(0xffff00); // 黄色
      } else {
        this.comboText.clearTint(); // 緑
      }
    } else {
      this.comboText.setVisible(false);
    }
  }

  updateWeapon(weaponData) {
    if (weaponData) {
      const { name, durability, maxDurability } = weaponData;
      
      this.weaponNameText.setText(`武器: ${name}`);
      this.weaponDurabilityText.setText(`${durability}/${maxDurability}`);
      
      // 耐久度バーの幅を調整
      const durabilityRatio = durability / maxDurability;
      this.weaponDurabilityBar.setSize(200 * durabilityRatio, 10);
      
      // 耐久度に応じて色を変更
      if (durabilityRatio > 0.6) {
        this.weaponDurabilityBar.setFillStyle(0x00ff00); // 緑
      } else if (durabilityRatio > 0.3) {
        this.weaponDurabilityBar.setFillStyle(0xffff00); // 黄色
      } else {
        this.weaponDurabilityBar.setFillStyle(0xff0000); // 赤
      }
      
      this.weaponContainer.setVisible(true);
    } else {
      this.weaponContainer.setVisible(false);
    }
  }

  updateBossHp({ current, max, name }) {
    if (name) {
      this.bossNameText.setText(name);
    }
    
    this.bossHpText.setText(`${current} / ${max}`);
    
    // HPバーの幅を調整
    const hpRatio = current / max;
    this.bossHpBar.setSize(400 * hpRatio, 15);
    
    // HP残量に応じて色を変更
    if (hpRatio > 0.6) {
      this.bossHpBar.setFillStyle(0xff0000); // 赤
    } else if (hpRatio > 0.3) {
      this.bossHpBar.setFillStyle(0xff6600); // オレンジ
    } else {
      this.bossHpBar.setFillStyle(0xff9900); // 黄色っぽい
    }
  }

  showBossUI(bossData) {
    this.bossContainer.setVisible(true);
    
    // ボス出現エフェクト
    this.bossContainer.setAlpha(0);
    this.tweens.add({
      targets: this.bossContainer,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
  }

  hideBossUI() {
    // ボス撃破エフェクト
    this.tweens.add({
      targets: this.bossContainer,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.bossContainer.setVisible(false);
        this.bossContainer.setAlpha(1); // 次回用にリセット
      }
    });
  }

  // シーン破棄時のクリーンアップ
  shutdown() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.off('playerHpChange', this.updatePlayerHp, this);
      gameScene.events.off('scoreUpdate', this.updateScore, this);
      gameScene.events.off('comboUpdate', this.updateCombo, this);
      gameScene.events.off('weaponChange', this.updateWeapon, this);
      gameScene.events.off('bossHpChange', this.updateBossHp, this);
      gameScene.events.off('bossAppear', this.showBossUI, this);
      gameScene.events.off('bossDefeated', this.hideBossUI, this);
    }
  }
}