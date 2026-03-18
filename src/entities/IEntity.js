/**
 * 全エンティティが実装すべき基底インターフェース
 * TypeScriptのinterfaceをJSDocで表現
 */

/**
 * @interface IEntity
 * @description ゲーム内の全エンティティが実装すべき共通インターフェース
 */

/**
 * エンティティの位置・状態・ライフサイクル管理のための基底インターフェース
 * @typedef {Object} IEntity
 * @property {number} x - X座標（横方向位置）
 * @property {number} y - Y座標（表示用、ジャンプ時に変動）
 * @property {number} groundY - 奥行き判定用Y座標（ジャンプ中も固定）
 * @property {number} hp - 現在のヒットポイント
 * @property {number} maxHp - 最大ヒットポイント
 * @property {boolean} alive - 生存フラグ
 * @property {boolean} active - アクティブフラグ（更新対象かどうか）
 * @property {string} type - エンティティタイプ（'player', 'enemy', 'boss', 'weapon'）
 */

/**
 * エンティティが実装すべきメソッド群
 * @callback UpdateMethod
 * @param {number} time - ゲーム開始からの経過時間（ms）
 * @param {number} delta - 前フレームからの経過時間（ms）
 * @returns {void}
 */

/**
 * @callback TakeDamageMethod
 * @param {number} amount - ダメージ量
 * @param {Object} [knockback] - ノックバック情報
 * @param {number} [knockback.x] - X方向ノックバック力
 * @param {number} [knockback.y] - Y方向ノックバック力
 * @param {string} [weaponType] - 攻撃した武器タイプ（弱点判定用）
 * @returns {void}
 */

/**
 * @callback DestroyMethod
 * @returns {void}
 */

/**
 * @callback IsDepthAlignedMethod
 * @param {IEntity} other - 判定対象エンティティ
 * @returns {boolean}
 */

export const ENTITY_TYPES = {
  PLAYER: 'player',
  ENEMY: 'enemy', 
  BOSS: 'boss',
  WEAPON: 'weapon',
  PROJECTILE: 'projectile'
};

export const DEPTH_THRESHOLD = 40; // 奥行き判定閾値（px）