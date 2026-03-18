import { WEAPON_DEFS } from '../data/weapons.js';

/**
 * 拾える武器エンティティ
 * 耐久度管理、使用・特殊技メソッドを提供
 */
export class Weapon {
  /**
   * @param {string} type - 武器タイプ（WEAPON_DEFSのキー）
   * @param {number} x - 初期X座標
   * @param {number} groundY - 初期Y座標（奥行き判定用）
   */
  constructor(type, x = 0, groundY = 0) {
    if (!WEAPON_DEFS[type]) {
      throw new Error(`Unknown weapon type: ${type}`);
    }

    const def = WEAPON_DEFS[type];
    
    // 武器データ
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
    
    // 状態
    this.alive = true;
    this.pickedUp = false;
    
    // Phaserスプライト（後で設定）
    this.sprite = null;
  }

  /**
   * 武器を通常使用する
   * @returns {boolean} true: 武器が破壊された, false: まだ使用可能
   */
  use() {
    if (this.durability <= 0) {
      console.warn(`Weapon ${this.name} is already broken`);
      return true;
    }

    this.durability--;
    
    if (this.durability <= 0) {
      this.alive = false;
      return true; // 破壊された
    }
    
    return false; // まだ使用可能
  }

  /**
   * 武器の特殊技を使用する
   * @param {Phaser.Scene} scene - 実行するシーン
   * @param {Object} owner - 武器を持つエンティティ
   * @returns {boolean} true: 武器が破壊された, false: まだ使用可能
   */
  useSpecial(scene, owner) {
    if (this.durability <= 0) {
      console.warn(`Weapon ${this.name} is already broken`);
      return true;
    }

    if (!scene || !owner) {
      throw new Error('Scene and owner are required for special attack');
    }

    try {
      // 特殊技を実行
      const def = WEAPON_DEFS[this.type];
      def.special(scene, owner);
      
      // 特殊技は耐久度を2消費
      this.durability = Math.max(0, this.durability - 2);
      
      if (this.durability <= 0) {
        this.alive = false;
        return true; // 破壊された
      }
      
      return false; // まだ使用可能
    } catch (error) {
      console.error(`Error executing special attack for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * 武器の耐久度割合を取得
   * @returns {number} 0.0〜1.0の割合
   */
  getDurabilityRatio() {
    return this.maxDurability > 0 ? this.durability / this.maxDurability : 0;
  }

  /**
   * 武器が使用可能かチェック
   * @returns {boolean}
   */
  isUsable() {
    return this.alive && this.durability > 0;
  }

  /**
   * 武器が特殊技使用可能かチェック
   * @returns {boolean}
   */
  canUseSpecial() {
    return this.alive && this.durability >= 2;
  }

  /**
   * 武器を修理する（デバッグ・チート用）
   * @param {number} amount - 修理量（省略時は最大まで修理）
   */
  repair(amount = null) {
    if (amount === null) {
      this.durability = this.maxDurability;
    } else {
      this.durability = Math.min(this.maxDurability, this.durability + amount);
    }
    
    if (this.durability > 0) {
      this.alive = true;
    }
  }

  /**
   * 武器の状態を文字列で取得（デバッグ用）
   * @returns {string}
   */
  getStatusString() {
    return `${this.name} (${this.durability}/${this.maxDurability})`;
  }

  /**
   * 武器を破棄する
   */
  destroy() {
    this.alive = false;
    this.durability = 0;
    
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /**
   * Phaserスプライトを設定する
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  setSprite(sprite) {
    this.sprite = sprite;
    if (sprite) {
      sprite.x = this.x;
      sprite.y = this.displayY;
    }
  }

  /**
   * 武器の位置を更新する
   * @param {number} x
   * @param {number} groundY
   */
  setPosition(x, groundY) {
    this.x = x;
    this.groundY = groundY;
    this.displayY = groundY;
    
    if (this.sprite) {
      this.sprite.x = x;
      this.sprite.y = groundY;
    }
  }
}

/**
 * 武器ファクトリ関数
 * @param {string} type - 武器タイプ
 * @param {number} x - X座標
 * @param {number} groundY - Y座標
 * @returns {Weapon}
 */
export function createWeapon(type, x = 0, groundY = 0) {
  return new Weapon(type, x, groundY);
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
 * @param {string} type
 * @returns {WeaponDef|null}
 */
export function getWeaponDef(type) {
  return WEAPON_DEFS[type] || null;
}