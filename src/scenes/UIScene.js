export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: true });
    
    // UI要素の参照
    this.hpHearts = [];
    this.scoreText = null;
    this.comboText = null;
    this.weaponContainer = null;
    this.weaponNameText = null;
    this.weaponDurabilityBar = null;
    this.weaponDurabilityBg = null;
    this.bossHpContainer = null;
    this.bossHpBar = null;
    this.bossHpBg = null;
    
    // 状態管理
    this.gameScene = null;
    this.currentPlayerHp = 100;
    this.maxPlayerHp = 100;
    this.currentScore = 0;
    this.currentCombo = 0;
    this.currentWeapon = null;
    this.bossVisible = false;
  }

  create() {
    // GameSceneの参照を取得
    this.gameScene = this.scene.get('GameScene');
    
    // UI要素の作成
    this.createPlayerHUD();
    this.createScoreDisplay();
    this.createComboDisplay();
    this.createWeaponDisplay();
    this.createBossHpDisplay();
    
    // GameSceneからのイベント購読
    this.subscribeToGameEvents();
    
    console.log('UIScene initialized');
  }

  /**
   * プレイヤーのHP表示（ハート形式）を作成
   */
  createPlayerHUD() {
    const startX = 20;
    const startY = 20;
    const heartSpacing = 35;
    
    // 最大HP分のハートを作成
    for (let i = 0; i < 5; i++) {
      const heart = this.add.rectangle(
        startX + i * heartSpacing, 
        startY, 
        30, 
        25, 
        0xff3366
      );
      heart.setStrokeStyle(2, 0x000000);
      this.hpHearts.push(heart);
    }
  }

  /**
   * スコア表示を作成
   */
  createScoreDisplay() {
    this.scoreText = this.add.text(250, 20, 'SCORE: 00000', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
  }

  /**
   * コンボ表示を作成
   */
  createComboDisplay() {
    this.comboText = this.add.text(450, 20, 'COMBO: 0x', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.comboText.setVisible(false); // 初期は非表示
  }

  /**
   * 武器表示を作成
   */
  createWeaponDisplay() {
    this.weaponContainer = this.add.container(20, 480);
    
    // 武器名テキスト
    this.weaponNameText = this.add.text(0, 0, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    });
    
    // 耐久度バー背景
    this.weaponDurabilityBg = this.add.rectangle(0, 25, 150, 10, 0x333333);
    this.weaponDurabilityBg.setStrokeStyle(1, 0xffffff);
    
    // 耐久度バー
    this.weaponDurabilityBar = this.add.rectangle(0, 25, 150, 10, 0x00ff00);
    
    this.weaponContainer.add([
      this.weaponNameText,
      this.weaponDurabilityBg,
      this.weaponDurabilityBar
    ]);
    
    this.weaponContainer.setVisible(false); // 初期は非表示
  }

  /**
   * ボスHP表示を作成
   */
  createBossHpDisplay() {
    this.bossHpContainer = this.add.container(200, 500);
    
    // ボスHPバー背景
    this.bossHpBg = this.add.rectangle(0, 0, 400, 20, 0x333333);
    this.bossHpBg.setStrokeStyle(2, 0xffffff);
    
    // ボスHPバー
    this.bossHpBar = this.add.rectangle(0, 0, 400, 20, 0xff0000);
    
    // ボスHPラベル
    const bossLabel = this.add.text(0, -35, 'BOSS HP', {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    });
    bossLabel.setOrigin(0.5);
    
    this.bossHpContainer.add([
      this.bossHpBg,
      this.bossHpBar,
      bossLabel
    ]);
    
    this.bossHpContainer.setVisible(false); // 初期は非表示
  }

  /**
   * GameSceneからのイベントを購読
   */
  subscribeToGameEvents() {
    if (!this.gameScene || !this.gameScene.events) {
      console.warn('GameScene not found or events not available');
      return;
    }

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
    
    // ボス出現/消滅
    this.gameScene.events.on('bossAppear', this.showBossHp, this);
    this.gameScene.events.on('bossDefeated', this.hideBossHp, this);
  }

  /**
   * プレイヤーHP表示を更新
   * @param {Object} data - {current: number, max: number}
   */
  updatePlayerHp(data) {
    this.currentPlayerHp = data.current;
    this.maxPlayerHp = data.max;
    
    const heartsToShow = Math.ceil((data.current / data.max) * this.hpHearts.length);
    
    this.hpHearts.forEach((heart, index) => {
      if (index < heartsToShow) {
        heart.setVisible(true);
        // HP割合に応じて色を変更
        if (data.current / data.max > 0.6) {
          heart.setFillStyle(0xff3366); // 赤（健康）
        } else if (data.current / data.max > 0.3) {
          heart.setFillStyle(0xffaa00); // オレンジ（注意）
        } else {
          heart.setFillStyle(0x666666); // グレー（危険）
        }
      } else {
        heart.setVisible(false);
      }
    });
  }

  /**
   * スコア表示を更新
   * @param {Object} data - {score: number}
   */
  updateScore(data) {
    this.currentScore = data.score;
    const formattedScore = data.score.toString().padStart(5, '0');
    this.scoreText.setText(`SCORE: ${formattedScore}`);
  }

  /**
   * コンボ表示を更新
   * @param {Object} data - {count: number}
   */
  updateCombo(data) {
    this.currentCombo = data.count;
    
    if (data.count > 1) {
      this.comboText.setText(`COMBO: ${data.count}x`);
      this.comboText.setVisible(true);
      
      // コンボ数に応じて色を変更
      if (data.count >= 10) {
        this.comboText.setFill('#ff00ff'); // マゼンタ（超高コンボ）
      } else if (data.count >= 5) {
        this.comboText.setFill('#ff0000'); // 赤（高コンボ）
      } else {
        this.comboText.setFill('#ffff00'); // 黄色（通常コンボ）
      }
    } else {
      this.comboText.setVisible(false);
    }
  }

  /**
   * 武器表示を更新
   * @param {Object} data - {name: string, durability: number, max: number} | null
   */
  updateWeapon(data) {
    this.currentWeapon = data;
    
    if (data) {
      this.weaponNameText.setText(data.name);
      
      // 耐久度バーの幅を計算
      const durabilityRatio = data.durability / data.max;
      const barWidth = 150 * durabilityRatio;
      this.weaponDurabilityBar.setSize(barWidth, 10);
      
      // 耐久度に応じて色を変更
      if (durabilityRatio > 0.6) {
        this.weaponDurabilityBar.setFillStyle(0x00ff00); // 緑
      } else if (durabilityRatio > 0.3) {
        this.weaponDurabilityBar.setFillStyle(0xffaa00); // オレンジ
      } else {
        this.weaponDurabilityBar.setFillStyle(0xff0000); // 赤
      }
      
      this.weaponContainer.setVisible(true);
    } else {
      this.weaponContainer.setVisible(false);
    }
  }

  /**
   * ボスHP表示を更新
   * @param {Object} data - {current: number, max: number}
   */
  updateBossHp(data) {
    if (!this.bossVisible) return;
    
    const hpRatio = data.current / data.max;
    const barWidth = 400 * hpRatio;
    this.bossHpBar.setSize(barWidth, 20);
    
    // HP割合に応じて色を変更
    if (hpRatio > 0.6) {
      this.bossHpBar.setFillStyle(0xff0000); // 赤
    } else if (hpRatio > 0.3) {
      this.bossHpBar.setFillStyle(0xff6600); // オレンジ
    } else {
      this.bossHpBar.setFillStyle(0xff9900); // 黄色（瀕死）
    }
  }

  /**
   * ボスHP表示を表示
   */
  showBossHp() {
    this.bossVisible = true;
    this.bossHpContainer.setVisible(true);
    
    // 登場演出（フェードイン）
    this.bossHpContainer.setAlpha(0);
    this.tweens.add({
      targets: this.bossHpContainer,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
  }

  /**
   * ボスHP表示を非表示
   */
  hideBossHp() {
    this.bossVisible = false;
    
    // 退場演出（フェードアウト）
    this.tweens.add({
      targets: this.bossHpContainer,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.bossHpContainer.setVisible(false);
      }
    });
  }

  /**
   * 毎フレーム更新（必要に応じて）
   */
  update(time, delta) {
    // 現在は特に処理なし
    // 将来的にアニメーション更新などがあればここに実装
  }

  /**
   * シーン破棄時のクリーンアップ
   */
  destroy() {
    // イベントリスナーの削除
    if (this.gameScene && this.gameScene.events) {
      this.gameScene.events.off('playerHpChange', this.updatePlayerHp, this);
      this.gameScene.events.off('scoreUpdate', this.updateScore, this);
      this.gameScene.events.off('comboUpdate', this.updateCombo, this);
      this.gameScene.events.off('weaponChange', this.updateWeapon, this);
      this.gameScene.events.off('bossHpChange', this.updateBossHp, this);
      this.gameScene.events.off('bossAppear', this.showBossHp, this);
      this.gameScene.events.off('bossDefeated', this.hideBossHp, this);
    }
    
    super.destroy();
  }
}