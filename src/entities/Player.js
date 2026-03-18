import { CommandBuffer } from '../input/CommandBuffer.js';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200;
    this.groundY = y;
    this.displayY = y;
    
    // 戦闘関連
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.facingRight = true;
    
    // 状態管理
    this.state = 'idle'; // idle, walk, attack_1, attack_2, attack_3, hurt, dash
    this.stateTimer = 0;
    
    // 武器
    this.heldWeapon = null;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // コマンドバッファ
    this.commandBuffer = new CommandBuffer();
    
    // スプライト作成（開発初期は矩形）
    this.sprite = scene.add.rectangle(0, 0, 48, 64, 0x3399ff);
    this.add(this.sprite);
    
    // 物理ボディ設定
    scene.physics.add.existing(this);
    this.body.setSize(48, 64);
    this.body.setCollideWorldBounds(true);
    
    // シーンに追加
    scene.add.existing(this);
    
    // 入力設定
    this.setupInput();
  }
  
  setupInput() {
    const scene = this.scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys('Z,X');
    
    // Z キー（攻撃）の入力処理
    this.keys.Z.on('down', () => {
      this.handleAttackInput();
    });
  }
  
  handleAttackInput() {
    // コマンド入力チェック
    const command = this.commandBuffer.push('Z');
    if (command) {
      this.performSpecialAttack(command);
      return;
    }
    
    // 基本攻撃処理
    if (this.canAttack()) {
      this.performBasicAttack();
    }
  }
  
  canAttack() {
    // 攻撃中でない、かつクールダウンが終了している
    return !this.isAttacking && this.attackCooldown <= 0 && this.state !== 'hurt';
  }
  
  performBasicAttack() {
    this.isAttacking = true;
    this.state = 'attack_1';
    this.stateTimer = 0;
    this.attackCooldown = 300; // ms
    
    // 攻撃範囲とダメージの設定
    const attackData = {
      damage: this.heldWeapon ? this.heldWeapon.damage : 15,
      range: this.heldWeapon ? this.heldWeapon.range : 80,
      duration: 100, // ヒットボックス持続時間
      knockback: 150
    };
    
    // ヒットボックス生成
    this.createAttackHitbox(attackData);
    
    // 攻撃アニメーション（矩形の色変更で表現）
    this.sprite.setFillStyle(0xff6666);
    this.scene.time.delayedCall(200, () => {
      this.sprite.setFillStyle(0x3399ff);
    });
    
    // 武器耐久度消費
    if (this.heldWeapon) {
      const broken = this.heldWeapon.use();
      if (broken) {
        this.dropWeapon();
      }
    }
    
    // 攻撃状態終了
    this.scene.time.delayedCall(300, () => {
      this.isAttacking = false;
      this.state = 'idle';
    });
    
    // イベント発火
    this.scene.events.emit('playerAttack', {
      damage: attackData.damage,
      range: attackData.range,
      weaponType: this.heldWeapon?.type || 'fist'
    });
  }
  
  createAttackHitbox(attackData) {
    const scene = this.scene;
    const direction = this.facingRight ? 1 : -1;
    const hitboxX = this.x + direction * (attackData.range * 0.5);
    const hitboxY = this.groundY;
    
    // 一時的なヒットボックス作成
    const hitbox = scene.physics.add.image(hitboxX, hitboxY, '__WHITE');
    hitbox.setSize(attackData.range, 80); // 奥行き判定用の高さ
    hitbox.setVisible(false); // 開発時はtrueで確認可能
    hitbox.setAlpha(0.3);
    
    // 敵との衝突判定
    scene.physics.add.overlap(hitbox, scene.enemies, (hb, enemy) => {
      if (this.isDepthAligned(enemy)) {
        this.hitEnemy(enemy, attackData);
      }
    }, null, scene);
    
    // 指定時間後にヒットボックス破棄
    scene.time.delayedCall(attackData.duration, () => {
      if (hitbox.active) {
        hitbox.destroy();
      }
    });
  }
  
  hitEnemy(enemy, attackData) {
    // 既に倒されている敵は無視
    if (!enemy.alive || enemy.hp <= 0) return;
    
    // ダメージ処理
    const actualDamage = this.calculateDamage(attackData.damage, enemy);
    enemy.takeDamage(actualDamage, this.x);
    
    // コンボカウント増加
    this.incrementCombo();
    
    // ヒットストップ演出
    this.scene.hitStop(80);
    
    // ノックバック処理
    const knockbackDirection = this.facingRight ? 1 : -1;
    enemy.applyKnockback(knockbackDirection * attackData.knockback);
    
    // イベント発火
    this.scene.events.emit('enemyHit', {
      enemy: enemy,
      damage: actualDamage,
      combo: this.comboCount,
      weaponType: this.heldWeapon?.type || 'fist'
    });
  }
  
  calculateDamage(baseDamage, enemy) {
    let damage = baseDamage;
    
    // コンボボーナス
    if (this.comboCount >= 3) {
      damage = Math.floor(damage * 1.2);
    }
    if (this.comboCount >= 5) {
      damage = Math.floor(damage * 1.5);
    }
    
    // 武器特効（ボス戦用）
    if (enemy.constructor.name === 'Boss' && this.heldWeapon?.bossWeakness) {
      damage = Math.floor(damage * 1.5);
    }
    
    return damage;
  }
  
  incrementCombo() {
    this.comboCount++;
    this.comboTimer = 0; // リセットタイマーをリセット
    
    this.scene.events.emit('comboUpdate', {
      count: this.comboCount
    });
  }
  
  resetCombo() {
    if (this.comboCount > 0) {
      this.comboCount = 0;
      this.scene.events.emit('comboUpdate', {
        count: 0
      });
    }
  }
  
  isDepthAligned(target) {
    const DEPTH_THRESHOLD = 40;
    return Math.abs(this.groundY - target.groundY) < DEPTH_THRESHOLD;
  }
  
  performSpecialAttack(command) {
    // 必殺技実装（将来拡張）
    console.log(`Special attack: ${command}`);
  }
  
  dropWeapon() {
    if (this.heldWeapon) {
      // 武器を地面に落とす処理
      this.scene.spawnWeapon(this.heldWeapon.type, this.x, this.groundY);
      this.heldWeapon = null;
      
      this.scene.events.emit('weaponChange', { weapon: null });
    }
  }
  
  update(time, delta) {
    // 移動処理
    this.handleMovement(delta);
    
    // タイマー更新
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
    
    // コンボタイマー
    this.comboTimer += delta;
    if (this.comboTimer > this.COMBO_RESET) {
      this.resetCombo();
    }
    
    // 状態タイマー
    this.stateTimer += delta;
  }
  
  handleMovement(delta) {
    if (this.isAttacking) return; // 攻撃中は移動不可
    
    const speed = this.speed;
    let velocityX = 0;
    let velocityY = 0;
    
    // 左右移動
    if (this.cursors.left.isDown) {
      velocityX = -speed;
      this.facingRight = false;
    } else if (this.cursors.right.isDown) {
      velocityX = speed;
      this.facingRight = true;
    }
    
    // 奥行き移動（Y軸）
    if (this.cursors.up.isDown) {
      velocityY = -speed;
    } else if (this.cursors.down.isDown) {
      velocityY = speed;
    }
    
    // 速度設定
    this.body.setVelocity(velocityX, velocityY);
    
    // 奥行き制限
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    if (this.y < GROUND_Y_MIN) {
      this.y = GROUND_Y_MIN;
      this.groundY = GROUND_Y_MIN;
    } else if (this.y > GROUND_Y_MAX) {
      this.y = GROUND_Y_MAX;
      this.groundY = GROUND_Y_MAX;
    } else {
      this.groundY = this.y;
    }
    
    // 状態更新
    if (velocityX !== 0 || velocityY !== 0) {
      this.state = 'walk';
    } else if (this.state === 'walk') {
      this.state = 'idle';
    }
  }
  
  takeDamage(amount, sourceX) {
    if (this.invincible) return;
    
    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = 800; // 無敵時間
    
    // コンボリセット
    this.resetCombo();
    
    // ノックバック
    const direction = this.x > sourceX ? 1 : -1;
    this.body.setVelocityX(direction * 300);
    
    // 状態変更
    this.state = 'hurt';
    this.sprite.setFillStyle(0xff3333);
    
    // 復帰処理
    this.scene.time.delayedCall(200, () => {
      this.body.setVelocityX(0);
    });
    
    this.scene.time.delayedCall(400, () => {
      this.state = 'idle';
      this.sprite.setFillStyle(0x3399ff);
    });
    
    // イベント発火
    this.scene.events.emit('playerHpChange', {
      current: this.hp,
      max: this.maxHp
    });
    
    // 死亡チェック
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  die() {
    this.alive = false;
    this.scene.events.emit('playerDeath');
  }
}