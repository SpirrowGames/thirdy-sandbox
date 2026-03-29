import CommandBuffer from './CommandBuffer.js';

/**
 * PhaserのInput.Keyboardと連携するCommandBufferラッパー
 */
export class PhaserCommandInput {
  constructor(scene) {
    this.scene = scene;
    this.commandBuffer = new CommandBuffer();
    this.keys = {};
    this.lastPressed = {}; // キーの重複入力防止用
    this.keyHoldTime = 100; // キーホールド判定時間（ms）

    this._setupKeys();
  }

  /**
   * Phaserのキー入力設定
   * @private
   */
  _setupKeys() {
    const cursors = this.scene.input.keyboard.createCursorKeys();
    const actionKeys = this.scene.input.keyboard.addKeys('Z,X');

    this.keys = {
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      z: actionKeys.Z,
      x: actionKeys.X,
    };

    // キー押下イベントの設定
    Object.entries(this.keys).forEach(([name, key]) => {
      key.on('down', () => this._handleKeyDown(name.toUpperCase()));
    });
  }

  /**
   * キー押下処理
   * @private
   * @param {string} keyName - 押下されたキー名
   */
  _handleKeyDown(keyName) {
    const now = Date.now();
    
    // 重複入力の防止
    if (this.lastPressed[keyName] && 
        now - this.lastPressed[keyName] < this.keyHoldTime) {
      return;
    }

    this.lastPressed[keyName] = now;

    // CommandBufferにキー入力を送信
    const matchedCommand = this.commandBuffer.push(keyName);

    if (matchedCommand) {
      // コマンドがマッチした場合、シーンにイベントを発火
      this.scene.events.emit('commandExecuted', matchedCommand);
    }
  }

  /**
   * 更新処理（毎フレーム呼び出し）
   */
  update() {
    // 現在は特に処理なし
    // 将来的にキー長押し判定などを追加する場合はここに実装
  }

  /**
   * CommandBufferへの直接アクセス
   * @returns {CommandBuffer} CommandBufferインスタンス
   */
  getCommandBuffer() {
    return this.commandBuffer;
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled - デバッグモードを有効にするか
   */
  setDebugMode(enabled) {
    this.commandBuffer.setDebugMode(enabled);
  }

  /**
   * クリーンアップ
   */
  destroy() {
    Object.values(this.keys).forEach(key => {
      key.removeAllListeners();
    });
    this.keys = {};
    this.commandBuffer.clear();
  }
}

export default PhaserCommandInput;