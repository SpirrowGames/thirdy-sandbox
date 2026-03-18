import { WEAPON_DEFS } from '../data/weapons.js';

/**
 * 武器クラス
 * 武器データの管理、耐久度システム、特殊技の実行を担当
 */
export class Weapon {
  /**
   * @param {string} type - 武器タイプ（WEAPON_DEFSのキー）
   * @param {number} x - 初期X座標
   * @param {number} groundY - 初期Y座標（奥行き判定用）
   */
  constructor(type, x = 0, groundY = 0) {
    // 武器定義の検証
    if (!WEAPON_DEFS[type]) {
      throw new Error(`Unknown weapon type: ${type}`);
    }

    const def = WEAPON_DEFS[type];
    
    // 基本プロパティ
    this.type = type;
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.maxDurability = def.maxDurability;
    this.durability = def.maxDurability;
    this.bossWeakness = def.bossWeakness;
    
    // 位置情報
    this.x = x;
    this.groundY = groundY;
    this.displayY = groundY;
    
    // 状態管理
    this.isHeld = false;
    this.owner = null;
    this.alive = true;
    
    // 特殊技の実装を保持
    this._specialAction = def.special;
  }

  /**
   * 武器を使用する（通常攻撃）
   * @returns {boolean} true: 武器が破壊された, false: まだ使用可能
   */
  use() {
    if (!this.alive || this.durability <= 0) {
      return true;
    }

    this.durability--;
    
    // 耐久度が0になった場合
    if (this.durability <= 0) {
      this.destroy();
      return true;
    }
    
    return false;
  }

  /**
   * 特殊技を使用する
   * @param {Phaser.Scene} scene - ゲームシーン
   * @param {Object} owner - 武器の所有者
   * @returns {boolean} true: 武器が破壊された, false: まだ使用可能
   */
  useSpecial(scene, owner) {
    if (!this.alive || this.durability <= 0) {
      return true;
    }

    // 特殊技の実行
    try {
      this._specialAction(scene, owner);
    } catch (error) {
      console.error(`Special action failed for weapon ${this.type}:`, error);
    }

    // 特殊技は耐久度を2消費
    this.durability -= 2;
    
    if (this.durability <= 0) {
      this.destroy();
      return true;
    }
    
    return false;
  }

  /**
   * 武器を拾う
   * @param {Object} owner - 新しい所有者
   */
  pickup(owner) {
    if (this.isHeld) {
      return false;
    }

    this.isHeld = true;
    this.owner = owner;
    return true;
  }

  /**
   * 武器を落とす
   * @param {number} x - 落とす位置のX座標
   * @param {number} groundY - 落とす位置のY座標
   */
  drop(x, groundY) {
    this.isHeld = false;
    this.owner = null;
    this.x = x;
    this.groundY = groundY;
    this.displayY = groundY;
  }

  /**
   * 武器を破壊する
   */
  destroy() {
    this.alive = false;
    this.isHeld = false;
    this.owner = null;
    this.durability = 0;
  }

  /**
   * 武器の状態を更新する
   * @param {number} time - 経過時間
   * @param {number} delta - フレーム時間差
   */
  update(time, delta) {
    if (!this.alive) return;
    
    // 所有者がいる場合は位置を同期
    if (this.isHeld && this.owner) {
      this.x = this.owner.x;
      this.groundY = this.owner.groundY;
      this.displayY = this.owner.displayY || this.owner.groundY;
    }
  }

  /**
   * 武器の情報を取得
   * @returns {Object} 武器の状態情報
   */
  getInfo() {
    return {
      type: this.type,
      name: this.name,
      damage: this.damage,
      range: this.range,
      durability: this.durability,
      maxDurability: this.maxDurability,
      isHeld: this.isHeld,
      bossWeakness: this.bossWeakness,
      alive: this.alive,
    };
  }

  /**
   * 武器が使用可能かどうか
   * @returns {boolean}
   */
  isUsable() {
    return this.alive && this.durability > 0;
  }

  /**
   * 特殊技が使用可能かどうか
   * @returns {boolean}
   */
  canUseSpecial() {
    return this.alive && this.durability >= 2;
  }

  /**
   * 武器の耐久度パーセンテージを取得
   * @returns {number} 0-1の範囲
   */
  getDurabilityPercentage() {
    return this.maxDurability > 0 ? this.durability / this.maxDurability : 0;
  }

  /**
   * 武器をコピーする（主にテスト用）
   * @returns {Weapon}
   */
  clone() {
    const cloned = new Weapon(this.type, this.x, this.groundY);
    cloned.durability = this.durability;
    return cloned;
  }
}

/**
 * 武器ファクトリー関数
 * @param {string} type - 武器タイプ
 * @param {number} x - X座標
 * @param {number} groundY - Y座標
 * @returns {Weapon|null}
 */
export function createWeapon(type, x = 0, groundY = 0) {
  try {
    return new Weapon(type, x, groundY);
  } catch (error) {
    console.error('Failed to create weapon:', error);
    return null;
  }
}

/**
 * 利用可能な武器タイプ一覧を取得
 * @returns {string[]}
 */
export function getAvailableWeaponTypes() {
  return Object.keys(WEAPON_DEFS);
}

/**
 * 武器定義を取得
 * @param {string} type - 武器タイプ
 * @returns {Object|null}
 */
export function getWeaponDefinition(type) {
  return WEAPON_DEFS[type] || null;
}