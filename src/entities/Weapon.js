import { WEAPON_DEFS } from '../data/weapons.js';

/**
 * 拾える武器のクラス
 * 耐久度管理、特殊技発動、武器データからの初期化を担当
 */
export class Weapon {
  /**
   * @param {string} type - 武器タイプ (WEAPON_DEFSのキー)
   * @param {number} [durabilityOverride] - 耐久度の初期値（テスト用）
   */
  constructor(type, durabilityOverride = null) {
    const def = WEAPON_DEFS[type];
    
    if (!def) {
      throw new Error(`Unknown weapon type: ${type}`);
    }

    // 基本プロパティ
    this.type = type;
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.maxDurability = def.maxDurability;
    this.durability = durabilityOverride !== null ? durabilityOverride : def.maxDurability;
    this.bossWeakness = def.bossWeakness || false;
    
    // 特殊技の関数参照を保持
    this.specialFunction = def.special;
    
    // 状態フラグ
    this.broken = false;
  }

  /**
   * 武器を使用する（通常攻撃）
   * @returns {boolean} 武器が破壊されたかどうか
   */
  use() {
    if (this.broken) {
      console.warn(`Weapon ${this.name} is already broken`);
      return true;
    }

    this.durability = Math.max(0, this.durability - 1);
    
    if (this.durability <= 0) {
      this.broken = true;
      return true;
    }
    
    return false;
  }

  /**
   * 特殊技を使用する
   * @param {Phaser.Scene} scene - 現在のシーン
   * @param {Object} owner - 武器の所有者
   * @returns {boolean} 武器が破壊されたかどうか
   */
  useSpecial(scene, owner) {
    if (this.broken) {
      console.warn(`Weapon ${this.name} is already broken`);
      return true;
    }

    if (!scene || !owner) {
      throw new Error('Scene and owner are required for special attack');
    }

    // 特殊技は耐久を2消費
    this.durability = Math.max(0, this.durability - 2);
    
    // 特殊技実行
    if (this.specialFunction && typeof this.specialFunction === 'function') {
      try {
        this.specialFunction(scene, owner);
      } catch (error) {
        console.error(`Error executing special attack for ${this.name}:`, error);
      }
    }
    
    if (this.durability <= 0) {
      this.broken = true;
      return true;
    }
    
    return false;
  }

  /**
   * 武器の耐久度を回復する（アイテム等での回復用）
   * @param {number} amount - 回復量
   */
  repair(amount) {
    if (this.broken) {
      console.warn(`Cannot repair broken weapon: ${this.name}`);
      return;
    }

    this.durability = Math.min(this.maxDurability, this.durability + amount);
  }

  /**
   * 武器の残り耐久度割合を取得
   * @returns {number} 0.0〜1.0の範囲
   */
  getDurabilityRatio() {
    return this.maxDurability > 0 ? this.durability / this.maxDurability : 0;
  }

  /**
   * 武器の状態情報を取得（UI表示用）
   * @returns {Object} 武器の状態情報
   */
  getStatus() {
    return {
      type: this.type,
      name: this.name,
      damage: this.damage,
      range: this.range,
      durability: this.durability,
      maxDurability: this.maxDurability,
      durabilityRatio: this.getDurabilityRatio(),
      broken: this.broken,
      bossWeakness: this.bossWeakness
    };
  }

  /**
   * 武器のクローンを作成（同じタイプの新品武器）
   * @returns {Weapon} 新しい武器インスタンス
   */
  clone() {
    return new Weapon(this.type);
  }

  /**
   * 武器を破棄する
   */
  destroy() {
    this.broken = true;
    this.durability = 0;
    this.specialFunction = null;
  }
}