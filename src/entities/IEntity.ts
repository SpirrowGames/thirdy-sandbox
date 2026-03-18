/**
 * 全エンティティが実装すべきインターフェース
 */
export interface IEntity {
  // 位置情報
  x: number;
  y: number;
  groundY: number; // 奥行き判定用Y座標
  
  // 基本ステータス
  hp: number;
  maxHp: number;
  alive: boolean;
  
  // 状態
  state: string;
  
  // メソッド
  update(time: number, delta: number): void;
  takeDamage(amount: number, knockback?: { x: number, y: number }): boolean;
  destroy(): void;
  
  // 位置・判定関連
  distanceTo(other: IEntity): number;
  isDepthAligned(other: IEntity, threshold?: number): boolean;
}