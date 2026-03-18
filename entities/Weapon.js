import { WEAPON_DEFS } from '../data/weapons.js';

/**
 * 拾える武器クラス
 * 武器データ保持、耐久度管理、特殊技発動を担当
 */
export class Weapon {
  /**
   * @param {string} type - 武器タイプ（WEAPON_DEFSのキー）
   * @param {number} x - 配置X座標
   * @param {number} groundY - 配置Y座標（奥行き判定用）
   */
  constructor(type, x = 0, groundY = 0) {
    const def = WEAPON_DEFS[type];
    if (!def) {
      throw new Error(`Unknown weapon type: ${type}`);
    }

    // 武器基本データ
    this.type = type;
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.maxDurability = def.maxDurability;
    this.durability = def.maxDurability;
    this.bossWeakness = def.bossWeakness;
    this.specialFunction = def.special;

    // 配置データ
    this.x = x;
    this.groundY = groundY;
    this.y = groundY; // 表示用Y座標（初期値は groundY と同じ）

    // 状態管理
    this.isHeld = false;
    this.isDestroyed = false;
  }

  /**
   * 武器を使用（通常攻撃）
   * @returns {boolean} true: 武器が破壊された, false: まだ使用可能
   */
  use() {
    if (this.isDestroyed) {
      console.warn(`Weapon ${this.name} is already destroyed`);
      return true;
    }

    this.durability = Math.max(0, this.durability - 1);
    
    if (this.durability <= 0) {
      this.isDestroyed = true;
      return true;
    }
    
    return false;
  }

  /**
   * 特殊技を使用
   * @param {Phaser.Scene} scene - 実行するシーン
   * @param {Object} owner - 武器の所有者（Player等）
   * @returns {boolean} true: 武器が破壊された, false: まだ使用可能
   */
  useSpecial(scene, owner) {
    if (this.isDestroyed) {
      console.warn(`Weapon ${this.name} is already destroyed`);
      return true;
    }

    if (!scene || !owner) {
      throw new Error('useSpecial requires scene and owner parameters');
    }

    // 特殊技実行
    try {
      this.specialFunction(scene, owner);
    } catch (error) {
      console.error(`Failed to execute special attack for ${this.name}:`, error);
    }

    // 特殊技は耐久度を2消費
    this.durability = Math.max(0, this.durability - 2);
    
    if (this.durability <= 0) {
      this.isDestroyed = true;
      return true;
    }
    
    return false;
  }

  /**
   * 武器の状態情報を取得
   * @returns {Object} 武器の状態オブジェクト
   */
  getStatus() {
    return {
      type: this.type,
      name: this.name,
      damage: this.damage,
      range: this.range,
      durability: this.durability,
      maxDurability: this.maxDurability,
      durabilityRatio: this.maxDurability > 0 ? this.durability / this.maxDurability : 0,
      isDestroyed: this.isDestroyed,
      canUseSpecial: this.durability >= 2,
      bossWeakness: this.bossWeakness,
    };
  }

  /**
   * 武器を修復（デバッグ用）
   * @param {number} amount - 回復する耐久度（省略時は最大まで回復）
   */
  repair(amount = null) {
    if (amount === null) {
      this.durability = this.maxDurability;
    } else {
      this.durability = Math.min(this.maxDurability, this.durability + amount);
    }
    
    if (this.durability > 0) {
      this.isDestroyed = false;
    }
  }

  /**
   * 武器をクローン（同じタイプの新しい武器を作成）
   * @returns {Weapon} 新しい武器インスタンス
   */
  clone() {
    return new Weapon(this.type, this.x, this.groundY);
  }

  /**
   * 武器の耐久度が警告レベルかチェック
   * @returns {boolean} true: 耐久度が危険レベル（残り1）
   */
  isLowDurability() {
    return this.durability <= 1 && !this.isDestroyed;
  }

  /**
   * JSON形式で武器データを出力（セーブ用）
   * @returns {Object} JSON形式の武器データ
   */
  toJSON() {
    return {
      type: this.type,
      x: this.x,
      groundY: this.groundY,
      durability: this.durability,
      isHeld: this.isHeld,
    };
  }

  /**
   * JSONデータから武器を復元（ロード用）
   * @param {Object} data - JSON形式の武器データ
   * @returns {Weapon} 復元された武器インスタンス
   */
  static fromJSON(data) {
    const weapon = new Weapon(data.type, data.x, data.groundY);
    weapon.durability = data.durability;
    weapon.isHeld = data.isHeld;
    weapon.isDestroyed = weapon.durability <= 0;
    return weapon;
  }
}