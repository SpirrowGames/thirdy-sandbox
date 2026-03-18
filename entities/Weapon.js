import { WEAPON_DEFS } from '../data/weapons.js';

export class Weapon {
  constructor(type, scene, x = 0, y = 0) {
    if (!WEAPON_DEFS[type]) {
      throw new Error(`Unknown weapon type: ${type}`);
    }
    
    this.scene = scene;
    this.type = type;
    this.definition = WEAPON_DEFS[type];
    
    // 基本プロパティを定義から初期化
    this.name = this.definition.name;
    this.damage = this.definition.damage;
    this.range = this.definition.range;
    this.durability = this.definition.maxDurability;
    this.maxDurability = this.definition.maxDurability;
    this.bossWeakness = this.definition.bossWeakness;
    
    // 状態管理
    this.isHeld = false;
    this.owner = null;
    this.canUseSpecial = true;
    this.specialCooldown = 0;
    
    // Phaserスプライト作成（地面に落ちている状態）
    this.sprite = scene.add.sprite(x, y, this.definition.sprite);
    this.sprite.setScale(0.8);
    this.sprite.setDepth(1);
    
    // 物理ボディ追加（拾えるようにする）
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(32, 16); // 拾いやすいサイズに調整
    
    // 武器オブジェクト参照を保持
    this.sprite.weaponRef = this;
    
    // 地面に落ちている時のアニメーション（ゆっくり点滅）
    scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.7 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
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
    this.emitDurabilityChange();
    
    // ヒットエフェクト表示
    this.showHitEffect();
    
    if (this.durability <= 0) {
      this.break();
      return true;
    }
    
    return false;
  }

  /**
   * 特殊技を使用する
   * @returns {boolean} 特殊技が実行されたかどうか
   */
  useSpecial() {
    if (!this.canUseSpecial || this.specialCooldown > 0) {
      return false;
    }
    
    const specialCost = this.definition.special.cost;
    if (this.durability < specialCost) {
      return false;
    }
    
    // 特殊技実行
    this.definition.special.execute(this.scene, this.owner);
    
    // 耐久度消費
    this.durability -= specialCost;
    this.emitDurabilityChange();
    
    // クールダウン設定（特殊技の連発を防ぐ）
    this.specialCooldown = 1000; // 1秒
    this.canUseSpecial = false;
    
    // 特殊技エフェクト
    this.showSpecialEffect();
    
    // 破壊チェック
    if (this.durability <= 0) {
      this.break();
      return true;
    }
    
    return true;
  }

  /**
   * プレイヤーに拾われる
   * @param {Player} player - 拾ったプレイヤー
   */
  pickUp(player) {
    if (this.isHeld) return;
    
    this.isHeld = true;
    this.owner = player;
    
    // スプライトを非表示にして物理ボディを無効化
    this.sprite.setVisible(false);
    this.sprite.body.setEnable(false);
    
    // 拾った時のSE
    this.scene.sound.play('weapon_pickup', { volume: 0.3 });
    
    // UIに武器情報を通知
    this.scene.events.emit('weaponPickup', {
      name: this.name,
      durability: this.durability,
      maxDurability: this.maxDurability,
      canUseSpecial: this.canUseSpecial,
      specialName: this.definition.special.name
    });
  }

  /**
   * 武器を投げる（掴み投げ時）
   * @param {number} targetX - 投げる方向のX座標
   * @param {number} targetY - 投げる方向のY座標
   */
  throw(targetX, targetY) {
    if (!this.isHeld) return;
    
    this.isHeld = false;
    this.owner = null;
    
    // スプライトを再表示
    this.sprite.setVisible(true);
    this.sprite.body.setEnable(true);
    
    // 投げる方向を計算
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, targetX, targetY
    );
    
    // 物理的な投擲
    const velocity = 400;
    this.sprite.body.setVelocity(
      Math.cos(angle) * velocity,
      Math.sin(angle) * velocity
    );
    
    // 回転アニメーション
    this.scene.tweens.add({
      targets: this.sprite,
      rotation: angle + Math.PI * 4,
      duration: 1000,
      ease: 'Quad.easeOut'
    });
    
