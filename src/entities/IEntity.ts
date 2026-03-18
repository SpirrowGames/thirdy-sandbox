/**
 * 全エンティティが実装すべき基底インターフェース
 * ベルトスクロールゲームにおける2.5D空間での位置管理と
 * 基本的な生存状態管理を提供する
 */
export interface IEntity {
  /** X座標（水平位置） */
  x: number;
  
  /** Y座標（表示用、ジャンプ時に変動） */
  y: number;
  
  /** 奥行き判定用Y座標（ジャンプ中も固定） */
  groundY: number;
  
  /** 現在HP */
  hp: number;
  
  /** 最大HP */
  maxHp: number;
  
  /** 生存状態フラグ */
  alive: boolean;
  
  /** エンティティタイプ識別子 */
  type: string;

  /**
   * 毎フレーム更新処理
   * @param time ゲーム開始からの経過時間（ms）
   * @param delta 前フレームからの経過時間（ms）
   */
  update(time: number, delta: number): void;

  /**
   * ダメージ処理
   * @param amount ダメージ量
   * @param sourceX 攻撃元のX座標（ノックバック方向計算用）
   * @param knockback ノックバック強度（オプション）
   */
  takeDamage(amount: number, sourceX?: number, knockback?: number): void;

  /**
   * エンティティの破棄処理
   * メモリリークを防ぐため、参照の切断とリソース解放を行う
   */
  destroy(): void;
}