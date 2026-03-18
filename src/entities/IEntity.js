/**
 * 全エンティティが実装すべき基底インターフェース
 * ゲーム内のすべてのオブジェクト（プレイヤー、敵、武器など）の共通仕様
 */
export class IEntity {
  constructor(scene, x, y, groundY = null) {
    if (new.target === IEntity) {
      throw new Error('IEntityは抽象クラスです。直接インスタンス化できません。');
    }

    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = groundY !== null ? groundY : y; // 奥行き判定用Y座標（ジャンプ中も固定）
    this.displayY = y; // 描画用Y座標（ジャンプ時に変動）
    
    this.hp = 100;
    this.maxHp = 100;
    this.alive = true;
    
    // Phaserスプライトオブジェクト（継承クラスで設定）
    this.sprite = null;
    this.hitbox = null; // 当たり判定用オブジェクト
    
    // 状態管理
    this.invincible = false;
    this.invincibleTimer = 0;
    
    // 方向（true: 右向き, false: 左向き）
    this.facingRight = true;
  }

  /**
   * 毎フレーム更新処理
   * @param {number} time - 経過時間（ms）
   * @param {number} delta - 前フレームからの差分時間（ms）
   */
  update(time, delta) {
    // 無敵時間の更新
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.setAlpha(1.0);
      } else {
        // 点滅エフェクト
        const alpha = Math.sin(time * 0.02) > 0 ? 0.5 : 1.0;
        this.setAlpha(alpha);
      }
    }

    // 継承クラスでオーバーライドする
    this.updateLogic(time, delta);
    
    // スプライトの位置を更新
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.displayY;
      this.sprite.setFlipX(!this.facingRight);
    }
    
    // 当たり判定の位置を更新
    if (this.hitbox) {
      this.hitbox.x = this.x;
      this.hitbox.y = this.groundY;
    }
  }

  /**
   * エンティティ固有の更新ロジック
   * 継承クラスでオーバーライドして実装する
   * @param {number} time - 経過時間（ms）
   * @param {number} delta - 前フレームからの差分時間（ms）
   */
  updateLogic(time, delta) {
    throw new Error('updateLogicメソッドは継承クラスで実装してください。');
  }

  /**
   * ダメージを受ける処理
   * @param {number} amount - ダメージ量
   * @param {Object} options - オプション設定
   * @param {number} options.sourceX - 攻撃元のX座標（ノックバック計算用）
   * @param {string} options.weaponType - 武器タイプ（弱点計算用）
   * @param {boolean} options.ignoreInvincible - 無敵状態を無視するか
   */
  takeDamage(amount, options = {}) {
    if (!this.alive) return false;
    if (this.invincible && !options.ignoreInvincible) return false;

    // ダメージ計算（継承クラスでオーバーライド可能）
    const finalDamage = this.calculateDamage(amount, options);
    
    this.hp -= finalDamage;
    this.hp = Math.max(0, this.hp);

    // ノックバック処理
    if (options.sourceX !== undefined) {
      this.applyKnockback(options.sourceX);
    }

    // 無敵時間設定
    this.setInvincible(300); // 300ms

    // HPが0になった場合の処理
    if (this.hp <= 0) {
      this.onDeath();
      return true; // 死亡を示す
    }

    // ダメージエフェクト
    this.showDamageEffect(finalDamage);
    return false;
  }

  /**
   * ダメージ計算（継承クラスでオーバーライド可能）
   * @param {number} baseDamage - 基本ダメージ
   * @param {Object} options - オプション
   * @returns {number} 最終ダメージ
   */
  calculateDamage(baseDamage, options) {
    return baseDamage;
  }

  /**
   * ノックバック適用
   * @param {number} sourceX - 攻撃元のX座標
   * @param {number} force - ノックバック力（デフォルト300）
   */
  applyKnockback(sourceX, force = 300) {
    if (!this.sprite || !this.sprite.body) return;

    const direction = this.x > sourceX ? 1 : -1;
    this.sprite.body.setVelocityX(direction * force);
    
    // 200ms後に速度をリセット
    this.scene.time.delayedCall(200, () => {
      if (this.sprite && this.sprite.body) {
        this.sprite.body.setVelocityX(0);
      }
    });
  }

  /**
   * 無敵状態設定
   * @param {number} duration - 無敵時間（ms）
   */
  setInvincible(duration) {
    this.invincible = true;
    this.invincibleTimer = duration;
  }

  /**
   * 死亡時処理
   */
  onDeath() {
    this.alive = false;
    this.onDeathEffect();
    
    // 少し遅延してから破棄
    this.scene.time.delayedCall(500, () => {
      this.destroy();
    });
  }

  /**
   * 死亡エフェクト（継承クラスでオーバーライド可能）
   */
  onDeathEffect() {
    if (this.sprite) {
      // 点滅エフェクト
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 300,
        ease: 'Power2'
      });
    }
  }

  /**
   * ダメージ表示エフェクト
   * @param {number} damage - ダメージ量
   */
  showDamageEffect(damage) {
    // ダメージ数値の表示
    const damageText = this.scene.add.text(
      this.x, this.displayY - 50, 
      `-${damage}`, 
      { 
        fontSize: '16px', 
        fill: '#ff0000',
        stroke: '#ffffff',
        strokeThickness: 2
      }
    );

    // 上に浮かび上がるアニメーション
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });

    // 本体の点滅
    if (this.sprite) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    }
  }

  /**
   * 透明度設定
   * @param {number} alpha - 透明度（0.0-1.0）
   */
  setAlpha(alpha) {
    if (this.sprite) {
      this.sprite.setAlpha(alpha);
    }
  }

  /**
   * 奥行き判定（他のエンティティとの距離チェック）
   * @param {IEntity} other - 判定対象のエンティティ
   * @param {number} threshold - 判定閾値（デフォルト40px）
   * @returns {boolean} 奥行きが揃っているか
   */
  isDepthAligned(other, threshold = 40) {
    return Math.abs(this.groundY - other.groundY) < threshold;
  }

  /**
   * X軸距離計算
   * @param {IEntity} other - 対象エンティティ
   * @returns {number} X軸距離
   */
  getDistanceX(other) {
    return Math.abs(this.x - other.x);
  }

  /**
   * 2点間の距離計算
   * @param {IEntity} other - 対象エンティティ
   * @returns {number} 距離
   */
  getDistance(other) {
    const dx = this.x - other.x;
    const dy = this.groundY - other.groundY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 指定座標への角度計算
   * @param {number} targetX - 目標X座標
   * @param {number} targetY - 目標Y座標
   * @returns {number} 角度（ラジアン）
   */
  getAngleTo(targetX, targetY) {
    return Phaser.Math.Angle.Between(this.x, this.groundY, targetX, targetY);
  }

  /**
   * エンティティ破棄
   */
  destroy() {
    this.alive = false;
    
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }

    // シーンのエンティティリストから削除（継承クラスで実装）
    this.onDestroy();
  }

  /**
   * 破棄時のカスタム処理（継承クラスでオーバーライド）
   */
  onDestroy() {
    // 継承クラスで実装
  }

  /**
   * エンティティの状態を取得
   * @returns {Object} 状態オブジェクト
   */
  getState() {
    return {
      x: this.x,
      y: this.y,
      groundY: this.groundY,
      displayY: this.displayY,
      hp: this.hp,
      maxHp: this.maxHp,
      alive: this.alive,
      invincible: this.invincible,
      facingRight: this.facingRight
    };
  }

  /**
   * デバッグ情報の取得
   * @returns {string} デバッグ文字列
   */
  getDebugInfo() {
    return `${this.constructor.name}: HP(${this.hp}/${this.maxHp}) Pos(${Math.floor(this.x)}, ${Math.floor(this.groundY)}) Alive(${this.alive})`;
  }
}