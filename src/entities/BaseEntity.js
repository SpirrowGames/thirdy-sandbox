/**
 * ベースエンティティクラス - 全てのゲームエンティティが継承する基底クラス
 * IEntityインターフェースの実装を提供する
 */
class BaseEntity {
  constructor(scene, x = 0, y = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y; // デフォルトでは表示Yと同じ
    this.hp = 100;
    this.maxHp = 100;
    this.alive = true;
    
    // 描画用スプライト（派生クラスで設定）
    this.sprite = null;
    
    // 物理ボディ（派生クラスで設定）
    this.body = null;
    
    // 無敵フレーム
    this.invincible = false;
    this.invincibleTimer = 0;
    this.INVINCIBLE_DURATION = 500; // ms
    
    // ヒットストップ
    this.hitStopTimer = 0;
    
    // ノックバック
    this.knockbackVelocity = { x: 0, y: 0 };
    this.knockbackTimer = 0;
    this.KNOCKBACK_DURATION = 200; // ms
  }

  /**
   * 毎フレーム更新処理
   * @param {number} time - 経過時間（ms）
   * @param {number} delta - 前フレームからの差分（ms）
   */
  update(time, delta) {
    if (!this.alive) return;
    
    this.updateInvincibility(delta);
    this.updateHitStop(delta);
    this.updateKnockback(delta);
    
    // 派生クラスでオーバーライドする
    this.updateBehavior(time, delta);
    
    // スプライトの位置を同期
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    }
  }

  /**
   * 派生クラスでオーバーライドする更新処理
   * @param {number} time - 経過時間（ms）
   * @param {number} delta - 前フレームからの差分（ms）
   */
  updateBehavior(time, delta) {
    // 派生クラスで実装
  }

  /**
   * ダメージを受ける処理
   * @param {number} amount - ダメージ量
   * @param {Object} options - オプション設定
   * @param {number} options.sourceX - 攻撃元のX座標（ノックバック方向決定用）
   * @param {number} options.knockbackForce - ノックバック強度
   * @param {string} options.weaponType - 武器タイプ（弱点判定用）
   */
  takeDamage(amount, options = {}) {
    if (!this.alive || this.invincible) return false;

    const {
      sourceX = null,
      knockbackForce = 300,
      weaponType = null
    } = options;

    // ダメージ計算（派生クラスでオーバーライド可能）
    const finalDamage = this.calculateDamage(amount, weaponType);
    
    this.hp -= finalDamage;
    
    // ノックバック処理
    if (sourceX !== null) {
      this.applyKnockback(sourceX, knockbackForce);
    }
    
    // 無敵フレーム開始
    this.startInvincibility();
    
    // HP が 0 以下になったら死亡処理
    if (this.hp <= 0) {
      this.hp = 0;
      this.onDeath();
    } else {
      this.onHurt(finalDamage);
    }
    
    return true;
  }

  /**
   * ダメージ計算（派生クラスでオーバーライド可能）
   * @param {number} baseDamage - 基本ダメージ
   * @param {string} weaponType - 武器タイプ
   * @returns {number} 最終ダメージ
   */
  calculateDamage(baseDamage, weaponType) {
    return baseDamage;
  }

  /**
   * ノックバック適用
   * @param {number} sourceX - 攻撃元のX座標
   * @param {number} force - ノックバック強度
   */
  applyKnockback(sourceX, force) {
    const direction = this.x > sourceX ? 1 : -1;
    this.knockbackVelocity.x = direction * force;
    this.knockbackTimer = this.KNOCKBACK_DURATION;
    
    // 物理ボディがある場合は速度を設定
    if (this.body && this.body.setVelocityX) {
      this.body.setVelocityX(this.knockbackVelocity.x);
    }
  }

  /**
   * 無敵フレーム開始
   */
  startInvincibility() {
    this.invincible = true;
    this.invincibleTimer = this.INVINCIBLE_DURATION;
    
    // 点滅エフェクト
    if (this.sprite) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: Math.floor(this.INVINCIBLE_DURATION / 200) - 1,
        onComplete: () => {
          this.sprite.alpha = 1;
        }
      });
    }
  }

  /**
   * ヒットストップ開始
   * @param {number} duration - ヒットストップ時間（ms）
   */
  startHitStop(duration = 80) {
    this.hitStopTimer = duration;
    
    // シーンレベルでヒットストップを適用
    if (this.scene.hitStop) {
      this.scene.hitStop(duration);
    }
  }

  /**
   * 無敵フレーム更新
   * @param {number} delta - フレーム差分時間
   */
  updateInvincibility(delta) {
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }
  }

  /**
   * ヒットストップ更新
   * @param {number} delta - フレーム差分時間
   */
  updateHitStop(delta) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= delta;
      return true; // ヒットストップ中は他の更新をスキップ
    }
    return false;
  }

  /**
   * ノックバック更新
   * @param {number} delta - フレーム差分時間
   */
  updateKnockback(delta) {
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      
      if (this.knockbackTimer <= 0) {
        // ノックバック終了
        this.knockbackVelocity.x = 0;
        this.knockbackVelocity.y = 0;
        
        if (this.body && this.body.setVelocityX) {
          this.body.setVelocityX(0);
        }
      }
    }
  }

  /**
   * 被ダメージ時のコールバック（派生クラスでオーバーライド）
   * @param {number} damage - 受けたダメージ量
   */
  onHurt(damage) {
    // 派生クラスで実装（状態変更、エフェクト再生等）
  }

  /**
   * 死亡時のコールバック（派生クラスでオーバーライド）
   */
  onDeath() {
    this.alive = false;
    // 派生クラスで実装（死亡アニメーション、アイテムドロップ等）
  }

  /**
   * エンティティの破棄処理
   */
  destroy() {
    this.alive = false;
    
    // スプライトの破棄
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    // 物理ボディの破棄
    if (this.body) {
      this.body.destroy();
      this.body = null;
    }
    
    // 派生クラスでの追加破棄処理
    this.onDestroy();
  }

  /**
   * 破棄時のコールバック（派生クラスでオーバーライド）
   */
  onDestroy() {
    // 派生クラスで実装
  }

  /**
   * 奥行き判定用のY座標を取得
   * @returns {number} 奥行き判定用のY座標
   */
  getGroundY() {
    return this.groundY;
  }

  /**
   * 奥行き判定用のY座標を設定
   * @param {number} y - 設定するY座標
   */
  setGroundY(y) {
    this.groundY = y;
  }

  /**
   * エンティティの境界ボックスを取得
   * @returns {Object} {x, y, width, height}
   */
  getBounds() {
    if (this.sprite) {
      return this.sprite.getBounds();
    }
    // デフォルトサイズ
    return {
      x: this.x - 24,
      y: this.y - 32,
      width: 48,
      height: 64
    };
  }

  /**
   * 他のエンティティとの距離を計算
   * @param {BaseEntity} other - 対象エンティティ
   * @returns {number} 距離（px）
   */
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.groundY - other.groundY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 他のエンティティとの奥行き判定
   * @param {BaseEntity} other - 対象エンティティ
   * @param {number} threshold - 判定閾値（デフォルト: 40px）
   * @returns {boolean} 奥行きが一致するかどうか
   */
  isDepthAligned(other, threshold = 40) {
    return Math.abs(this.groundY - other.groundY) < threshold;
  }

  /**
   * エンティティの状態情報を取得（デバッグ用）
   * @returns {Object} 状態情報
   */
  getDebugInfo() {
    return {
      x: this.x,
      y: this.y,
      groundY: this.groundY,
      hp: this.hp,
      maxHp: this.maxHp,
      alive: this.alive,
      invincible: this.invincible,
      invincibleTimer: this.invincibleTimer,
      hitStopTimer: this.hitStopTimer,
      knockbackTimer: this.knockbackTimer
    };
  }
}

export default BaseEntity;