    // 着地後に停止
    this.scene.time.delayedCall(1000, () => {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.setRotation(0);
    });
    
    // 投げられた武器は即座に耐久度を1消費
    this.use();
  }

  /**
   * 武器が破壊される
   */
  break() {
    // 破壊エフェクト
    this.showBreakEffect();
    
    // SE再生
    this.scene.sound.play('weapon_break', { volume: 0.4 });
    
    // UIに破壊を通知
    this.scene.events.emit('weaponBreak', { name: this.name });
    
    // 持ち主から武器を削除
    if (this.owner) {
      this.owner.dropWeapon();
    }
    
    // 遅延後にオブジェクトを破棄
    this.scene.time.delayedCall(500, () => {
      this.destroy();
    });
  }

  /**
   * 更新処理（毎フレーム）
   * @param {number} time - 経過時間
   * @param {number} delta - フレーム間隔
   */
  update(time, delta) {
    // クールダウン管理
    if (this.specialCooldown > 0) {
      this.specialCooldown -= delta;
      if (this.specialCooldown <= 0) {
        this.specialCooldown = 0;
        this.canUseSpecial = true;
      }
    }
    
    // 地面に落ちている武器の耐久度自然回復（オプション機能）
    if (!this.isHeld && this.durability < this.maxDurability) {
      // 5秒ごとに1回復
      if (time % 5000 < delta) {
        this.durability = Math.min(this.durability + 1, this.maxDurability);
      }
    }
  }

  /**
   * ヒットエフェクトを表示
   */
  showHitEffect() {
    if (!this.owner) return;
    
    const effectX = this.owner.x + (this.owner.facingRight ? 60 : -60);
    const effectY = this.owner.y - 20;
    
    const effect = this.scene.add.sprite(effectX, effectY, this.definition.hitEffect);
    effect.setScale(0.8);
    effect.play(this.definition.hitEffect + '_anim');
    
    // エフェクト終了後に削除
    effect.on('animationcomplete', () => {
      effect.destroy();
    });
  }

  /**
   * 特殊技エフェクトを表示
   */
  showSpecialEffect() {
    if (!this.owner) return;
    
    // 武器種別ごとの特殊エフェクト
    const effectName = `${this.type}_special`;
    const effect = this.scene.add.sprite(this.owner.x, this.owner.y - 30, effectName);
    effect.setScale(1.2);
    effect.play(effectName + '_anim');
    
    effect.on('animationcomplete', () => {
      effect.destroy();
    });
  }

  /**
   * 破壊エフェクトを表示
   */
  showBreakEffect() {
    const effect = this.scene.add.sprite(
      this.sprite.x, this.sprite.y, this.definition.breakEffect
    );
    effect.setScale(1.0);
    effect.play(this.definition.breakEffect + '_anim');
    
    effect.on('animationcomplete', () => {
      effect.destroy();
    });
  }

  /**
   * 耐久度変更をUIに通知
   */
  emitDurabilityChange() {
    if (this.isHeld) {
      this.scene.events.emit('weaponDurabilityChange', {
        durability: this.durability,
        maxDurability: this.maxDurability,
        ratio: this.durability / this.maxDurability
      });
    }
  }

  /**
   * 武器オブジェクトを破棄
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    this.owner = null;
    this.scene = null;
  }

  /**
   * 武器の情報を取得
   * @returns {Object} 武器情報オブジェクト
   */
  getInfo() {
    return {
      type: this.type,
      name: this.name,
      damage: this.damage,
      range: this.range,
      durability: this.durability,
      maxDurability: this.maxDurability,
      bossWeakness: this.bossWeakness,
      canUseSpecial: this.canUseSpecial,
      specialCooldown: this.specialCooldown,
      specialName: this.definition.special.name,
      specialDescription: this.definition.special.description
    };
  }

  /**
   * 武器のデバッグ情報を取得
   * @returns {string} デバッグ文字列
   */
  getDebugInfo() {
    return `${this.name} (${this.durability}/${this.maxDurability}) - ${this.isHeld ? 'HELD' : 'DROPPED'}`;
  }
}