/**
 * Phaserのキーイベントをコマンドバッファ用のキー名に変換
 */

export class KeyMapper {
  constructor(scene) {
    this.scene = scene;
    this.keys = {};
    this._setupKeys();
  }

  /**
   * Phaserキーオブジェクトを初期化
   * @private
   */
  _setupKeys() {
    this.keys = this.scene.input.keyboard.addKeys({
      'LEFT': Phaser.Input.Keyboard.KeyCodes.LEFT,
      'RIGHT': Phaser.Input.Keyboard.KeyCodes.RIGHT,
      'UP': Phaser.Input.Keyboard.KeyCodes.UP,
      'DOWN': Phaser.Input.Keyboard.KeyCodes.DOWN,
      'Z': Phaser.Input.Keyboard.KeyCodes.Z,
      'X': Phaser.Input.Keyboard.KeyCodes.X
    });
  }

  /**
   * キーイベントリスナーを設定
   * @param {function} onKeyDown - キー押下時のコールバック (keyName) => void
   */
  setupEventListeners(onKeyDown) {
    Object.entries(this.keys).forEach(([keyName, keyObject]) => {
      keyObject.on('down', () => {
        onKeyDown(keyName);
      });
    });
  }

  /**
   * 特定キーの状態を取得
   * @param {string} keyName - キー名
   * @returns {boolean} 押下状態
   */
  isKeyDown(keyName) {
    return this.keys[keyName] && this.keys[keyName].isDown;
  }

  /**
   * 複数キーの同時押し判定
   * @param {Array<string>} keyNames - チェックするキー名の配列
   * @returns {boolean} 全て押下されているか
   */
  areKeysDown(keyNames) {
    return keyNames.every(keyName => this.isKeyDown(keyName));
  }

  /**
   * リソースクリーンアップ
   */
  destroy() {
    Object.values(this.keys).forEach(key => {
      key.removeAllListeners();
    });
    this.keys = {};
  }
}