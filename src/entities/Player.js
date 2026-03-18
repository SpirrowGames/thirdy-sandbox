import { WEAPON_DEFS } from '../data/weapons.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y;
    this.displayY = y;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200;
    this.alive = true;
    
    // 戦闘
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    
    // 武器システム
    this.heldWeapon = null;
    this.baseAttackDamage = 15;
    this.baseAttackRange = 80;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // 状態管理
    this.state = 'idle';
    this.facingRight = true;
    
    this.createSprite();
    this.setupPhysics();
  }
  
  createSprite() {
    // 開発初期は矩形ボックス
    this.sprite = this.scene.add.rectangle(this.x, this.y, 48, 64, 0x3399ff);
    this.sprite.setOrigin(0.5, 1); // 足元を基準点に
  }
  
  setupPhysics() {
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(48, 64);
    this.sprite.body.setCollideWorldBounds(true);
  }
  
  update(time, delta) {
    this.updateTimers(delta);
    this.updatePosition();
    
    // 武器の耐久度チェック
    if (this.heldWeapon && this.heldWeapon.durability <= 0) {
      this.dropWeapon();
    }
  }
  
  updateTimers(delta) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
    
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
  }
  
  updatePosition() {
    this.x = this.sprite.x;
    this.groundY = this.sprite.y;
    this.displayY = this.groundY;
  }
  
  // 武器拾い機能
  pickupWeapon(weapon) {
    if (!weapon || !weapon.alive) return false;
    
    // 既に武器を持っている場合は捨てる
    if (this.heldWeapon) {
      this.dropWeapon();
    }
    
    this.heldWeapon = weapon;
    weapon.pickup(this);
    
    // UIに武器変更を通知
    this.scene.events.emit('weaponChange', {
      name: weapon.name,
      durability: weapon.durability,
      max: weapon.maxDurability
    });
    
    return true;
  }
  
  // 武器破棄機能
  dropWeapon() {
    if (!this.heldWeapon) return;
    
    const weapon = this.heldWeapon;
    this.heldWeapon = null;
    
    // 武器を地面に落とす
    weapon.drop(this.x + (this.facingRight ? 30 : -30), this.groundY);
    
    // UIに武器変更を通知
    this.scene.events.emit('weaponChange', null);
  }
  
  // 通常攻撃
  performAttack() {
    if (this.state !== 'idle' && this.state !== 'walk') return false;
    
    this.state = 'attack';
    
    let damage, range;
    
    if (this.heldWeapon) {
      // 武器攻撃
      damage = this.heldWeapon.damage;
      range = this.heldWeapon.range;
      
      // 武器耐久度消費
      const broken = this.heldWeapon.use();
      if (broken) {
        this.scene.time.delayedCall(100, () => {
          this.dropWeapon();
        });
      } else {
        // 武器耐久度更新をUIに通知
        this.scene.events.emit('weaponChange', {
          name: this.heldWeapon.name,
          durability: this.heldWeapon.durability,
          max: this.heldWeapon.maxDurability
        });
      }
    } else {
      // 素手攻撃
      damage = this.baseAttackDamage;
      range = this.baseAttackRange;
    }
    
    // 攻撃判定生成
    this.createAttackHitbox(damage, range, 150);
    
    // 攻撃後の状態復帰
    this.scene.time.delayedCall(300, () => {
      if (this.state === 'attack') {
        this.state = 'idle';
      }
    });
    
    return true;
  }
  
  // 武器特殊技
  performWeaponSpecial() {
    if (!this.heldWeapon || this.state !== 'idle') return false;
    
    this.state = 'special';
    
    // 武器の特殊技実行
    this.heldWeapon.useSpecial(this.scene, this);
    
    // 武器耐久度更新をUIに通知
    this.scene.events.emit('weaponChange', {
      name: this.heldWeapon.name,
      durability: this.heldWeapon.durability,
      max: this.heldWeapon.maxDurability
    });
    
    // 特殊技後の状態復帰
    this.scene.time.delayedCall(800, () => {
      if (this.state === 'special') {
        this.state = 'idle';
      }
    });
    
    return true;
  }
  
  // 攻撃ヒットボックス生成
  createAttackHitbox(damage, range, duration) {
    const dir = this.facingRight ? 1 : -1;
    const hitboxX = this.x + dir * range * 0.5;
    
    const hitbox = this.scene.physics.add.image(hitboxX, this.groundY, '__WHITE');
    hitbox.setSize(range, 80); // DEPTH_THRESHOLD * 2
    hitbox.setVisible(false);
    hitbox.body.setImmovable(true);
    
    // 敵との衝突判定
    const overlap = this.scene.physics.add.overlap(hitbox, this.scene.enemies, (hb, enemy) => {
      if (this.isDepthAligned(enemy)) {
        this.hitEnemy(enemy, damage);
      }
    });
    
    // 指定時間後に破棄
    this.scene.time.delayedCall(duration, () => {
      overlap.destroy();
      hitbox.destroy();
    });
  }
  
  // 奥行き判定
  isDepthAligned(target) {
    const DEPTH_THRESHOLD = 40;
    return Math.abs(this.groundY - target.groundY) < DEPTH_THRESHOLD;
  }
  
  // 敵ヒット処理
  hitEnemy(enemy, damage) {
    if (!enemy.alive || enemy.invincible) return;
    
    enemy.takeDamage(damage, this.x);
    
    // コンボカウント増加
    this.comboCount++;
    this.comboTimer = this.COMBO_RESET;
    
    // ヒットストップ
    this.scene.hitStop(80);
    
    // UIにコンボ更新を通知
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
  }
  
  // コンボリセット
  resetCombo() {
    this.comboCount = 0;
    this.scene.events.emit('comboUpdate', { count: 0 });
  }
  
  // ダメージ処理
  takeDamage(amount, sourceX = null) {
    if (this.invincible || !this.alive) return;
    
    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = 500; // 0.5秒無敵
    
    // ノックバック
    if (sourceX !== null) {
      const dir = this.x > sourceX ? 1 : -1;
      this.sprite.body.setVelocityX(dir * 200);
      this.scene.time.delayedCall(200, () => {
        this.sprite.body.setVelocityX(0);
      });
    }
    
    // コンボリセット
    this.resetCombo();
    
    // UIにHP更新を通知
    this.scene.events.emit('playerHpChange', { current: this.hp, max: this.maxHp });
    
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  die() {
    this.alive = false;
    this.state = 'dead';
    
    // 武器を落とす
    if (this.heldWeapon) {
      this.dropWeapon();
    }
    
    // ゲームオーバー処理
    this.scene.events.emit('playerDead');
  }
  
  // 武器拾い範囲チェック
  canPickupWeapon(weapon) {
    if (!weapon || !weapon.alive || weapon.held) return false;
    
    const distance = Phaser.Math.Distance.Between(this.x, this.groundY, weapon.x, weapon.groundY);
    return distance < 60; // 拾い範囲60px
  }
  
  // 近くの武器を自動検出
  findNearbyWeapons() {
    if (!this.scene.weapons) return [];
    
    return this.scene.weapons.children.entries.filter(weapon => 
      this.canPickupWeapon(weapon)
    );
  }
  
  destroy() {
    if (this.heldWeapon) {
      this.dropWeapon();
    }
    
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}