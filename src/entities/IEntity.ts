/**
 * 全エンティティが実装すべき基底インターフェース
 */
export interface IEntity {
  // 位置情報
  x: number;
  y: number;          // 表示Y（ジャンプ時変動）
  groundY: number;    // 判定Y（固定）
  
  // ステータス
  hp: number;
  alive: boolean;
  
  // 必須メソッド
  update(time: number, delta: number): void;
  takeDamage(amount: number, knockback?: { x: number; y: number }): void;
  destroy(): void;
}