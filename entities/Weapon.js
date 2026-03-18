import { WEAPON_DEFS } from '../data/weapons.js';

export class Weapon {
  constructor(type) {
    const def = WEAPON_DEFS[type];
    if (!def) {
      throw new Error(`未知の武器タイプ: ${type}`);
    }
    
    this.type = type;
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.durability = def.maxDurability;
    this.maxDurability = def.maxDurability;
    this.bossWeakness = def.bossWeakness;
    this.specialFunction = def.special;
  }

  use() {
    this.durability--;
    return this.durability <= 0;
  }

  useSpecial(scene, owner) {
    if (this.durability < 2) {
      // 耐久度不足で特殊技使用不可
      return false;
    }
    
    try {
      this.specialFunction(scene, owner);
      this.durability -= 2; // 特殊技は耐久度を2消費
      return true;
    } catch (error) {
      console.error(`武器特殊技実行エラー: ${error.message}`);
      return false;
    }
  }

  canUseSpecial() {
    return this.durability >= 2;
  }
}