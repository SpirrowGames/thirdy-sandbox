import { WEAPON_DEFS } from '../data/weapons.js';

/**
 * 武器クラス
 * 武器データ保持、耐久度管理、特殊技発動機能を提供
 */
export class Weapon {
  /**
   * @param {string} type - 武器タイプ（WEAPON_DEFSのキー）
   * @throws {Error} 未定義の武器タイプの場合
   */
  constructor(type) {
    const def = WEAPON_DEFS[type];
    if (!def) {
      throw new Error(`Unknown weapon type: ${type}`);
    }

    this.type = type;
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.durability = def.maxDurability;
    this.maxDurability = def.maxDurability;
    this.bossWeakness = def.bossWeakness;
    this._specialFunction = def.special;

    // 武器の状態
    this.isBroken = false;
  }

  /**
   * 武器を使用する（通常攻撃）
   * @returns {boolean} 武器が破壊されたかどうか
   */
  use() {
    if (this.isBroken) {
      console.warn(`Weapon ${this.name} is already broken`);
      return true;
    }

    this.durability--;
    
    if (this.durability <= 0) {
      this.isBroken = true;
      return true;
    }

    return false;
  }

  /**
   * 特殊技を使用する
   * @param {Phaser.Scene} scene - 現在のシーン
   * @param {Object} owner - 武器の所有者
   * @returns {boolean} 武器が破壊されたかどうか
   * @throws {Error} 必要なパラメータが不足している場合
   */
  useSpecial(scene, owner) {
    if (!scene) {
      throw new Error('Scene is required for special attack');
    }
    if (!owner) {
      throw new Error('Owner is required for special attack');
    }
    if (this.isBroken) {
      console.warn(`Weapon ${this.name} is already broken`);
      return true;
    }

    try {
      // 特殊技を実行
      this._specialFunction(scene, owner);
      
      // 特殊技は耐久を2消費
      this.durability -= 2;
      
      if (this.durability <= 0) {
        this.isBroken = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error executing special attack for ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * 武器の耐久度割合を取得
   * @returns {number} 0.0～1.0の範囲
   */
  getDurabilityRatio() {
    if (this.maxDurability === 0) return 0;
    return Math.max(0, this.durability / this.maxDurability);
  }

  /**
   * 武器の状態情報を取得
   * @returns {Object} 武器の状態情報
   */
  getStatus() {
    return {
      name: this.name,
      type: this.type,
      damage: this.damage,
      range: this.range,
      durability: this.durability,
      maxDurability: this.maxDurability,
      durabilityRatio: this.getDurabilityRatio(),
      isBroken: this.isBroken,
      bossWeakness: this.bossWeakness,
    };
  }

  /**
   * 武器を修理する（テスト・デバッグ用）
   * @param {number} amount - 修理量（省略時は完全修理）
   */
  repair(amount) {
    if (amount === undefined) {
      this.durability = this.maxDurability;
    } else {
      this.durability = Math.min(this.maxDurability, this.durability + amount);
    }
    this.isBroken = false;
  }

  /**
   * 武器のクローンを作成
   * @returns {Weapon} 新しい武器インスタンス
   */
  clone() {
    return new Weapon(this.type);
  }
}