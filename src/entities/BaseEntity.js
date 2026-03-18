import { DEPTH_THRESHOLD, ENTITY_TYPES } from './IEntity.js';

/**
 * エンティティの基底クラス
 * 共通プロパティとメソッドの実装を提供
 */
export class BaseEntity {
  /**
   * @param {Object} config - エンティティ設定
   * @param {number} config.x - 初期X座標
   * @param {number} config.y - 初期Y座標
   * @param {number} config.hp - 初期HP
   * @param {string} config.type - エンティティタイプ
   * @param {Phaser.Scene} scene - 所属するPhaserシーン
   */
  constructor(config, scene) {
    // 基本プロパティ
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.groundY = config.y || 0; // 初期値はyと同じ
    this.hp = config.hp || 100;
    this.maxHp = config.hp || 100;
    this.alive = true;
    this.active = true;
    this.type = config.type || ENTITY_TYPES.ENEMY;

    // Phaserシーンの参照
    this.scene = scene;
    
    // 物理・描画用スプライト（継承先で設定）
    this.sprite = null;
    this.hitbox = null;

    // 状態管理
    this.invincible = false;
    this.invincibleTimer = 0;
    this.knockbackVelocity = { x: 0, y: 0 };
    this.knockbackTimer = 0;

    // デバッグ用
    this._debugColor = this._getDebugColor();
  }

  /**
   * 毎フレーム更新処理
   * 継承先でオーバーライドして具体的な処理を実装
   * @param {number} time - ゲーム開始からの経過時間（ms）
   * @param {number} delta - 前フレームからの経過時間（ms）
   */
  update(time, delta) {
    if (!this.active) return;

    // 無敵時間の管理
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }

    // ノックバック処理
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      if (this.knockbackTimer <= 0) {
        this.knockbackVelocity = { x: 0, y: 0 };
        if (this.sprite && this.sprite.body) {
          this.sprite.body.setVelocity(0, 0);
        }
      }
    }

    // 座標同期
    this._syncPosition();

    // HP管理
    if (this.hp <= 0 && this.alive) {
      this.onDeath();
    }
  }

  /**
   * ダメージを受ける処理
   * @param {number} amount - ダメージ量
   * @param {Object} [knockback] - ノックバック情報
   * @param {string} [weaponType] - 攻撃した武器タイプ
   */
  takeDamage(amount, knockback = null, weaponType = null) {
    if (!this.alive || this.invincible) return;

    // ダメージ計算（継承先でオーバーライド可能）
    const finalDamage = this._calculateDamage(amount, weaponType);
    this.hp = Math.max(0, this.hp - finalDamage);

    // ノックバック適用
    if (knockback && this.sprite && this.sprite.body) {
      this.knockbackVelocity = { x: knockback.x || 0, y: knockback.y || 0 };
      this.knockbackTimer = 200; // 200ms
      this.sprite.body.setVelocity(knockback.x || 0, knockback.y || 0);
    }

    // 無敵時間設定
    this.invincible = true;
    this.invincibleTimer = 150; // 150ms

    // ダメージ演出
    this._showDamageEffect(finalDamage);

    // ダメージイベント発火
    this.onDamage(finalDamage, weaponType);
  }

  /**
   * 他のエンティティとの奥行き判定
   * @param {BaseEntity} other - 判定対象
   * @returns {boolean} 奥行きが一致しているか
   */
  isDepthAligned(other) {
    return Math.abs(this.groundY - other.groundY) < DEPTH_THRESHOLD;
  }

  /**
   * エンティティの破棄処理
   */
  destroy() {
    this.alive = false;
    this.active = false;

    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }

    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }

    this.onDestroy();
  }

  /**
   * 座標同期処理（内部用）
   * @private
   */
  _syncPosition() {
    if (this.sprite) {
      this.x = this.sprite.x;
      this.y = this.sprite.y;
    }
    
    if (this.hitbox) {
      this.hitbox.x = this.x;
      this.hitbox.y = this.groundY;
    }
  }

  /**
   * ダメージ計算（継承先でオーバーライド可能）
   * @param {number} amount - 基本ダメージ量
   * @param {string} weaponType - 武器タイプ
   * @returns {number} 最終ダメージ量
   * @protected
   */
  _calculateDamage(amount, weaponType) {
    return amount;
  }

  /**
   * ダメージエフェクト表示
   * @param {number} damage - ダメージ量
   * @private
   */
  _showDamageEffect(damage) {
    if (!this.sprite) return;

    // 点滅エフェクト
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 50,
      yoyo: true,
      repeat: 2
    });

    // ダメージ数値表示（簡易版）
    const damageText = this.scene.add.text(
      this.x, 
      this.y - 30, 
      damage.toString(), 
      { 
        fontSize: '16px', 
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2
      }
    );

    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => damageText.destroy()
    });
  }

  /**
   * デバッグ用色取得
   * @returns {number} 16進数カラーコード
   * @private
   */
  _getDebugColor() {
    const colors = {
      [ENTITY_TYPES.PLAYER]: 0x00ff00,
      [ENTITY_TYPES.ENEMY]: 0xff0000,
      [ENTITY_TYPES.BOSS]: 0xff4400,
      [ENTITY_TYPES.WEAPON]: 0xffff00,
      [ENTITY_TYPES.PROJECTILE]: 0x00ffff
    };
    return colors[this.type] || 0xffffff;
  }

  // ライフサイクルイベント（継承先でオーバーライド）

  /**
   * ダメージを受けた時のイベント
   * @param {number} damage - 受けたダメージ量
   * @param {string} weaponType - 攻撃した武器タイプ
   */
  onDamage(damage, weaponType) {
    // 継承先で実装
  }

  /**
   * 死亡時のイベント
   */
  onDeath() {
    this.alive = false;
    // 継承先で具体的な死亡処理を実装
  }

  /**
   * 破棄時のイベント
   */
  onDestroy() {
    // 継承先で実装
  }

  // Getter/Setter

  /**
   * 現在のHP割合を取得
   * @returns {number} HP割合（0.0〜1.0）
   */
  get hpRatio() {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }

  /**
   * 中心座標を取得
   * @returns {Object} 中心座標 {x, y}
   */
  get center() {
    return {
      x: this.x,
      y: this.groundY
    };
  }

  /**
   * エンティティが画面内にいるかチェック
   * @param {Phaser.Cameras.Scene2D.Camera} camera - カメラ
   * @returns {boolean} 画面内にいるか
   */
  isOnScreen(camera) {
    const margin = 100; // 画面外余白
    return this.x >= camera.scrollX - margin && 
           this.x <= camera.scrollX + camera.width + margin;
  }
}