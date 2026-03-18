import { Player } from '../entities/Player.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { STAGE1 } from '../data/stage1.js';
import { GAME_CONFIG } from '../main.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('🎯 GameScene 初期化開始');
        
        this.initializeWorld();
        this.createPlayer();
        this.createEnemyGroups();
        this.createWeaponGroup();
        this.setupCollisions();
        this.setupCamera();
        this.setupSpawnSystem();
        
        console.log('✅ GameScene 初期化完了');
    }

    initializeWorld() {
        // 背景色（スチームパンク風）
        this.cameras.main.setBackgroundColor('#2c3e50');
        
        // 地面表示（開発用ライン）
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x34495e);
        graphics.moveTo(0, GAME_CONFIG.GROUND_Y_MIN);
        graphics.lineTo(STAGE1.width, GAME_CONFIG.GROUND_Y_MIN);
        graphics.moveTo(0, GAME_CONFIG.GROUND_Y_MAX);
        graphics.lineTo(STAGE1.width, GAME_CONFIG.GROUND_Y_MAX);
        graphics.stroke();
        
        // ステージ境界表示
        graphics.lineStyle(1, 0x7f8c8d);
        graphics.strokeRect(0, 0, STAGE1.width, GAME_CONFIG.GAME_HEIGHT);
        
        this.scrollLocked = false;
    }

    createPlayer() {
        this.player = new Player(this, 100, 440);
        this.add.existing(this.player.sprite);
        this.physics.add.existing(this.player.sprite);
    }

    createEnemyGroups() {
        // 敵グループ（物理オブジェクト管理）
        this.enemies = this.physics.add.group({
            runChildUpdate: true
        });
        
        // ボス用（単体管理）
        this.boss = null;
    }

    createWeaponGroup() {
        // 武器グループ
        this.weapons = this.physics.add.group();
        
        // 初期武器配置
        STAGE1.weaponPlacements.forEach(placement => {
            this.spawnWeapon(placement.type, placement.x, placement.groundY);
        });
    }

    setupCollisions() {
        // プレイヤーと武器の衝突（拾う）
        this.physics.add.overlap(this.player.sprite, this.weapons, 
            (player, weapon) => {
                this.player.pickupWeapon(weapon.weaponData);
                weapon.destroy();
            }
        );
    }

    setupCamera() {
        // カメラ境界設定
        this.cameras.main.setBounds(0, 0, STAGE1.width, GAME_CONFIG.GAME_HEIGHT);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
        
        // Y軸は固定（横スクロールのみ）
        this.cameras.main.setFollowOffset(0, 0);
    }

    setupSpawnSystem() {
        this.spawnSystem = new SpawnSystem(this, STAGE1.spawnEvents);
    }

    update(time, delta) {
        // プレイヤー更新
        this.player.update(time, delta);
        
        // スポーンシステム更新
        if (!this.scrollLocked) {
            this.spawnSystem.update(this.cameras.main.scrollX);
        }
    }

    // ===== スポーン関連メソッド =====

    spawnEnemy(type, x, groundY) {
        console.log(`👹 敵スポーン: ${type} at (${x}, ${groundY})`);
        
        if (type === 'boss') {
            // ボス生成（後で実装）
            console.log('🔥 ボス出現！');
            return null;
        } else {
            // 雑魚敵生成（後で実装）
            const enemy = this.createGrunt(x, groundY);
            this.enemies.add(enemy);
            return enemy;
        }
    }

    createGrunt(x, groundY) {
        // 暫定的な敵スプライト作成
        const sprite = this.physics.add.sprite(x, groundY, 'enemy_rect');
        sprite.setOrigin(0.5, 1); // 足元基準
        
        // 簡易AI（後で Enemy クラスに移行）
        sprite.hp = 30;
        sprite.groundY = groundY;
        sprite.update = function() {
            // プレイヤーに向かって移動（暫定）
            if (this.scene && this.scene.player) {
                const dx = this.scene.player.sprite.x - this.x;
                if (Math.abs(dx) > 60) {
                    this.setVelocityX(dx > 0 ? 50 : -50);
                } else {
                    this.setVelocityX(0);
                }
            }
        };
        
        return sprite;
    }

    spawnWeapon(type, x, groundY) {
        const sprite = this.physics.add.sprite(x, groundY, 'weapon_rect');
        sprite.setOrigin(0.5, 1);
        sprite.weaponData = { type, name: `武器:${type}` };
        this.weapons.add(sprite);
    }

    // ===== スクロール制御 =====

    lockScroll() {
        this.scrollLocked = true;
        this.cameras.main.stopFollow();
        console.log('🔒 スクロールロック');
    }

    unlockScroll() {
        this.scrollLocked = false;
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0);
        console.log('🔓 スクロールアンロック');
    }

    // ===== イベント通知 =====

    onWaveClear() {
        this.unlockScroll();
        console.log('✨ ウェーブクリア');
    }

    onStageClear() {
        console.log('🎉 ステージクリア！');
        // 後でクリア画面に遷移
    }
}