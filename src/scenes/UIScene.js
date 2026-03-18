export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: true });
    
    // UI状態管理
    this.playerHp = 100;
    this.playerMaxHp = 100;
    this.score = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.weaponInfo = null; // { name, durability, maxDurability }
    this.bossHp = 0;
    this.bossMaxHp = 0;
    this.bossVisible = false;
    
    // UI要素参照
    this.hpHearts = [];
    this.scoreText = null;
    this.comboText = null;
    this.weaponBar = null;
    this.weaponText = null;
    this.bossHpBar = null;
    this.bossHpText = null;
  }

  create() {
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
    const heartSpacing = 32;
    
    // ハート形状を描画するためのグラフィックス
    for (let i = 0; i < 5; i++) {
      const heart = this.add.graphics();
      heart.x = startX + (i * heartSpacing);
      heart.y = startY;
      
      this.drawHeart(heart, true); // 満タンで初期化
      this.hpHearts.push(heart);
    }
  }

  drawHeart(graphics, filled) {
    graphics.clear();
    
    if (filled) {
      graphics.fillStyle(0xff3333);
    } else {
      graphics.lineStyle(2, 0x666666);
    }
    
    // ハート形状の描画（簡略化）
    const size = 12;
    if (filled) {
      graphics.fillRoundedRect(-size/2, -size/2, size, size, 2);
    } else {
      graphics.strokeRoundedRect(-size/2, -size/2, size, size, 2);
    }
  }

  createScoreDisplay() {
    this.scoreText = this.add.text(200, 20, 'SCORE: 00000', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
  }

  createComboDisplay() {
    this.comboText = this.add.text(400, 20, 'COMBO: 0x', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.comboText.setVisible(false); // 初期は非表示
  }

  createWeaponDisplay() {
    const weaponY = 480;
    
    // 武器名テキスト
    this.weaponText = this.add.text(20, weaponY, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // 武器耐久度バー背景
    this.weaponBarBg = this.add.graphics();
    this.weaponBarBg.fillStyle(0x333333);
    this.weaponBarBg.fillRect(20, weaponY + 25, 200, 12);
    
    // 武器耐久度バー
    this.weaponBar = this.add.graphics();
    
    // 初期は非表示
    this.weaponText.setVisible(false);
    this.weaponBarBg.setVisible(false);
    this.weaponBar.setVisible(false);
  }

  createBossHpDisplay() {
    const bossHpY = 450;
    
    // ボスHP背景バー
    this.bossHpBarBg = this.add.graphics();
    this.bossHpBarBg.fillStyle(0x333333);
    this.bossHpBarBg.fillRect(200, bossHpY, 560, 20);
    
    // ボスHPバー
    this.bossHpBar = this.add.graphics();
    
    // ボスHP テキスト
    this.bossHpText = this.add.text(770, bossHpY + 2, 'BOSS HP', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // 初期は非表示
    this.bossHpBarBg.setVisible(false);
    this.bossHpBar.setVisible(false);
    this.bossHpText.setVisible(false);
  }

  setupEventListeners() {
    const gameScene = this.scene.get('GameScene');
    
    if (gameScene) {
      gameScene.events.on('playerHpChange', this.updatePlayerHp, this);
      gameScene.events.on('scoreUpdate', this.updateScore, this);
      gameScene.events.on('comboUpdate', this.updateCombo, this);
      gameScene.events.on('weaponChange', this.updateWeapon, this);
      gameScene.events.on('bossHpChange', this.updateBossHp, this);
      gameScene.events.on('bossAppear', this.showBossHp, this);
      gameScene.events.on('bossDefeat', this.hideBossHp, this);
    }
  }

  updatePlayerHp(data) {
    const { current, max } = data;
    this.playerHp = current;
    this.playerMaxHp = max;
    
    const hpPerHeart = max / 5;
    
    this.hpHearts.forEach((heart, index) => {
      const heartMinHp = index * hpPerHeart;
      const heartMaxHp = (index + 1) * hpPerHeart;
      
      if (current > heartMaxHp) {
        // フルハート
        this.drawHeart(heart, true);
      } else if (current > heartMinHp) {
        // 部分的なハート（簡略化で半分表示）
        this.drawHalfHeart(heart);
      } else {
        // 空のハート
        this.drawHeart(heart, false);
      }
    });
  }

  drawHalfHeart(graphics) {
    graphics.clear();
    const size = 12;
    
    // 左半分を塗りつぶし
    graphics.fillStyle(0xff3333);
    graphics.fillRoundedRect(-size/2, -size/2, size/2, size, 2);
    
    // 右半分は枠線のみ
    graphics.lineStyle(2, 0x666666);
    graphics.strokeRoundedRect(0, -size/2, size/2, size, 2);
  }

  updateScore(data) {
    this.score = data.score;
    this.scoreText.setText(`SCORE: ${this.score.toString().padStart(5, '0')}`);
    
    // スコア増加アニメーション
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  updateCombo(data) {
    this.comboCount = data.count;
    this.comboMultiplier = data.multiplier || 1;
    
    if (this.comboCount > 0) {
      this.comboText.setVisible(true);
      this.comboText.setText(`COMBO: ${this.comboCount}x`);
      
      // コンボ数に応じて色を変更
      let color = '#ffffff';
      if (this.comboCount >= 10) {
        color = '#ffff00'; // 黄色
      } else if (this.comboCount >= 5) {
        color = '#ff8800'; // オレンジ
      }
      
      this.comboText.setFill(color);
      
      // コンボ増加アニメーション
      this.tweens.add({
        targets: this.comboText,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    } else {
      this.comboText.setVisible(false);
    }
  }

  updateWeapon(data) {
    this.weaponInfo = data;
    
    if (data && data.name) {
      this.weaponText.setVisible(true);
      this.weaponBarBg.setVisible(true);
      this.weaponBar.setVisible(true);
      
      this.weaponText.setText(`武器: ${data.name}`);
      this.updateWeaponBar(data.durability, data.maxDurability);
    } else {
      this.weaponText.setVisible(false);
      this.weaponBarBg.setVisible(false);
      this.weaponBar.setVisible(false);
    }
  }

  updateWeaponBar(current, max) {
    this.weaponBar.clear();
    
    const barWidth = 200;
    const barHeight = 12;
    const fillWidth = (current / max) * barWidth;
    
    // 耐久度に応じて色を変更
    let color = 0x00ff00; // 緑
    if (current <= max * 0.3) {
      color = 0xff0000; // 赤
    } else if (current <= max * 0.6) {
      color = 0xffff00; // 黄色
    }
    
    this.weaponBar.fillStyle(color);
    this.weaponBar.fillRect(20, 505, fillWidth, barHeight);
    
    // 数値表示
    const durabilityText = `${current}/${max}`;
    if (this.weaponDurabilityText) {
      this.weaponDurabilityText.destroy();
    }
    
    this.weaponDurabilityText = this.add.text(230, 502, durabilityText, {
      fontSize: '14px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    });
  }

  updateBossHp(data) {
    if (!this.bossVisible) return;
    
    const { current, max } = data;
    this.bossHp = current;
    this.bossMaxHp = max;
    
    this.bossHpBar.clear();
    
    const barWidth = 560;
    const barHeight = 20;
    const fillWidth = (current / max) * barWidth;
    
    // HPに応じて色を変更
    let color = 0xff0000; // 赤
    if (current > max * 0.5) {
      color = 0xff8800; // オレンジ
    }
    
    this.bossHpBar.fillStyle(color);
    this.bossHpBar.fillRect(200, 450, fillWidth, barHeight);
    
    // ボスHP減少時のシェイクエフェクト
    if (current < this.bossMaxHp) {
      this.cameras.main.shake(100, 0.01);
    }
  }

  showBossHp() {
    this.bossVisible = true;
    this.bossHpBarBg.setVisible(true);
    this.bossHpBar.setVisible(true);
    this.bossHpText.setVisible(true);
    
    // ボスHP表示時のアニメーション
    this.bossHpBarBg.setAlpha(0);
    this.bossHpBar.setAlpha(0);
    this.bossHpText.setAlpha(0);
    
    this.tweens.add({
      targets: [this.bossHpBarBg, this.bossHpBar, this.bossHpText],
      alpha: 1,
      duration: 500,
      ease: 'Power2.easeOut'
    });
  }

  hideBossHp() {
    this.tweens.add({
      targets: [this.bossHpBarBg, this.bossHpBar, this.bossHpText],
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.bossVisible = false;
        this.bossHpBarBg.setVisible(false);
        this.bossHpBar.setVisible(false);
        this.bossHpText.setVisible(false);
      }
    });
  }

  // デバッグ用メソッド
  debugUpdate(debugData) {
    if (!debugData) return;
    
    // デバッグ情報の表示（開発時のみ）
    if (!this.debugText) {
      this.debugText = this.add.text(10, 100, '', {
        fontSize: '12px',
        fontFamily: 'monospace',
        fill: '#00ff00',
        backgroundColor: '#000000'
      });
    }
    
    const debugInfo = [
      `Player: ${debugData.playerX?.toFixed(0) || 0}, ${debugData.playerY?.toFixed(0) || 0}`,
      `Enemies: ${debugData.enemyCount || 0}`,
      `Camera: ${debugData.cameraX?.toFixed(0) || 0}`,
      `Locked: ${debugData.scrollLocked ? 'YES' : 'NO'}`
    ].join('\n');
    
    this.debugText.setText(debugInfo);
  }

  destroy() {
    // イベントリスナーの清理
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.off('playerHpChange', this.updatePlayerHp, this);
      gameScene.events.off('scoreUpdate', this.updateScore, this);
      gameScene.events.off('comboUpdate', this.updateCombo, this);
      gameScene.events.off('weaponChange', this.updateWeapon, this);
      gameScene.events.off('bossHpChange', this.updateBossHp, this);
      gameScene.events.off('bossAppear', this.showBossHp, this);
      gameScene.events.off('bossDefeat', this.hideBossHp, this);
    }
    
    super.destroy();
  }
}