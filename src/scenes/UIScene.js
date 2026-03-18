export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: true });
    
    // UI要素の参照を保持
    this.hpBar = null;
    this.hpBarFill = null;
    this.scoreText = null;
    this.comboText = null;
    this.weaponInfo = null;
    this.bossHpBar = null;
    this.bossHpBarFill = null;
    
    // 前回の状態を保持（変更検出用）
    this.lastPlayerHp = -1;
    this.lastScore = -1;
    this.lastCombo = -1;
    this.lastWeapon = null;
    this.lastBossHp = -1;
    this.bossHpVisible = false;
  }

  create() {
    // 上部HUD - プレイヤーHP
    this.createPlayerHpBar();
    
    // 上部HUD - スコア
    this.scoreText = this.add.text(300, 20, 'SCORE: 00000', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    });

    // 上部HUD - コンボ
    this.comboText = this.add.text(600, 20, 'COMBO: 0x', {
      fontSize: '24px',
      fill: '#ffff00',
      fontFamily: 'monospace'
    });

    // 下部 - 武器情報（初期は非表示）
    this.createWeaponInfo();
    
    // 下部 - ボスHP（初期は非表示）
    this.createBossHpBar();

    // GameSceneからのイベントリスナー設定
    this.setupEventListeners();
  }

  createPlayerHpBar() {
    // HPバー背景
    this.hpBar = this.add.rectangle(20, 30, 200, 20, 0x333333);
    this.hpBar.setOrigin(0, 0.5);
    this.hpBar.setStrokeStyle(2, 0xffffff);

    // HPバー（赤い部分）
    this.hpBarFill = this.add.rectangle(20, 30, 200, 16, 0xff0000);
    this.hpBarFill.setOrigin(0, 0.5);

    // HPハートアイコン
    this.add.text(5, 20, '♥', {
      fontSize: '20px',
      fill: '#ff0000'
    });
  }

  createWeaponInfo() {
    // 武器情報コンテナ（初期は非表示）
    this.weaponInfo = this.add.container(20, 480);
    this.weaponInfo.setVisible(false);

    // 武器名テキスト
    const weaponNameText = this.add.text(0, 0, '', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    });

    // 武器耐久度バー背景
    const weaponDurabilityBg = this.add.rectangle(0, 25, 150, 10, 0x333333);
    weaponDurabilityBg.setOrigin(0, 0.5);
    weaponDurabilityBg.setStrokeStyle(1, 0xffffff);

    // 武器耐久度バー
    const weaponDurabilityFill = this.add.rectangle(0, 25, 150, 8, 0x00ff00);
    weaponDurabilityFill.setOrigin(0, 0.5);

    // 耐久度数値テキスト
    const weaponDurabilityText = this.add.text(160, 25, '', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    });

    // コンテナに追加
    this.weaponInfo.add([
      weaponNameText,
      weaponDurabilityBg,
      weaponDurabilityFill,
      weaponDurabilityText
    ]);

    // 参照用にプロパティ設定
    this.weaponInfo.nameText = weaponNameText;
    this.weaponInfo.durabilityFill = weaponDurabilityFill;
    this.weaponInfo.durabilityText = weaponDurabilityText;
  }

  createBossHpBar() {
    // ボスHPバーコンテナ（初期は非表示）
    this.bossHpBar = this.add.container(20, 450);
    this.bossHpBar.setVisible(false);

    // ボスHPバー背景
    const bossHpBg = this.add.rectangle(0, 0, 400, 20, 0x333333);
    bossHpBg.setOrigin(0, 0.5);
    bossHpBg.setStrokeStyle(2, 0xffffff);

    // ボスHPバー（黄色）
    const bossHpFill = this.add.rectangle(0, 0, 400, 16, 0xffaa00);
    bossHpFill.setOrigin(0, 0.5);

    // ボスラベル
    const bossLabel = this.add.text(410, 0, 'BOSS HP', {
      fontSize: '16px',
      fill: '#ffaa00',
      fontFamily: 'monospace'
    });
    bossLabel.setOrigin(0, 0.5);

    // コンテナに追加
    this.bossHpBar.add([bossHpBg, bossHpFill, bossLabel]);
    
    // 参照用にプロパティ設定
    this.bossHpBarFill = bossHpFill;
  }

  setupEventListeners() {
    // GameSceneが存在する場合のみイベントリスナーを設定
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) {
      console.warn('GameScene not found. Event listeners not set up.');
      return;
    }

    // プレイヤーHP変更イベント
    gameScene.events.on('playerHpChange', ({ current, max }) => {
      this.updatePlayerHp(current, max);
    });

    // スコア更新イベント
    gameScene.events.on('scoreUpdate', ({ score }) => {
      this.updateScore(score);
    });

    // コンボ更新イベント
    gameScene.events.on('comboUpdate', ({ count }) => {
      this.updateCombo(count);
    });

    // 武器変更イベント
    gameScene.events.on('weaponChange', (weaponData) => {
      this.updateWeapon(weaponData);
    });

    // ボスHP変更イベント
    gameScene.events.on('bossHpChange', ({ current, max }) => {
      this.updateBossHp(current, max);
    });

    // ボス戦開始/終了イベント
    gameScene.events.on('bossStart', () => {
      this.showBossHp();
    });

    gameScene.events.on('bossEnd', () => {
      this.hideBossHp();
    });
  }

  update() {
    // GameSceneから直接状態を取得して更新（フォールバック）
    const gameScene = this.scene.get('GameScene');
    if (!gameScene || !gameScene.player) {
      return;
    }

    // イベントベースで更新されない場合のフォールバック
    this.updateFromGameState(gameScene);
  }

  updateFromGameState(gameScene) {
    const player = gameScene.player;
    
    // プレイヤーHP
    if (player.hp !== this.lastPlayerHp) {
      this.updatePlayerHp(player.hp, player.maxHp);
      this.lastPlayerHp = player.hp;
    }

    // スコア
    if (gameScene.score !== this.lastScore) {
      this.updateScore(gameScene.score);
      this.lastScore = gameScene.score;
    }

    // コンボ
    if (player.comboCount !== this.lastCombo) {
      this.updateCombo(player.comboCount);
      this.lastCombo = player.comboCount;
    }

    // 武器
    const currentWeapon = player.heldWeapon;
    if (currentWeapon !== this.lastWeapon) {
      if (currentWeapon) {
        this.updateWeapon({
          name: currentWeapon.name,
          durability: currentWeapon.durability,
          max: currentWeapon.maxDurability
        });
      } else {
        this.updateWeapon(null);
      }
      this.lastWeapon = currentWeapon;
    }
  }

  updatePlayerHp(current, max) {
    if (!this.hpBarFill) return;
    
    const ratio = Math.max(0, current / max);
    this.hpBarFill.setScale(ratio, 1);
    
    // HPが低い場合は点滅
    if (ratio < 0.3) {
      this.hpBarFill.setTint(0xff4444);
      // 点滅アニメーション
      this.tweens.add({
        targets: this.hpBarFill,
        alpha: 0.5,
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    } else {
      this.hpBarFill.clearTint();
      this.tweens.killTweensOf(this.hpBarFill);
      this.hpBarFill.setAlpha(1);
    }
  }

  updateScore(score) {
    if (!this.scoreText) return;
    this.scoreText.setText(`SCORE: ${score.toString().padStart(5, '0')}`);
  }

  updateCombo(count) {
    if (!this.comboText) return;
    
    if (count > 0) {
      this.comboText.setText(`COMBO: ${count}x`);
      this.comboText.setVisible(true);
      
      // 高コンボ時は色を変更
      if (count >= 10) {
        this.comboText.setFill('#ff00ff'); // マゼンタ
      } else if (count >= 5) {
        this.comboText.setFill('#ff8800'); // オレンジ
      } else {
        this.comboText.setFill('#ffff00'); // 黄色
      }
    } else {
      this.comboText.setVisible(false);
    }
  }

  updateWeapon(weaponData) {
    if (!this.weaponInfo) return;

    if (weaponData) {
      // 武器を所持している場合
      this.weaponInfo.setVisible(true);
      this.weaponInfo.nameText.setText(`[武器: ${weaponData.name}]`);
      this.weaponInfo.durabilityText.setText(`${weaponData.durability}/${weaponData.max}`);
      
      // 耐久度バーの更新
      const ratio = weaponData.durability / weaponData.max;
      this.weaponInfo.durabilityFill.setScale(ratio, 1);
      
      // 耐久度に応じて色を変更
      if (ratio > 0.6) {
        this.weaponInfo.durabilityFill.setFillStyle(0x00ff00); // 緑
      } else if (ratio > 0.3) {
        this.weaponInfo.durabilityFill.setFillStyle(0xffaa00); // 黄
      } else {
        this.weaponInfo.durabilityFill.setFillStyle(0xff0000); // 赤
      }
    } else {
      // 武器を所持していない場合
      this.weaponInfo.setVisible(false);
    }
  }

  updateBossHp(current, max) {
    if (!this.bossHpBarFill) return;
    
    const ratio = Math.max(0, current / max);
    this.bossHpBarFill.setScale(ratio, 1);
    this.lastBossHp = current;
  }

  showBossHp() {
    if (!this.bossHpBar) return;
    this.bossHpBar.setVisible(true);
    this.bossHpVisible = true;
    
    // フェードイン演出
    this.bossHpBar.setAlpha(0);
    this.tweens.add({
      targets: this.bossHpBar,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
  }

  hideBossHp() {
    if (!this.bossHpBar) return;
    
    // フェードアウト演出
    this.tweens.add({
      targets: this.bossHpBar,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.bossHpBar.setVisible(false);
        this.bossHpVisible = false;
      }
    });
  }

  // デバッグ用：UI要素の強制更新
  forceUpdate(playerData, gameData) {
    if (playerData) {
      this.updatePlayerHp(playerData.hp, playerData.maxHp);
      this.updateCombo(playerData.comboCount);
      this.updateWeapon(playerData.weapon);
    }
    
    if (gameData) {
      this.updateScore(gameData.score);
      if (gameData.boss) {
        this.updateBossHp(gameData.boss.hp, gameData.boss.maxHp);
      }
    }
  }

  // クリーンアップ
  destroy() {
    // イベントリスナーのクリーンアップ
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.events) {
      gameScene.events.off('playerHpChange');
      gameScene.events.off('scoreUpdate');
      gameScene.events.off('comboUpdate');
      gameScene.events.off('weaponChange');
      gameScene.events.off('bossHpChange');
      gameScene.events.off('bossStart');
      gameScene.events.off('bossEnd');
    }
    
    super.destroy();
  }
}