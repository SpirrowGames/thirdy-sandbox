import { GAME_CONFIG } from '../main.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // ゲーム状態
        this.player = null;
        this.enemies = null;
        this.weapons = null;
        this.spawnSystem = null;
        this.scrollLocked = false;
        
        // デバッグ用
        this.debugText = null;
    }

    create() {
        console.log('GameScene: 初期化開始');
        
        this.setupWorld();
        this.setupCamera();
        this.setupInput();
        this.createGroups();
        this.createPlayer();
        this.setupDebugInfo();
        
        console.log('GameScene: 初期化完了');
        
        // UISceneにゲーム開始を通知
        this.events.emit('gameStart');
    }

    setupWorld() {
        // ワールド境界設定
        this.physics.world.setBounds(0, 0, GAME_CONFIG.STAGE_WIDTH, GAME_CONFIG.GAME_HEIGHT);
        
        // 背景（開発初期は単色）
        this.add.rectangle(
            GAME_CONFIG.STAGE_WIDTH / 2, 
            GAME_CONFIG.GAME_HEIGHT / 2, 
            GAME_CONFIG.STAGE_WIDTH, 
            GAME_CONFIG.GAME_HEIGHT, 
            0x34495e
        );
        
        // 地面表示（視覚的ガイド）
        const groundGraphics = this.add.graphics();
        groundGraphics.lineStyle(2, 0x95a5a6, 0.5);
        groundGraphics.lineBetween(0, GAME_CONFIG.GROUND_Y_MIN, GAME_CONFIG.STAGE_WIDTH, GAME_CONFIG.GROUND_Y_MIN);
        groundGraphics.lineBetween(0, GAME_CONFIG.GROUND_Y_MAX, GAME_CONFIG.STAGE_WIDTH, GAME_CONFIG.GROUND_Y_MAX);
    }

    setupCamera() {
        // カメラ設定
        this.cameras.main.setBounds(0, 0, GAME_CONFIG.STAGE_WIDTH, GAME_CONFIG.GAME_HEIGHT);
        this.cameras.main.setZoom(1);
        
        console.log('GameScene: カメラ設定完了');
    }

    setupInput() {
        // キーボード入力設定
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('Z,X');
        
        console.log('GameScene: 入力設定完了');
    }

    createGroups() {
        // エンティティグループ作成
        this.enemies = this.physics.add.group({
            runChildUpdate: true
        });
        
        this.weapons = this.physics.add.group();
        
        console.log('GameScene: エンティティグループ作成完了');
    }

    createPlayer() {
        // プレイヤー作成（開発初期は矩形）
        const startX = 100;
        const startY = 420;
        
        const playerSprite = this.physics.add.sprite(startX, startY, 'player_rect');
        playerSprite.setCollideWorldBounds(true);
        playerSprite.body.setSize(40, 56); // 当たり判定サイズ調整
        
        // プレイヤーオブジェクト（将来的にPlayer.jsクラスに移行）
        this.player = {
            sprite: playerSprite,
            hp: 100,
            maxHp: 100,
            speed: 200,
            groundY: startY,
            facingRight: true,
            state: 'idle'
        };
        
        // カメラがプレイヤーを追従
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
        
        console.log('GameScene: プレイヤー作成完了');
    }

    setupDebugInfo() {
        // デバッグ情報表示
        this.debugText = this.add.text(16, 16, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 8, y: 4 }
        });
        this.debugText.setScrollFactor(0); // カメラに固定
        this.debugText.setDepth(1000); // 最前面
    }

    update(time, delta) {
        this.updatePlayer(delta);
        this.updateDebugInfo();
        
        // 将来的にはここでSpawnSystem、敵、衝突判定などを更新
        // this.spawnSystem?.update(this.cameras.main.scrollX);
        // this.physics.overlap(playerAttacks, enemies, this.handleHit, null, this);
    }

    updatePlayer(delta) {
        if (!this.player || !this.player.sprite.active) return;
        
        const player = this.player;
        const body = player.sprite.body;
        
        // 移動処理
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.cursors.left.isDown) {
            velocityX = -player.speed;
            player.facingRight = false;
            player.state = 'walk';
        } else if (this.cursors.right.isDown) {
            velocityX = player.speed;
            player.facingRight = true;
            player.state = 'walk';
        }
        
        if (this.cursors.up.isDown) {
            velocityY = -player.speed * 0.5; // 奥行き移動は少し遅く
        } else if (this.cursors.down.isDown) {
            velocityY = player.speed * 0.5;
        }
        
        // 速度設定
        body.setVelocity(velocityX, velocityY);
        
        // 奥行き制限
        if (player.sprite.y < GAME_CONFIG.GROUND_Y_MIN) {
            player.sprite.y = GAME_CONFIG.GROUND_Y_MIN;
            body.setVelocityY(0);
        } else if (player.sprite.y > GAME_CONFIG.GROUND_Y_MAX) {
            player.sprite.y = GAME_CONFIG.GROUND_Y_MAX;
            body.setVelocityY(0);
        }
        
        // groundY更新
        player.groundY = player.sprite.y;
        
        // スプライト向き調整
        player.sprite.setFlipX(!player.facingRight);
        
        // 静止状態判定
        if (velocityX === 0 && velocityY === 0) {
            player.state = 'idle';
        }
    }

    updateDebugInfo() {
        if (!this.debugText || !this.player) return;
        
        const player = this.player;
        const camera = this.cameras.main;
        
        const debugInfo = [
            `Player: (${Math.round(player.sprite.x)}, ${Math.round(player.sprite.y)})`,
            `Ground Y: ${Math.round(player.groundY)}`,
            `State: ${player.state}`,
            `Camera X: ${Math.round(camera.scrollX)}`,
            `Facing: ${player.facingRight ? 'Right' : 'Left'}`,
            `HP: ${player.hp}/${player.maxHp}`
        ].join('\n');
        
        this.debugText.setText(debugInfo);
    }

    // スクロールロック制御（将来的にSpawnSystemから呼び出される）
    lockScroll() {
        this.scrollLocked = true;
        this.cameras.main.stopFollow();
        console.log('GameScene: スクロールロック');
    }

    unlockScroll() {
        this.scrollLocked = false;
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
        console.log('GameScene: スクロールアンロック');
    }

    // 敵生成（将来的にSpawnSystemから呼び出される）
    spawnEnemy(type, x, y) {
        console.log(`GameScene: 敵生成 ${type} at (${x}, ${y})`);
        // 将来的にはEnemyクラスのインスタンス生成
    }

    // ステージクリア処理
    onStageClear() {
        console.log('GameScene: ステージクリア');
        this.events.emit('stageClear');
    }

    // ウェーブクリア処理
    onWaveClear() {
        console.log('GameScene: ウェーブクリア');
        this.unlockScroll();
    }
}