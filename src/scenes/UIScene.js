export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    
    // UI要素の参照を保持
    this.playerHpBar = null;
    this.playerHpText = null;
    this.bossHpBar = null;
    this.bossHpText = null;
    this.scoreText = null;
    this.comboText = null;
    this.weaponInfo = null;
    
    // 状態管理
    this.playerHp = { current: 100, max: 100 };
    this.bossHp = { current: 0, max: 0, visible: false };
    this.score = 0;
    this.combo = 0;
    this.weapon = { name: '', durability: 0, max: 0, visible: false };
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
    // プレイヤーHP表示（左上）
    this.add.text(20, 20, 'PLAYER', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    });

    // HPバー背景
    const hpBarBg = this.add.rectangle(20, 50, 200, 20, 0x333333);
    hpBarBg.setOrigin(0, 0);

    // HPバー（緑色）
    this.playerHpBar = this.add.rectangle(20, 50, 200, 20, 0x00ff00);
    this.playerHpBar.setOrigin(0, 0);

    // HP数値テキスト
    this.playerHpText = this.add.text(230, 55, '100/100', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    });
  }

  createScoreHUD() {
    // スコア表示（上部中央）
    this.scoreText = this.add.text(480, 20, 'SCORE: 000000', {
      fontSize: '18px',
      fill: '#ffff00',
      fontFamily: 'monospace'
    });
    this.scoreText.setOrigin(0.5, 0);
  }

  createComboHUD() {
    // コンボ表示（右上）
    this.comboText = this.add.text(840, 20, 'COMBO: 0x', {
      fontSize: '16px',
      fill: '#ff8800',
      fontFamily: 'monospace'
    });
    this.comboText.setOrigin(1, 0);
  }

  createWeaponHUD() {
    // 武器情報（下部左）
    this.weaponInfo = this.add.group();

    const weaponBg = this.add.rectangle(20, 500, 300, 30, 0x000000, 0.7);
    weaponBg.setOrigin(0, 0);
    weaponBg.setVisible(false);
    this.weaponInfo.add(weaponBg);

    const weaponText = this.add.text(25, 510, '', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    });
    this.weaponInfo.add(weaponText);

    const weaponDurabilityBg = this.add.rectangle(25, 485, 100, 8, 0x444444);
    weaponDurabilityBg.setOrigin(0, 0);
    this.weaponInfo.add(weaponDurabilityBg);

    const weaponDurabilityBar = this.add.rectangle(25, 485, 100, 8, 0x0088ff);
    weaponDurabilityBar.setOrigin(0, 0);
    this.weaponInfo.add(weaponDurabilityBar);

    // 初期状態では非表示
    this.weaponInfo.setVisible(false);
  }

  createBossHUD() {
    // ボスHP表示（下部中央）
    this.add.text(480, 480, 'BOSS', {
      fontSize: '16px',
      fill: '#ff0000',
      fontFamily: 'monospace'
    }).setOrigin(0.5, 0).setVisible(false);

    const bossHpBarBg = this.add.rectangle(280, 505, 400, 25, 0x333333);
    bossHpBarBg.setOrigin(0, 0);
    bossHpBarBg.setVisible(false);

    this.bossHpBar = this.add.rectangle(280, 505, 400, 25, 0xff0000);
    this.bossHpBar.setOrigin(0, 0);
    this.bossHpBar.setVisible(false);

    this.bossHpText = this.add.text(690, 517, '', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    });
    this.bossHpText.setVisible(false);

    // ボス関連UIをグループ化
    this.bossHUD = this.add.group([
      this.children.getByName('BOSS') || this.add.text(480, 480, 'BOSS', {
        fontSize: '16px',
        fill: '#ff0000',
        fontFamily: 'monospace'
      }).setOrigin(0.5, 0),
      bossHpBarBg,
      this.bossHpBar,
      this.bossHpText
    ]);
    this.bossHUD.setVisible(false);
  }

  setupEventListeners() {
    const gameScene = this.scene.get('GameScene');
    
    if (gameScene) {
      // プレイヤーHP変更イベント
      gameScene.events.on('playerHpChange', (data) => {
        this.updatePlayerHp(data.current, data.max);
      });

      // ボスHP変更イベント
      gameScene.events.on('bossHpChange', (data) => {
        this.updateBossHp(data.current, data.max);
      });

      // スコア更新イベント
      gameScene.events.on('scoreUpdate', (data) => {
        this.updateScore(data.score);
      });

      // コンボ更新イベント
      gameScene.events.on('comboUpdate', (data) => {
        this.updateCombo(data.count);
      });

      // 武器変更イベント
      gameScene.events.on('weaponChange', (data) => {
        this.updateWeapon(data.name, data.durability, data.max);
      });

      // 武器破棄イベント
      gameScene.events.on('weaponLost', () => {
        this.hideWeapon();
      });

      // ボス出現イベント
      gameScene.events.on('bossAppear', () => {
        this.showBossHUD();
      });

      // ボス撃破イベント
      gameScene.events.on('bossDefeated', () => {
        this.hideBossHUD();
      });
    }
  }

  updatePlayerHp(current, max) {
    this.playerHp.current = Math.max(0, current);
    this.playerHp.max = max;
    
    const hpRatio = this.playerHp.current / this.playerHp.max;
    const barWidth = 200 * hpRatio;
    
    this.playerHpBar.setSize(barWidth, 20);
    
    // HPが低い時は色を変更
    if (hpRatio <= 0.25) {
      this.playerHpBar.setFillStyle(0xff0000); // 赤色
    } else if (hpRatio <= 0.5) {
      this.playerHpBar.setFillStyle(0xffff00); // 黄色
    } else {
      this.playerHpBar.setFillStyle(0x00ff00); // 緑色
    }
    
    this.playerHpText.setText(`${this.playerHp.current}/${this.playerHp.max}`);
  }

  updateBossHp(current, max) {
    this.bossHp.current = Math.max(0, current);
    this.bossHp.max = max;
    
    const hpRatio = this.bossHp.current / this.bossHp.max;
    const barWidth = 400 * hpRatio;
    
    this.bossHpBar.setSize(barWidth, 25);
    this.bossHpText.setText(`${this.bossHp.current}/${this.bossHp.max}`);
  }

  updateScore(score) {
    this.score = score;
    this.scoreText.setText(`SCORE: ${String(score).padStart(6, '0')}`);
  }

  updateCombo(count) {
    this.combo = count;
    
    if (count > 0) {
      this.comboText.setText(`COMBO: ${count}x`);
      this.comboText.setFill('#ff8800');
      
      // コンボが高い時は色を変更
      if (count >= 10) {
        this.comboText.setFill('#ff0000');
      } else if (count >= 5) {
        this.comboText.setFill('#ff4400');
      }
    } else {
      this.comboText.setText('COMBO: 0x');
      this.comboText.setFill('#888888');
    }
  }

  updateWeapon(name, durability, max) {
    this.weapon.name = name;
    this.weapon.durability = durability;
    this.weapon.max = max;
    this.weapon.visible = true;

    const weaponText = this.weaponInfo.getChildren()[1];
    weaponText.setText(`${name} (${durability}/${max})`);

    const durabilityBar = this.weaponInfo.getChildren()[3];
    const durabilityRatio = durability / max;
    const barWidth = 100 * durabilityRatio;
    durabilityBar.setSize(barWidth, 8);

    // 耐久度に応じて色を変更
    if (durabilityRatio <= 0.25) {
      durabilityBar.setFillStyle(0xff0000); // 赤色
    } else if (durabilityRatio <= 0.5) {
      durabilityBar.setFillStyle(0xffff00); // 黄色
    } else {
      durabilityBar.setFillStyle(0x0088ff); // 青色
    }

    this.weaponInfo.setVisible(true);
  }

  hideWeapon() {
    this.weapon.visible = false;
    this.weaponInfo.setVisible(false);
  }

  showBossHUD() {
    this.bossHUD.setVisible(true);
  }

  hideBossHUD() {
    this.bossHUD.setVisible(false);
  }

  // デバッグ用：UI状態を強制更新
  debugUpdateAll() {
    this.updatePlayerHp(75, 100);
    this.updateScore(12340);
    this.updateCombo(3);
    this.updateWeapon('スチームパイプ', 2, 4);
    this.updateBossHp(150, 200);
    this.showBossHUD();
  }
}