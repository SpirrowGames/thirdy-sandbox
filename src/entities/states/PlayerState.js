/**
 * プレイヤーステートの基底クラス
 */
export class PlayerState {
  constructor(name) {
    this.name = name;
  }

  enter(player) {
    // ステート開始時の処理
  }

  update(player, time, delta) {
    // 毎フレーム更新処理
    return null; // 次のステートを返すか、nullで継続
  }

  exit(player) {
    // ステート終了時の処理
  }

  canTransitionTo(nextState) {
    // 遷移可能かどうかの判定
    return true;
  }
}