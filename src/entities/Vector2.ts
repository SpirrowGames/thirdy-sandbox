/**
 * 2D座標とベクトル演算用のユーティリティクラス
 */
export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  /**
   * ベクトルの長さを取得
   */
  get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 正規化したベクトルを返す
   */
  normalize(): Vector2 {
    const mag = this.magnitude;
    return mag > 0 ? new Vector2(this.x / mag, this.y / mag) : new Vector2(0, 0);
  }

  /**
   * スカラー倍
   */
  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /**
   * ベクトル加算
   */
  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  /**
   * 2点間の距離を計算
   */
  static distance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}