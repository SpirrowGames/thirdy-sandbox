import { CommandBuffer } from '../input/CommandBuffer.js';
import { WEAPON_DEFS } from '../data/weapons.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200;
    this.groundY = y;
    this.displayY = y;
    
    // 戦闘
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    
    // 武器システム
    this.heldWeapon = null;
    this.weaponPickupRange = 60; // px
    
    // 状態管理
    this.state = 'idle';
    this.facingRight = true;
    this.alive = true;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // コマンド入力
    this.commandBuffer = new CommandBuffer();
    
    this.createSprite();
    this.setupPhysics();
  }
  
  createSprite() {
    // 開発初期は矩形、後でスプライトに置き換え
    this.sprite = this.scene.add.rectangle(this.x, this.y, 48, 64, 0x3399ff);
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(48, 64);
  }
  
  setupPhysics() {
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setDrag(400, 400);
  }
  
  update(time, delta) {
    if (!this.alive) return;
    
    this.updateTimers(delta);
    this.handleInput();
    this.updatePosition();
    this.checkWeaponPickup();
  }
  
  updateTimers(delta) {
    // コンボタイマー更新
    if (this.comboCount > 0) {
      this.comboTimer += delta;
      if (this.comboTimer > this.COMBO_RESET) {
        this.resetCombo();
      }
    }
    
    // 無敵時間更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
  }
  
  handleInput() {
    const cursors = this.scene.cursors;
    const keys = this.scene.keys;
    
    // 移動入力
    if (cursors.left.isDown) {
      this.sprite.body.setVelocityX(-this.speed);
      this.facingRight = false;
    } else if (cursors.right.isDown) {
      this.sprite.body.setVelocityX(this.speed);
      this.facingRight = true;
    } else {
      this.sprite.body.setVelocityX(0);
    }
    
    if (cursors.up.isDown) {
      this.sprite.body.setVelocityY(-this.speed);
    } else if (cursors.down.isDown) {
      this.sprite.body.setVelocityY(this.speed);
    } else {
      this.sprite.body.setVelocityY(0);
    }
    
    // 攻撃入力
    if (Phaser.Input.Keyboard.JustDown(keys.Z)) {
      this.handleAttackInput();
    }
  }
  
  handleAttackInput() {
    // コマンド入力チェック
    const command = this.commandBuffer.push('Z');
    if (command) {
      this.performSpecialAttack(command);
      return;
    }
    
    // 通常攻撃
    if (this.heldWeapon) {
      this.performWeaponAttack();
    } else {
      this.performBasicAttack();
    }
  }
  
  performBasicAttack() {
    const damage = 15;
    const range = 80;
    
    this.createAttackHitbox(damage, range, 200);
    this.incrementCombo();
  }
  
  performWeaponAttack() {
    if (!this.heldWeapon) return;
    
    const weaponDef = WEAPON_DEFS[this.heldWeapon.type];
    const damage = weaponDef.damage;
    const range = weaponDef.range;
    
    this.createAttackHitbox(damage, range, 250);
    this.incrementCombo();
    
    // 武器耐久度消費
    const broken = this.heldWeapon.use();
    if (broken) {
      this.dropWeapon();
    }
    
    // UI更新イベント発火
    this.scene.events.emit('weaponDurabilityChange', {
      current: this.heldWeapon?.durability || 0,
      max: this.heldWeapon?.maxDurability || 0
    });
  }
  
  performSpecialAttack(commandName) {
    if (this.heldWeapon && this.heldWeapon.durability >= 2) {
      // 武器特殊技
      this.performWeaponSpecial();
    } else {
      // 素手必殺技
      this.performBasicSpecial(commandName);
    }
  }
  
  performWeaponSpecial() {
    const weaponDef = WEAPON_DEFS[this.heldWeapon.type];
    weaponDef.special(this.scene, this);
    
    // 特殊技は耐久度2消費
    this.heldWeapon.durability -= 2;
    if (this.heldWeapon.durability <= 0) {
      this.dropWeapon();
    }
    
    this.scene.events.emit('weaponDurabilityChange', {
      current: this.heldWeapon?.durability || 0,
      max: this.heldWeapon?.maxDurability || 0
    });
  }
  
  performBasicSpecial(commandName) {
    switch (commandName) {
      case 'steamBlow':
        this.steamBlow();
        break;
      case 'boilerUpper':
        this.boilerUpper();
        break;
      case 'backdraft':
        this.backdraft();
        break;
    }
  }
  
  steamBlow() {
    // スチームブロー：前進しながらパンチ
    const damage = 25;
    const range = 120;
    
    // 前進動作
    const direction = this.facingRight ? 1 : -1;
    this.sprite.body.setVelocityX(direction * 400);
    this.scene.time.delayedCall(300, () => {
      this.sprite.body.setVelocityX(0);
    });
    
    this.createAttackHitbox(damage, range, 300);
    this.incrementCombo();
  }
  
  boilerUpper() {
    // ボイラーアッパー：打ち上げ攻撃
    const damage = 20;
    const range = 100;
    
    this.createAttackHitbox(damage, range, 250, true); // 浮かせ効果付き
    this.incrementCombo();
  }
  
  backdraft() {
    // バックドラフト：後退薙ぎ払い
    const damage = 18;
    const range = 140;
    
    // 後退動作
    const direction = this.facingRight ? -1 : 1;
    this.sprite.body.setVelocityX(direction * 300);
    this.scene.time.delayedCall(200, () => {
      this.sprite.body.setVelocityX(0);
    });
    
    this.createAttackHitbox(damage, range, 200);
    this.incrementCombo();
  }
  
  createAttackHitbox(damage, range, duration, hasLaunch = false) {
    const direction = this.facingRight ? 1 : -1;
    const hitboxX = this.sprite.x + direction * range * 0.5;
    const hitboxY = this.groundY;
    
    const hitbox = this.scene.physics.add.image(hitboxX, hitboxY, '__WHITE');
    hitbox.setSize(range, 80); // DEPTH_THRESHOLD * 2
    hitbox.setVisible(false);
    hitbox.setData('damage', damage);
    hitbox.setData('owner', this);
    hitbox.setData('hasLaunch', hasLaunch);
    
    // 敵との衝突判定
    this.scene.physics.add.overlap(hitbox, this.scene.enemies, (hb, enemy) => {
      this.scene.handleHit(this, enemy, damage, hasLaunch);
    });
    
    // ヒットボックスを一定時間後に削除
    this.scene.time.delayedCall(duration, () => {
      if (hitbox.active) {
        hitbox.destroy();
      }
    });
  }
  
  checkWeaponPickup() {
    // 近くの武器をチェック
    this.scene.weapons.children.entries.forEach(weaponSprite => {
      if (!weaponSprite.active) return;
      
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.groundY,
        weaponSprite.x, weaponSprite.groundY
      );
      
      if (distance < this.weaponPickupRange) {
        this.pickupWeapon(weaponSprite.weaponData);
        weaponSprite.destroy();
      }
    });
  }
  
  pickupWeapon(weapon) {
    // 既に武器を持っている場合は落とす
    if (this.heldWeapon) {
      this.dropWeapon();
    }
    
    this.heldWeapon = weapon;
    
    // UI更新イベント発火
    this.scene.events.emit('weaponPickup', {
      name: weapon.name,
      durability: weapon.durability,
      maxDurability: weapon.maxDurability
    });
  }
  
  dropWeapon() {
    if (!this.heldWeapon) return;
    
    // 武器を地面に落とす（耐久度が残っている場合のみ）
    if (this.heldWeapon.durability > 0) {
      this.scene.createWeaponPickup(
        this.heldWeapon.type,
        this.sprite.x + (this.facingRight ? 60 : -60),
        this.groundY,
        this.heldWeapon.durability
      );
    }
    
    this.heldWeapon = null;
    
    // UI更新イベント発火
    this.scene.events.emit('weaponDrop');
  }
  
  incrementCombo() {
    this.comboCount++;
    this.comboTimer = 0;
    
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
  }
  
  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    
    this.scene.events.emit('comboReset');
  }
  
  takeDamage(amount, knockbackDirection = null) {
    if (this.invincible || !this.alive) return;
    
    this.hp -= amount;
    this.resetCombo(); // 被弾でコンボリセット
    
    // ノックバック処理
    if (knockbackDirection) {
      this.sprite.body.setVelocityX(knockbackDirection.x * 300);
      this.sprite.body.setVelocityY(knockbackDirection.y * 200);
    }
    
    // 無敵時間設定
    this.invincible = true;
    this.invincibleTimer = 500; // ms
    
    // HP更新イベント発火
    this.scene.events.emit('playerHpChange', {
      current: this.hp,
      max: this.maxHp
    });
    
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  die() {
    this.alive = false;
    this.dropWeapon();
    this.scene.events.emit('playerDeath');
  }
  
  updatePosition() {
    // 奥行き制限
    const GROUND_Y_MIN = 360;
    const GROUND_Y_MAX = 480;
    
    this.groundY = Phaser.Math.Clamp(this.sprite.y, GROUND_Y_MIN, GROUND_Y_MAX);
    this.sprite.y = this.groundY;
    this.displayY = this.groundY;
  }
  
  // 武器情報取得（UI用）
  getWeaponInfo() {
    if (!this.heldWeapon) return null;
    
    return {
      name: this.heldWeapon.name,
      type: this.heldWeapon.type,
      durability: this.heldWeapon.durability,
      maxDurability: this.heldWeapon.maxDurability,
      damage: WEAPON_DEFS[this.heldWeapon.type].damage,
      range: WEAPON_DEFS[this.heldWeapon.type].range
    };
  }
}