import { WEAPON_DEFS } from '../data/weapons.js';

export class Weapon extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type) {
    super(scene, x, y);
    
    this.scene = scene;
    this.type = type;
    
    // 武器定義から情報を取得
    const def = WEAPON_DEFS[type];
    if (!def) {
      throw new Error(`Unknown weapon type: ${type}`);
    }
    
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.durability = def.maxDurability;
    this.maxDurability = def.maxDurability;
    this.attackDuration = def.attackDuration;
    this.bossWeakness = def.bossWeakness;
    
    // 武器スプライト（矩形で代用）
    this.weaponSprite = scene.add.rectangle(0, 0, 32, 8, 0xcccccc);
    this.add(this.weaponSprite);
    
    // 物理ボディを追加（拾う用）
    scene.physics.add.existing(this);
    this.body.setSize(32, 8);
    
    scene.add.existing(this);
  }
  
  /**
   * 武器を使用（通常攻撃）
   * @returns {boolean} 武器が破壊されたかどうか
   */
  use() {
    this.durability--;
    
    // 武器状態変更イベント発行
    this.scene.events.emit('weaponChange', {
      name: this.name,
      durability: this.durability,
      max: this.maxDurability
    });
    
    return this.durability <= 0;
  }
  
  /**
   * 特殊技を使用
   * @returns {boolean} 武器が破壊されたかどうか
   */
  useSpecial() {
    const def = WEAPON_DEFS[this.type];
    def.special(this.scene, this.owner);
    
    this.durability -= 2; // 特殊技は耐久を2消費
    
    // 武器状態変更イベント発行
    this.scene.events.emit('weaponChange', {
      name: this.name,
      durability: this.durability,
      max: this.maxDurability
    });
    
    return this.durability <= 0;
  }
  
  /**
   * 武器の所有者を設定
   */
  setOwner(owner) {
    this.owner = owner;
  }
  
  /**
   * 武器の耐久度割合を取得
   */
  getDurabilityRatio() {
    return this.durability / this.maxDurability;
  }
  
  /**
   * 武器が壊れているかチェック
   */
  isBroken() {
    return this.durability <= 0;
  }
  
  /**
   * 武器を破棄
   */
  destroy() {
    if (this.owner) {
      this.owner.dropWeapon();
    }
    super.destroy();
  }
}