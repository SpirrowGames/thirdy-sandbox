import { GameScene } from '../../src/scenes/GameScene.js';
import { UIScene } from '../../src/scenes/UIScene.js';
import { Player } from '../../src/entities/Player.js';
import { Enemy } from '../../src/entities/Enemy.js';
import { Boss } from '../../src/entities/Boss.js';
import { SpawnSystem } from '../../src/systems/SpawnSystem.js';
import { STAGE1 } from '../../data/stage1.js';

describe('統合テスト - ゲーム全体フロー', () => {
  let game;
  let gameScene;
  let uiScene;

  beforeEach(() => {
    // Phaserモックセットアップ
    global.Phaser = {
      Scene: class Scene {
        constructor() {
          this.events = {
            emit: jest.fn(),
            on: jest.fn()
          };
          this.physics = {
            add: {
              group: jest.fn(() => ({ runChildUpdate: true })),
              overlap: jest.fn(),
              image: jest.fn(() => ({ setSize: jest.fn(), setVisible: jest.fn(), destroy: jest.fn() }))
            },
            world: { pause: jest.fn(), resume: jest.fn() }
          };
          this.cameras = {
            main: {
              setBounds: jest.fn(),
              startFollow: jest.fn(),
              stopFollow: jest.fn(),
              scrollX: 0
            }
          };
          this.time = {
            delayedCall: jest.fn()
          };
        }
      },
      Math: {
        Between: jest.fn(() => 400),
        Angle: {
          Between: jest.fn(() => 0),
          Wrap: jest.fn(() => 0)
        }
      }
    };

    gameScene = new GameScene();
    uiScene = new UIScene();
  });

  afterEach(() => {
    if (game) {
      game.destroy();
    }
  });

  describe('ゲーム開始から終了までの基本フロー', () => {
    test('ステージ開始 → ウェーブ1 → ウェーブ2 → ボス → クリア', async () => {
      // ゲーム初期化
      gameScene.create();
      
      expect(gameScene.player).toBeDefined();
      expect(gameScene.spawnSystem).toBeDefined();
      expect(gameScene.scrollLocked).toBe(false);

      // ウェーブ1トリガー（X=500）
      gameScene.cameras.main.scrollX = 500;
      gameScene.spawnSystem.update(500);

      expect(gameScene.scrollLocked).toBe(true);
      expect(gameScene.enemies.children.size).toBe(3);

      // ウェーブ1全滅
      gameScene.enemies.children.entries.forEach(enemy => {
        enemy.takeDamage(100);
      });
      gameScene.spawnSystem.onEnemyDead();

      expect(gameScene.scrollLocked).toBe(false);

      // ボス戦トリガー（X=2000）
      gameScene.cameras.main.scrollX = 2000;
      gameScene.spawnSystem.update(2000);

      expect(gameScene.boss).toBeDefined();
      expect(gameScene.boss.phase).toBe(1);

      // ボス撃破
      gameScene.boss.takeDamage(200);
      
      expect(gameScene.events.emit).toHaveBeenCalledWith('stageClear');
    });
  });

  describe('プレイヤー戦闘システム統合', () => {
    test('基本コンボ → 武器拾得 → 特殊技使用', () => {
      gameScene.create();
      const player = gameScene.player;

      // 基本3段コンボ
      player.performAttack('punch1');
      expect(player.comboCount).toBe(1);

      player.performAttack('punch2');
      expect(player.comboCount).toBe(2);

      player.performAttack('punch3');
      expect(player.comboCount).toBe(3);

      // 武器拾得
      const weapon = gameScene.spawnWeapon('steam_pipe', 100, 400);
      player.pickupWeapon(weapon);

      expect(player.heldWeapon).toBeDefined();
      expect(player.heldWeapon.type).toBe('steam_pipe');

      // 武器特殊技使用
      player.useWeaponSpecial();
      expect(player.heldWeapon.durability).toBeLessThan(4);
    });

    test('コマンド入力 → 必殺技発動', () => {
      gameScene.create();
      const player = gameScene.player;
      const commandBuffer = player.commandBuffer;

      // →→Z コマンド入力
      commandBuffer.push('RIGHT');
      commandBuffer.push('RIGHT');
      const command = commandBuffer.push('Z');

      expect(command).toBe('steamBlow');
      expect(player.state).toBe('special');
    });
  });

  describe('敵AI・ボス戦システム統合', () => {
    test('雑魚敵AI → プレイヤー追跡 → 攻撃', () => {
      gameScene.create();
      const enemy = new Enemy(gameScene, 200, 400);
      const player = gameScene.player;

      enemy.state = 'walk';
      enemy.update(player, 16);

      // プレイヤーに向かって移動
      expect(enemy.x).toBeCloseTo(player.x, 10);

      // 攻撃範囲内での攻撃判定
      enemy.x = player.x + 50; // 攻撃範囲内
      enemy.update(player, 16);
      
      expect(enemy.state).toBe('attack');
    });

    test('ボス2フェーズ移行 → 新しい攻撃パターン', () => {
      gameScene.create();
      const boss = new Boss(gameScene, 300, 400);

      expect(boss.phase).toBe(1);
      expect(boss.hp).toBe(200);

      // フェーズ2移行（HP半分）
      boss.takeDamage(100);
      
      expect(boss.phase).toBe(2);
      expect(boss.canUseSteamBlast).toBe(true);
    });
  });

  describe('UI更新・状態同期', () => {
    test('GameScene状態変化 → UIScene表示更新', () => {
      gameScene.create();
      uiScene.create();

      const player = gameScene.player;

      // HP変化
      player.takeDamage(20);
      expect(gameScene.events.emit).toHaveBeenCalledWith('playerHpChange', {
        current: 80,
        max: 100
      });

      // コンボ変化
      player.comboCount = 5;
      expect(gameScene.events.emit).toHaveBeenCalledWith('comboUpdate', {
        count: 5
      });

      // スコア変化
      gameScene.score = 1500;
      expect(gameScene.events.emit).toHaveBeenCalledWith('scoreUpdate', {
        score: 1500
      });
    });
  });

  describe('スポーンシステム統合', () => {
    test('X座標トリガー → ウェーブ出現 → スクロールロック → 全滅 → アンロック', () => {
      gameScene.create();
      const spawnSystem = gameScene.spawnSystem;

      // 初期状態
      expect(spawnSystem.locked).toBe(false);
      expect(spawnSystem.events.length).toBe(3);

      // 第1ウェーブトリガー
      spawnSystem.update(500);
      
      expect(spawnSystem.locked).toBe(true);
      expect(gameScene.scrollLocked).toBe(true);
      expect(spawnSystem.active.remaining).toBe(3);

      // 敵を1体ずつ撃破
      spawnSystem.onEnemyDead();
      expect(spawnSystem.active.remaining).toBe(2);

      spawnSystem.onEnemyDead();
      expect(spawnSystem.active.remaining).toBe(1);

      spawnSystem.onEnemyDead();
      expect(spawnSystem.active).toBe(null);
      expect(spawnSystem.locked).toBe(false);
      expect(gameScene.scrollLocked).toBe(false);
    });
  });

  describe('衝突判定システム統合', () => {
    test('プレイヤー攻撃 → 敵ヒット → ダメージ・ノックバック', () => {
      gameScene.create();
      const player = gameScene.player;
      const enemy = new Enemy(gameScene, player.x + 30, player.groundY);

      // 攻撃実行
      player.performAttack('punch1');
      
      // 衝突判定シミュレーション
      gameScene.handleHit(player, enemy);

      expect(enemy.hp).toBeLessThan(30);
      expect(enemy.state).toBe('hurt');
    });

    test('奥行き判定 → 同じY座標のみヒット', () => {
      gameScene.create();
      const player = gameScene.player;
      player.groundY = 400;

      const nearEnemy = new Enemy(gameScene, player.x + 30, 410); // 10px差
      const farEnemy = new Enemy(gameScene, player.x + 30, 500);  // 100px差

      const isNearAligned = gameScene.isDepthAligned(player, nearEnemy);
      const isFarAligned = gameScene.isDepthAligned(player, farEnemy);

      expect(isNearAligned).toBe(true);  // 40px閾値内
      expect(isFarAligned).toBe(false);  // 40px閾値外
    });
  });

  describe('パフォーマンス・メモリ管理', () => {
    test('エンティティ破棄 → メモリリーク防止', () => {
      gameScene.create();
      
      const initialEnemyCount = gameScene.enemies.children.size;
      
      // 敵を生成・破棄
      const enemy = new Enemy(gameScene, 100, 400);
      gameScene.enemies.add(enemy);
      
      expect(gameScene.enemies.children.size).toBe(initialEnemyCount + 1);
      
      enemy.destroy();
      
      expect(gameScene.enemies.children.size).toBe(initialEnemyCount);
    });

    test('攻撃ヒットボックス → 一時生成・自動破棄', () => {
      gameScene.create();
      const player = gameScene.player;

      const hitboxCreateSpy = jest.spyOn(gameScene.physics.add, 'image');
      
      player.performAttack('punch1');
      
      expect(hitboxCreateSpy).toHaveBeenCalled();
      expect(gameScene.time.delayedCall).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Function)
      );
    });
  });

  describe('バランス調整検証', () => {
    test('武器耐久度 → 適切な使用回数', () => {
      gameScene.create();
      const player = gameScene.player;
      
      const weapon = gameScene.spawnWeapon('steam_pipe', 100, 400);
      player.pickupWeapon(weapon);

      // 通常攻撃4回で破壊
      for (let i = 0; i < 4; i++) {
        const destroyed = weapon.use();
        if (i < 3) {
          expect(destroyed).toBe(false);
        } else {
          expect(destroyed).toBe(true);
        }
      }
    });

    test('ボス戦バランス → 適切な難易度', () => {
      gameScene.create();
      const boss = new Boss(gameScene, 300, 400);
      const player = gameScene.player;

      // フェーズ1: 近接攻撃のみ
      expect(boss.canUseSteamBlast).toBe(false);
      
      // フェーズ2移行
      boss.takeDamage(100);
      expect(boss.canUseSteamBlast).toBe(true);
      
      // 弱点武器による追加ダメージ
      const weaknessWeapon = gameScene.spawnWeapon('gear_star', 100, 400);
      player.pickupWeapon(weaknessWeapon);
      
      const normalDamage = 20;
      const weaknessDamage = boss.calculateDamage(normalDamage, 'gear_star');
      
      expect(weaknessDamage).toBe(30); // 1.5倍
    });
  });

  describe('エラーハンドリング・エッジケース', () => {
    test('無効な武器タイプ → エラー処理', () => {
      gameScene.create();
      
      expect(() => {
        gameScene.spawnWeapon('invalid_weapon', 100, 400);
      }).toThrow('Unknown weapon type: invalid_weapon');
    });

    test('画面外エンティティ → 自動クリーンアップ', () => {
      gameScene.create();
      
      const enemy = new Enemy(gameScene, -1000, 400); // 画面外
      gameScene.enemies.add(enemy);
      
      gameScene.update(0, 16);
      
      expect(enemy.active).toBe(false); // 非アクティブ化
    });

    test('同時ヒット → 重複ダメージ防止', () => {
      gameScene.create();
      const player = gameScene.player;
      const enemy = new Enemy(gameScene, player.x + 30, player.groundY);
      
      const originalHp = enemy.hp;
      
      // 同フレームで複数回ヒット試行
      gameScene.handleHit(player, enemy);
      gameScene.handleHit(player, enemy);
      
      // 無敵フレーム中は1回のみダメージ
      expect(enemy.hp).toBe(originalHp - player.attackDamage);
    });
  });
});