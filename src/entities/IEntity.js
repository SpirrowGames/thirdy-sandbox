/**
 * 全エンティティが実装すべき共通インターフェース
 * TypeScriptでない環境でのインターフェース定義として使用
 */
export class IEntity {
  constructor() {
    // 基本プロパティ
    this.x = 0;
    this.y = 0;
    this.groundY = 0;    // 判定用Y座標（固定）
    this.displayY = 0;   // 描画用Y座標（ジャンプ時変動）
    this.hp = 100;
    this.alive = true;
    
    // 必須実装メソッドの確認
    this._checkImplementation();
  }
  
  _checkImplementation() {
    const requiredMethods = ['update', 'takeDamage', 'destroy'];
    
    requiredMethods.forEach(method => {
      if (typeof this[method] !== 'function') {
        throw new Error(`${this.constructor.name} must implement ${method}() method`);
      }
    });
  }
  
  /**
   * 毎フレーム更新処理
   * @param {number} time - ゲーム開始からの経過時間
   * @param {number} delta - 前フレームからの経過時間
   */
  update(time, delta) {
    throw new Error('update() method must be implemented');
  }
  
  /**
   * ダメージ処理
   * @param {number} amount - ダメージ量
   * @param {number} sourceX - 攻撃元のX座標（ノックバック計算用）
   * @param {Object} knockback - ノックバックベクター
   */
  takeDamage(amount, sourceX = null, knockback = null) {
    throw new Error('takeDamage() method must be implemented');
  }
  
  /**
   * エンティティ破棄処理
   */
  destroy() {
    throw new Error('destroy() method must be implemented');
  }
  
  /**
   * 奥行き判定用のY座標取得
   * @returns {number} 判定用Y座標
   */
  getGroundY() {
    return this.groundY;
  }
  
  /**
   * 2つのエンティティが同じ奥行きにいるかチェック
   * @param {IEntity} other - 相手エンティティ
   * @param {number} threshold - 判定閾値（デフォルト40px）
   * @returns {boolean} 同じ奥行きにいるか
   */
  isDepthAligned(other, threshold = 40) {
    return Math.abs(this.groundY - other.groundY) < threshold;
  }
}