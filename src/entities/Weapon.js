import { WEAPON_DEFS } from '../data/weapons.js';

export class Weapon {
  constructor(type, scene, x, y) {
    if (!WEAPON_DEFS[type]) {
      throw new Error(`Unknown weapon type: ${type}`);
    }

    const def = WEAPON_DEFS[type];
    
    this.type = type;
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.durability = def.maxDurability;
    this.maxDurability = def.maxDurability;
    this.bossWeakness = def.bossWeakness;
    this.scene = scene;
    
    // Phaserスプライト作成（開発初期は矩形）
    this.sprite = scene.add.rectangle(x, y, 32, 16, 0xffaa00);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setImmovable(true);
    
    // 拾える状態フラグ
    this.pickupable = true;
    this.held = false;
    
    // 参照保持
    this.sprite.weaponRef = this;
  }

  /**
   * 武器を使用（通常攻撃）
   * @returns {boolean} 破壊されたかどうか
   */
  use() {
    if (this.durability <= 0) {
      return true;
    }
    
    this.durability--;
    
    // 耐久度が0になったら破壊
    if (this.durability <= 0) {
      return true;
    }
    
    return false;
  }

  /**
   * 特殊技を使用
   * @param {Player} owner - 武器の所有者
   * @returns {boolean} 破壊されたかどうか
   */
  useSpecial(owner) {
    if (this.durability <= 0) {
      return true;
    }

    // 特殊技実行
    const def = WEAPON_DEFS[this.type];
    if (def.special) {
      def.special(this.scene, owner);
    }

    // 特殊技は耐久度を2消費
    this.durability = Math.max(0, this.durability - 2);
    
    return this.durability <= 0;
  }

  /**
   * 武器を拾う処理
   * @param {Player} player - プレイヤー
   */
  pickup(player) {
    if (!this.pickupable || this.held) {
      return false;
    }

    this.held = true;
    this.pickupable = false;
    
    // スプライトを非表示にして物理判定を無効化
    this.sprite.setVisible(false);
    this.sprite.body.enable = false;
    
    return true;
  }

  /**
   * 武器をドロップ処理
   * @param {number} x - ドロップ位置X
   * @param {number} y - ドロップ位置Y
   */
  drop(x, y) {
    if (!this.held) {
      return;
    }

    this.held = false;
    this.pickupable = true;
    
    // スプライトを再表示して物理判定を有効化
    this.sprite.setPosition(x, y);
    this.sprite.setVisible(true);
    this.sprite.body.enable = true;
  }

  /**
   * 武器を破壊
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /**
   * 耐久度の割合を取得
   * @returns {number} 0.0-1.0の耐久度割合
   */
  getDurabilityRatio() {
    return this.durability / this.maxDurability;
  }
}