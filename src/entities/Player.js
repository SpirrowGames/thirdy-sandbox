import { CommandBuffer } from '../input/CommandBuffer.js';
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
    this.facingRight = true;
    
    // 戦闘関連
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500;
    this.state = 'idle';
    this.attackCooldown = 0;
    
    // 武器システム
    this.heldWeapon = null;
    this.weaponCooldown = 0;
    this.WEAPON_COOLDOWN_TIME = 300; // ms
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // コマンド入力
    this.commandBuffer = new CommandBuffer();
    
    // Phaserスプライト作成
    this.sprite = scene.add.rectangle(x, y, 48, 64, 0x3399ff);
    this.hitbox = scene.physics.add.existing(this.sprite);
    this.hitbox.body.setSize(48, 64);
  }
  
  update(time, delta) {
    this.updateTimers(delta);
    this.handleMovement();
    this.updateDisplay();
    
    // コンボタイマー更新
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }
  
  updateTimers(delta) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    if (this.weaponCooldown > 0) {
      this.weaponCooldown -= delta;
    }
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
  }
  
  // 武器拾得
  pickupWeapon(weapon) {
    if (this.heldWeapon) {
      this.dropWeapon();
    }
    
    this.heldWeapon = weapon;
    this.scene.events.emit('weaponChange', {
      name: weapon.name,
      durability: weapon.durability,
      max: weapon.maxDurability
    });
    
    // 武器オブジェクトをシーンから削除
    weapon.sprite?.destroy();
  }
  
  // 武器ドロップ
  dropWeapon() {
    if (!this.heldWeapon) return;
    
    // 武器を地面に落とす
    const droppedWeapon = this.scene.spawnWeapon(
      this.heldWeapon.type,
      this.x + (this.facingRight ? 30 : -30),
      this.groundY
    );
    droppedWeapon.durability = this.heldWeapon.durability;
    
    this.heldWeapon = null;
    this.scene.events.emit('weaponChange', null);
  }
  
  // 基本攻撃
  performAttack() {
    if (this.attackCooldown > 0 || this.state === 'hurt') return false;
    
    let damage, range;
    
    if (this.heldWeapon) {
      // 武器攻撃
      damage = this.heldWeapon.damage;
      range = this.heldWeapon.range;
      
      // 武器耐久度消費
      const broken = this.heldWeapon.use();
      if (broken) {
        this.scene.events.emit('weaponBreak', this.heldWeapon.name);
        this.heldWeapon = null;
        this.scene.events.emit('weaponChange', null);
      } else {
        this.scene.events.emit('weaponChange', {
          name: this.heldWeapon.name,
          durability: this.heldWeapon.durability,
          max: this.heldWeapon.maxDurability
        });
      }
    } else {
      // 素手攻撃
      damage = 15;
      range = 80;
    }
    
    // 攻撃ヒットボックス生成
    this.createAttackHitbox(damage, range, 100);
    
    this.attackCooldown = 250;
    this.comboCount++;
    this.comboTimer = this.COMBO_RESET;
    
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
    
    return true;
  }
  
  // 武器特殊技
  performWeaponSpecial() {
    if (!this.heldWeapon || this.weaponCooldown > 0 || this.state === 'hurt') {
      return false;
    }
    
    const weaponDef = WEAPON_DEFS[this.heldWeapon.type];
    if (!weaponDef || !weaponDef.special) {
      return false;
    }
    
    // 特殊技実行
    weaponDef.special(this.scene, this);
    
    // 武器耐久度を2消費
    this.heldWeapon.durability -= 2;
    if (this.heldWeapon.durability <= 0) {
      this.scene.events.emit('weaponBreak', this.heldWeapon.name);
      this.heldWeapon = null;
      this.scene.events.emit('weaponChange', null);
    } else {
      this.scene.events.emit('weaponChange', {
        name: this.heldWeapon.name,
        durability: this.heldWeapon.durability,
        max: this.heldWeapon.maxDurability
      });
    }
    
    this.weaponCooldown = this.WEAPON_COOLDOWN_TIME;
    this.comboCount += 2; // 特殊技はコンボ+2
    this.comboTimer = this.COMBO_RESET;
    
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
    
    return true;
  }
  
  // 必殺技
  performSpecialMove(command) {
    if (this.attackCooldown > 0 || this.state === 'hurt') return false;
    
    let damage, range, effect;
    
    switch (command) {
      case 'steamBlow':
        damage = 25;
        range = 150;
        effect = 'steam';
        break;
      case 'boilerUpper':
        damage = 30;
        range = 100;
        effect = 'uppercut';
        break;
      case 'backdraft':
        damage = 20;
        range = 120;
        effect = 'sweep';
        break;
      default:
        return false;
    }
    
    // 武器を持っている場合はダメージボーナス
    if (this.heldWeapon) {
      damage += Math.floor(this.heldWeapon.damage * 0.5);
    }
    
    this.createSpecialAttackHitbox(command, damage, range, effect);
    
    this.attackCooldown = 500;
    this.comboCount += 3; // 必殺技はコンボ+3
    this.comboTimer = this.COMBO_RESET;
    
    this.scene.events.emit('comboUpdate', { count: this.comboCount });
    this.scene.events.emit('specialMove', { command, damage });
    
    return true;
  }
  
  // 攻撃ヒットボックス生成
  createAttackHitbox(damage, range, duration) {
    const dir = this.facingRight ? 1 : -1;
    const hitboxX = this.x + dir * range * 0.5;
    
    const hitbox = this.scene.physics.add.image(hitboxX, this.groundY, '__WHITE');
    hitbox.setSize(range, 80); // 奥行き判定用の高さ
    hitbox.setVisible(false);
    hitbox.setData('damage', damage);
    hitbox.setData('owner', this);
    hitbox.setData('weaponType', this.heldWeapon?.type || null);
    
    // 敵との衝突判定
    this.scene.physics.add.overlap(hitbox, this.scene.enemies, 
      (hb, enemy) => this.scene.handleHit(hb.getData('owner'), enemy, hb.getData('damage'), hb.getData('weaponType')));
    
    // 一定時間後に削除
    this.scene.time.delayedCall(duration, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });
  }
  
  // 必殺技ヒットボックス生成
  createSpecialAttackHitbox(command, damage, range, effect) {
    const dir = this.facingRight ? 1 : -1;
    let hitboxX = this.x;
    let hitboxY = this.groundY;
    let width = range;
    let height = 80;
    
    switch (effect) {
      case 'steam':
        // 前方扇形
        hitboxX = this.x + dir * range * 0.6;
        width = range * 1.2;
        height = 120;
        break;
      case 'uppercut':
        // 前方＋上方
        hitboxX = this.x + dir * range * 0.4;
        hitboxY = this.groundY - 40;
        height = 120;
        break;
      case 'sweep':
        // 後方薙ぎ払い
        hitboxX = this.x - dir * range * 0.3;
        width = range * 1.5;
        break;
    }
    
    const hitbox = this.scene.physics.add.image(hitboxX, hitboxY, '__WHITE');
    hitbox.setSize(width, height);
    hitbox.setVisible(false);
    hitbox.setData('damage', damage);
    hitbox.setData('owner', this);
    hitbox.setData('weaponType', this.heldWeapon?.type || null);
    hitbox.setData('effect', effect);
    
    // 敵との衝突判定
    this.scene.physics.add.overlap(hitbox, this.scene.enemies,
      (hb, enemy) => this.scene.handleSpecialHit(hb.getData('owner'), enemy, hb.getData('damage'), hb.getData('effect'), hb.getData('weaponType')));
    
    // エフェクト表示時間
    this.scene.time.delayedCall(200, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });
  }
  
  // 入力処理
  handleInput(inputKey) {
    const command = this.commandBuffer.push(inputKey);
    
    if (command) {
      // 必殺技コマンド成功
      return this.performSpecialMove(command);
    } else if (inputKey === 'Z') {
      // 通常攻撃
      return this.performAttack();
    } else if (inputKey === 'X' && this.heldWeapon) {
      // 武器特殊技（Xボタン長押しの代わりにXボタン単押しで実装）
      return this.performWeaponSpecial();
    }
    
    return false;
  }
  
  // ダメージ処理
  takeDamage(amount, knockbackX = 0) {
    if (this.invincible || !this.alive) return false;
    
    this.hp -= amount;
    this.resetCombo();
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.state = 'dead';
    } else {
      this.state = 'hurt';
      this.invincible = true;
      this.invincibleTimer = 500;
      
      // ノックバック
      if (knockbackX !== 0) {
        this.hitbox.body.setVelocityX(knockbackX);
        this.scene.time.delayedCall(200, () => {
          if (this.hitbox.body) {
            this.hitbox.body.setVelocityX(0);
          }
        });
      }
    }
    
    this.scene.events.emit('playerHpChange', { 
      current: this.hp, 
      max: this.maxHp 
    });
    
    return true;
  }
  
  // コンボリセット
  resetCombo() {
    if (this.comboCount > 0) {
      this.comboCount = 0;
      this.comboTimer = 0;
      this.scene.events.emit('comboUpdate', { count: 0 });
    }
  }
  
  // 移動処理
  handleMovement() {
    if (this.state === 'hurt' || this.state === 'dead') return;
    
    // 基本移動は既存の実装を維持
    // ここでは武器システムに関連する部分のみ実装
  }
  
  // 表示更新
  updateDisplay() {
    this.sprite.x = this.x;
    this.sprite.y = this.displayY;
    
    // 無敵時の点滅効果
    if (this.invincible) {
      this.sprite.alpha = Math.sin(Date.now() * 0.02) > 0 ? 0.5 : 1.0;
    } else {
      this.sprite.alpha = 1.0;
    }
  }
  
  // 武器情報取得
  getWeaponInfo() {
    if (!this.heldWeapon) return null;
    
    return {
      name: this.heldWeapon.name,
      durability: this.heldWeapon.durability,
      maxDurability: this.heldWeapon.maxDurability,
      damage: this.heldWeapon.damage,
      type: this.heldWeapon.type
    };
  }
  
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.hitbox) {
      this.hitbox.destroy();
    }
  }
}