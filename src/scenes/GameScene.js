import { CONSTANTS } from '../constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.scrollLocked = false;
  }

  create() {
    console.log('GameScene: 初期化開始');
    
    // 背景色設定（スチームパンク路地裏をイメージした暗めの色）
    this.cameras.main.setBackgroundColor('#2d2d3d');
    
    // カメラ設定（ステージ全幅に対応）
    this.cameras.main.setBounds(0, 0, CONSTANTS.STAGE_WIDTH, CONSTANTS.GAME_HEIGHT);
    
    // 物理グループ作成
    this.createPhysicsGroups();
    
    // プレイヤー作成（開発初期は矩形ボックス）
    this.createPlayer();
    
    // カメラをプレイヤーに追従設定
    this.cameras.main.startFollow(
      this.player, 
      true, 
      CONSTANTS.CAMERA.FOLLOW_LERP_X, 
      CONSTANTS.CAMERA.FOLLOW_LERP_Y
    );
    
    // デバッグ情報表示
    this.createDebugInfo();
    
    console.log('GameScene: 初期化完了');
  }

  createPhysicsGroups() {
    // 各種エンティティグループ
    this.players = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.weapons = this.physics.add.group();
    this.hitboxes = this.physics.add.group();
  }

  createPlayer() {
    // 開発初期は青い矩形でプレイヤーを表現
    this.player = this.physics.add.rectangle(
      100, 
      CONSTANTS.GROUND_Y_MAX - 32, 
      48, 
      64, 
      0x3399ff
    );
    
    this.player.setCollideWorldBounds(true);
    this.players.add(this.player);
    
    // プレイヤー固有プロパティ
    this.player.hp = 100;
    this.player.maxHp = 100;
    this.player.speed = 200;
    this.player.groundY = CONSTANTS.GROUND_Y_MAX - 32;
    this.player.facingRight = true;
  }

  createDebugInfo() {
    // デバッグ用テキスト表示
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    });
    this.debugText.setScrollFactor(0); // カメラ追従しない固定表示
  }

  update(time, delta) {
    // デバッグ情報更新
    this.updateDebugInfo();
  }

  updateDebugInfo() {
    const cameraX = Math.round(this.cameras.main.scrollX);
    const playerX = Math.round(this.player.x);
    const playerY = Math.round(this.player.y);
    
    this.debugText.setText([
      `Camera X: ${cameraX}`,
      `Player: (${playerX}, ${playerY})`,
      `Scroll Locked: ${this.scrollLocked}`,
      `Enemies: ${this.enemies.children.size}`,
      `FPS: ${Math.round(this.game.loop.actualFps)}`
    ]);
  }

  lockScroll() {
    this.scrollLocked = true;
    this.cameras.main.stopFollow();
    console.log('GameScene: スクロールロック');
  }

  unlockScroll() {
    this.scrollLocked = false;
    this.cameras.main.startFollow(
      this.player, 
      true, 
      CONSTANTS.CAMERA.FOLLOW_LERP_X, 
      CONSTANTS.CAMERA.FOLLOW_LERP_Y
    );
    console.log('GameScene: スクロールアンロック');
  }

  onWaveClear() {
    console.log('GameScene: ウェーブクリア');
    this.unlockScroll();
  }

  onStageClear() {
    console.log('GameScene: ステージクリア');
    // 将来的にクリア画面表示やスコア計算を実装
  }
}