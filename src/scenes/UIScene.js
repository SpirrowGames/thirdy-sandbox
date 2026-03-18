class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    
    // UI要素の参照を保持
    this.playerHpBar = null;
    this.playerHpText = null;
    this.scoreText = null;
    this.comboText = null;
    this.weaponInfo = null;
    this.bossHpBar = null;
    this.bossHpContainer = null;
    
    // 状態管理
    this.gameScene = null;
    this.isInitialized = false;
  }

  create() {
    try {
      // GameSceneの参照を取得
      this.gameScene = this.scene.get('GameScene');
      
      if (!this.gameScene) {
        console.error('GameSceneが見つかりません');
        return;
      }

      // UI要素の作成
      this.createPlayerHUD();
      this.createScoreDisplay();
      this.createComboDisplay();
      this.createWeaponDisplay();
      this.createBossHUD();

      // GameSceneからのイベントリスナー設定
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('UIScene initialized successfully');

    } catch (error) {
      console.error('UIScene create error:', error);
    }
  }

  /**
   * プレイヤーHUD（HP表示）を作成
   */
  createPlayerHUD() {
    const padding = 20;
    const heartSize = 24;
    const heartSpacing = 28;
    
    // HPハート表示用のコンテナ
    this.playerHpContainer = this.add.container(padding, padding);
    
    // HPハート（最大5個想定）
    this.playerHearts = [];
    for (let i = 0; i < 5; i++) {
      const heart = this.add.rectangle(
        i * heartSpacing, 0, 
        heartSize, heartSize, 
        0xff4444
      );
      heart.setStrokeStyle(2, 0xffffff);
      this.playerHpContainer.add(heart);
      this.playerHearts.push(heart);
    }

    // HP数値表示（デバッグ用）
    this.playerHpText = this.add.text(
      padding, padding + 40, 
      'HP: 100/100', 
      {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
  }

  /**
   * スコア表示を作成
   */
  createScoreDisplay() {
    const centerX = this.cameras.main.width / 2;
    const padding = 20;

    this.scoreText = this.add.text(
      centerX, padding,
      'SCORE: 00000',
      {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.scoreText.setOrigin(0.5, 0);
  }

  /**
   * コンボ表示を作成
   */
  createComboDisplay() {
    const rightPadding = 20;
    const topPadding = 20;
    const x = this.cameras.main.width - rightPadding;

    this.comboText = this.add.text(
      x, topPadding,
      'COMBO: 0x',
      {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.comboText.setOrigin(1, 0);
    this.comboText.setVisible(false); // コンボ0の時は非表示
  }

  /**
   * 武器情報表示を作成
   */
  createWeaponDisplay() {
    const padding = 20;
    const bottomY = this.cameras.main.height - padding - 60;

    // 武器情報コンテナ（武器所持時のみ表示）
    this.weaponContainer = this.add.container(padding, bottomY);
    
    // 武器名
    this.weaponNameText = this.add.text(
      0, 0,
      '',
      {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.weaponContainer.add(this.weaponNameText);

    // 耐久度バー背景
    this.weaponDurabilityBg = this.add.rectangle(
      0, 25, 120, 12, 0x444444
    );
    this.weaponDurabilityBg.setOrigin(0, 0.5);
    this.weaponDurabilityBg.setStrokeStyle(1, 0xffffff);
    this.weaponContainer.add(this.weaponDurabilityBg);

    // 耐久度バー
    this.weaponDurabilityBar = this.add.rectangle(
      0, 25, 120, 12, 0x00ff00
    );
    this.weaponDurabilityBar.setOrigin(0, 0.5);
    this.weaponContainer.add(this.weaponDurabilityBar);

    // 耐久度テキスト
    this.weaponDurabilityText = this.add.text(
      125, 25,
      '',
      {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }
    );
    this.weaponDurabilityText.setOrigin(0, 0.5);
    this.weaponContainer.add(this.weaponDurabilityText);

    // 初期状態では非表示
    this.weaponContainer.setVisible(false);
  }

  /**
   * ボスHUD（ボス戦時のみ表示）を作成
   */
  createBossHUD() {
    const padding = 20;
    const bottomY = this.cameras.main.height - padding - 20;
    const barWidth = this.cameras.main.width - padding * 2;

    // ボスHPコンテナ
    this.bossHpContainer = this.add.container(padding, bottomY);

    // ボス名
    this.bossNameText = this.add.text(
      0, -25,
      'STEAM ARMOR SOLDIER',
      {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ff6666',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.bossNameText.setOrigin(0, 0.5);
    this.bossHpContainer.add(this.bossNameText);

    // HPバー背景
    this.bossHpBg = this.add.rectangle(
      0, 0, barWidth, 16, 0x444444
    );
    this.bossHpBg.setOrigin(0, 0.5);
    this.bossHpBg.setStrokeStyle(2, 0xffffff);
    this.bossHpContainer.add(this.bossHpBg);

    // HPバー
    this.bossHpBar = this.add.rectangle(
      0, 0, barWidth, 16, 0xff4444
    );
    this.bossHpBar.setOrigin(0, 0.5);
    this.bossHpContainer.add(this.bossHpBar);

    // HPテキスト
    this.bossHpText = this.add.text(
      barWidth / 2, 0,
      'BOSS HP',
      {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }
    );
    this.bossHpText.setOrigin(0.5, 0.5);
    this.bossHpContainer.add(this.bossHpText);

    // 初期状態では非表示
    this.bossHpContainer.setVisible(false);
  }

  /**
   * GameSceneからのイベントリスナーを設定
   */
  setupEventListeners() {
    // プレイヤーHP変更
    this.gameScene.events.on('playerHpChange', this.updatePlayerHp, this);
    
    // スコア更新
    this.gameScene.events.on('scoreUpdate', this.updateScore, this);
    
    // コンボ更新
    this.gameScene.events.on('comboUpdate', this.updateCombo, this);
    
    // 武器変更
    this.gameScene.events.on('weaponChange', this.updateWeapon, this);
    
    // ボスHP変更
    this.gameScene.events.on('bossHpChange', this.updateBossHp, this);
    
    // ボス戦開始/終了
    this.gameScene.events.on('bossStart', this.showBossHUD, this);
    this.gameScene.events.on('bossEnd', this.hideBossHUD, this);
  }

  /**
   * プレイヤーHP表示を更新
   */
  updatePlayerHp(data) {
    const { current, max } = data;
    
    // ハート表示の更新
    const heartsToShow = Math.ceil((current / max) * this.playerHearts.length);
    
    this.playerHearts.forEach((heart, index) => {
      if (index < heartsToShow) {
        heart.setFillStyle(0xff4444);
        heart.setAlpha(1);
      } else {
        heart.setFillStyle(0x444444);
        heart.setAlpha(0.5);
      }
    });

    // HP数値の更新
    this.playerHpText.setText(`HP: ${current}/${max}`);
  }

  /**
   * スコア表示を更新
   */
  updateScore(data) {
    const { score } = data;
    const formattedScore = score.toString().padStart(5, '0');
    this.scoreText.setText(`SCORE: ${formattedScore}`);
  }

  /**
   * コンボ表示を更新
   */
  updateCombo(data) {
    const { count } = data;
    
    if (count <= 0) {
      this.comboText.setVisible(false);
    } else {
      this.comboText.setVisible(true);
      this.comboText.setText(`COMBO: ${count}x`);
      
      // コンボ数に応じて色を変更
      if (count >= 10) {
        this.comboText.setColor('#ff00ff'); // 紫
      } else if (count >= 5) {
        this.comboText.setColor('#ffff00'); // 黄
      } else {
        this.comboText.setColor('#00ff00'); // 緑
      }
    }
  }

  /**
   * 武器情報表示を更新
   */
  updateWeapon(data) {
    if (!data || !data.name) {
      // 武器を持っていない場合は非表示
      this.weaponContainer.setVisible(false);
      return;
    }

    const { name, durability, max } = data;
    
    // 武器情報を表示
    this.weaponContainer.setVisible(true);
    this.weaponNameText.setText(`武器: ${name}`);
    
    // 耐久度バーの更新
    const durabilityRatio = durability / max;
    const maxBarWidth = 120;
    const currentBarWidth = maxBarWidth * durabilityRatio;
    
    this.weaponDurabilityBar.setSize(currentBarWidth, 12);
    
    // 耐久度に応じて色を変更
    if (durabilityRatio > 0.6) {
      this.weaponDurabilityBar.setFillStyle(0x00ff00); // 緑
    } else if (durabilityRatio > 0.3) {
      this.weaponDurabilityBar.setFillStyle(0xffff00); // 黄
    } else {
      this.weaponDurabilityBar.setFillStyle(0xff0000); // 赤
    }
    
    this.weaponDurabilityText.setText(`${durability}/${max}`);
  }

  /**
   * ボスHP表示を更新
   */
  updateBossHp(data) {
    const { current, max } = data;
    
    if (!this.bossHpContainer.visible) {
      return;
    }
    
    const hpRatio = current / max;
    const maxBarWidth = this.cameras.main.width - 40;
    const currentBarWidth = maxBarWidth * hpRatio;
    
    this.bossHpBar.setSize(currentBarWidth, 16);
    
    // HP比率に応じて色を変更（フェーズ表現）
    if (hpRatio > 0.5) {
      this.bossHpBar.setFillStyle(0xff4444); // 赤（フェーズ1）
    } else {
      this.bossHpBar.setFillStyle(0xff8800); // オレンジ（フェーズ2）
    }
  }

  /**
   * ボスHUD表示
   */
  showBossHUD() {
    this.bossHpContainer.setVisible(true);
  }

  /**
   * ボスHUD非表示
   */
  hideBossHUD() {
    this.bossHpContainer.setVisible(false);
  }

  /**
   * シーン破棄時のクリーンアップ
   */
  destroy() {
    if (this.gameScene && this.gameScene.events) {
      // イベントリスナーを削除
      this.gameScene.events.off('playerHpChange', this.updatePlayerHp, this);
      this.gameScene.events.off('scoreUpdate', this.updateScore, this);
      this.gameScene.events.off('comboUpdate', this.updateCombo, this);
      this.gameScene.events.off('weaponChange', this.updateWeapon, this);
      this.gameScene.events.off('bossHpChange', this.updateBossHp, this);
      this.gameScene.events.off('bossStart', this.showBossHUD, this);
      this.gameScene.events.off('bossEnd', this.hideBossHUD, this);
    }
    
    super.destroy();
  }
}

export default UIScene;