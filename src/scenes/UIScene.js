import { CONSTANTS } from '../constants.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    console.log('UIScene: UI初期化開始');
    
    // UI要素作成
    this.createHUD();
    
    // GameSceneからのイベント監視設定
    this.setupEventListeners();
    
    console.log('UIScene: UI初期化完了');
  }

  createHUD() {
    // プレイヤーHP表示
    this.hpText = this.add.text(20, 20, 'HP: 100/100', {
      fontSize: '18px',
      fill: '#ff6666',
      fontWeight: 'bold'
    });

    // スコア表示
    this.scoreText = this.add.text(20, 50, 'SCORE: 00000', {
      fontSize: '16px',
      fill: '#ffff66'
    });

    // コンボ表示
    this.comboText = this.add.text(20, 80, 'COMBO: 0x', {
      fontSize: '16px',
      fill: '#66ff66'
    });

    // 武器情報表示（初期は非表示）
    this.weaponText = this.add.text(20, CONSTANTS.GAME_HEIGHT - 60, '', {
      fontSize: '14px',
      fill: '#66ccff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    });
    this.weaponText.setVisible(false);

    // ボスHP表示（初期は非表示）
    this.bossHpContainer = this.add.container(CONSTANTS.GAME_WIDTH / 2, CONSTANTS.GAME_HEIGHT - 40);
    this.bossHpBg = this.add.rectangle(0, 0, 400, 20, 0x333333);
    this.bossHpBar = this.add.rectangle(-200, 0, 400, 16, 0xff3333);
    this.bossHpText = this.add.text(0, -30, 'BOSS', {
      fontSize: '14px',
      fill: '#ffffff',
      align: 'center'
    });
    
    this.bossHpContainer.add([this.bossHpBg, this.bossHpBar, this.bossHpText]);
    this.bossHpContainer.setVisible(false);
  }

  setupEventListeners() {
    const gameScene = this.scene.get('GameScene');
    
    // プレイヤーHP変更
    gameScene.events.on('playerHpChange', ({ current, max }) => {
      this.updatePlayerHp(current, max);
    });

    // スコア更新
    gameScene.events.on('scoreUpdate', ({ score }) => {
      this.updateScore(score);
    });

    // コンボ更新
    gameScene.events.on('comboUpdate', ({ count }) => {
      this.updateCombo(count);
    });

    // 武器変更
    gameScene.events.on('weaponChange', (weaponData) => {
      this.updateWeapon(weaponData);
    });

    // ボスHP変更
    gameScene.events.on('bossHpChange', ({ current, max }) => {
      this.updateBossHp(current, max);
    });

    // ボス戦開始
    gameScene.events.on('bossStart', () => {
      this.bossHpContainer.setVisible(true);
    });

    // ボス戦終了
    gameScene.events.on('bossEnd', () => {
      this.bossHpContainer.setVisible(false);
    });
  }

  updatePlayerHp(current, max) {
    const hearts = Math.ceil(current / 20); // 20HPで1ハート
    const maxHearts = Math.ceil(max / 20);
    const heartDisplay = '♥'.repeat(hearts) + '♡'.repeat(maxHearts - hearts);
    this.hpText.setText(`${heartDisplay} ${current}/${max}`);
  }

  updateScore(score) {
    this.scoreText.setText(`SCORE: ${score.toString().padStart(5, '0')}`);
  }

  updateCombo(count) {
    if (count > 0) {
      this.comboText.setText(`COMBO: ${count}x`);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }
  }

  updateWeapon(weaponData) {
    if (weaponData) {
      const durabilityBar = '█'.repeat(weaponData.durability) + '░'.repeat(weaponData.max - weaponData.durability);
      this.weaponText.setText(`武器: ${weaponData.name} [${durabilityBar}] ${weaponData.durability}/${weaponData.max}`);
      this.weaponText.setVisible(true);
    } else {
      this.weaponText.setVisible(false);
    }
  }

  updateBossHp(current, max) {
    const ratio = current / max;
    this.bossHpBar.setScale(ratio, 1);
    this.bossHpBar.x = -200 + (200 * (1 - ratio));
  }

  update() {
    // UISceneは基本的にイベント駆動で更新するため、
    // 毎フレーム更新は最小限に留める
  }
}