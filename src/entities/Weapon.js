export class Weapon {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.y = y;
    
    // 武器定義から設定を読み込み
    const def = this.scene.weaponDefs[type];
    if (!def) {
      throw new Error(`Unknown weapon type: ${type}`);
    }
    
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.durability = def.maxDurability;
    this.maxDurability = def.maxDurability;
    this.bossWeakness = def.bossWeakness || false;
    this.specialAction = def.special;
    
    // Phaserスプライト作成（開発初期は矩形）
    this.sprite = scene.add.rectangle(x, y, 32, 16, 0x8B4513);
    this.sprite.setStrokeStyle(2, 0x654321);
    
    // 物理ボディ追加（拾得判定用）
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(32, 16);
    
    // 武器オブジェクトの参照を保持
    this.sprite.weaponData = this;
    
    this.isPickedUp = false;
    this.holder = null;
  }
  
  /**
   * 武器を使用する（通常攻撃）
   * @returns {boolean} 武器が破壊されたかどうか
   */
  use() {
    if (this.durability <= 0) {
      return true;
    }
    
    this.durability--;
    
    // 武器耐久度更新をUIに通知
    this.scene.events.emit('weaponDurabilityChange', {
      name: this.name,
      durability: this.durability,
      maxDurability: this.maxDurability
    });
    
    return this.durability <= 0;
  }
  
  /**
   * 特殊技を使用する
   * @returns {boolean} 武器が破壊されたかどうか
   */
  useSpecial() {
    if (this.durability <= 0) {
      return true;
    }
    
    // 特殊技実行
    if (this.specialAction && this.holder) {
      this.specialAction(this.scene, this.holder);
    }
    
    // 特殊技は耐久度を2消費
    this.durability = Math.max(0, this.durability - 2);
    
    // 武器耐久度更新をUIに通知
    this.scene.events.emit('weaponDurabilityChange', {
      name: this.name,
      durability: this.durability,
      maxDurability: this.maxDurability
    });
    
    return this.durability <= 0;
  }
  
  /**
   * 武器を拾得する
   * @param {Player} player 拾得するプレイヤー
   */
  pickUp(player) {
    if (this.isPickedUp) return;
    
    this.isPickedUp = true;
    this.holder = player;
    
    // スプライトを非表示にして物理ボディを無効化
    this.sprite.setVisible(false);
    this.sprite.body.enable = false;
    
    // プレイヤーに武器装備を通知
    player.equipWeapon(this);
    
    // UI更新イベント発火
    this.scene.events.emit('weaponPickup', {
      name: this.name,
      durability: this.durability,
      maxDurability: this.maxDurability
    });
  }
  
  /**
   * 武器を破棄する
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    
    if (this.holder) {
      this.holder.dropWeapon();
    }
  }
  
  /**
   * 武器をドロップする
   * @param {number} x ドロップするX座標
   * @param {number} y ドロップするY座標
   */
  drop(x, y) {
    if (!this.isPickedUp) return;
    
    this.isPickedUp = false;
    this.holder = null;
    
    // 新しい位置に配置
    this.sprite.setPosition(x, y);
    this.sprite.setVisible(true);
    this.sprite.body.enable = true;
    
    // 少し弾むような効果
    this.sprite.body.setVelocity(
      Phaser.Math.Between(-100, 100),
      Phaser.Math.Between(-50, 0)
    );
  }
}