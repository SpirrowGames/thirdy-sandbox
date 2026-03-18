import { CommandBuffer } from './CommandBuffer.js';
import { PLAYER_COMMANDS, COMMON_COMMANDS } from '../data/commands.js';

/**
 * 入力管理システム
 * Phaserのキーボード入力とCommandBufferを連携させる
 */
export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.commandBuffer = new CommandBuffer(400); // 400ms猶予
    this.keys = {};
    this.lastInputTime = 0;
    
    this.setupKeyboard();
    this.registerDefaultCommands();
  }

  /**
   * Phaserキーボード入力を設定
   */
  setupKeyboard() {
    const keyboard = this.scene.input.keyboard;
    
    // 方向キー
    this.keys.left = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keys.right = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keys.up = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keys.down = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    
    // アクションキー
    this.keys.z = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keys.x = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    
    // キー押下イベントリスナー設定
    this.setupKeyListeners();
  }

  /**
   * キー押下イベントリスナーを設定
   */
  setupKeyListeners() {
    const keyMap = {
      [Phaser.Input.Keyboard.KeyCodes.LEFT]: 'LEFT',
      [Phaser.Input.Keyboard.KeyCodes.RIGHT]: 'RIGHT', 
      [Phaser.Input.Keyboard.KeyCodes.UP]: 'UP',
      [Phaser.Input.Keyboard.KeyCodes.DOWN]: 'DOWN',
      [Phaser.Input.Keyboard.KeyCodes.Z]: 'Z',
      [Phaser.Input.Keyboard.KeyCodes.X]: 'X'
    };

    this.scene.input.keyboard.on('keydown', (event) => {
      const keyName = keyMap[event.keyCode];
      if (keyName) {
        this.onKeyDown(keyName);
      }
    });
  }

  /**
   * デフォルトコマンドを登録
   */
  registerDefaultCommands() {
    this.commandBuffer.registerCommands(PLAYER_COMMANDS);
    this.commandBuffer.registerCommands(COMMON_COMMANDS);
  }

  /**
   * キー押下時の処理
   * @param {string} keyName - 押されたキー名
   */
  onKeyDown(keyName) {
    this.lastInputTime = Date.now();
    
    // コマンドバッファに入力を追加
    const matchedCommand = this.commandBuffer.push(keyName);
    
    if (matchedCommand) {
      this.onCommandExecuted(matchedCommand);
    }
  }

  /**
   * コマンド実行時のコールバック
   * @param {string} commandName - 実行されたコマンド名
   */
  onCommandExecuted(commandName) {
    // GameSceneにコマンド実行を通知
    this.scene.events.emit('commandExecuted', commandName);
    
    // デバッグログ
    console.log(`Command executed: ${commandName}`);
  }

  /**
   * 現在の入力状態を取得（移動処理用）
   * @returns {Object} 入力状態
   */
  getInputState() {
    return {
      left: this.keys.left.isDown,
      right: this.keys.right.isDown,
      up: this.keys.up.isDown,
      down: this.keys.down.isDown,
      z: this.keys.z.isDown,
      x: this.keys.x.isDown,
      // 追加情報
      zJustPressed: Phaser.Input.Keyboard.JustDown(this.keys.z),
      xJustPressed: Phaser.Input.Keyboard.JustDown(this.keys.x)
    };
  }

  /**
   * コマンドバッファの有効/無効を切り替え
   * @param {boolean} enabled - 有効にするかどうか
   */
  setCommandsEnabled(enabled) {
    this.commandBuffer.setEnabled(enabled);
  }

  /**
   * 新しいコマンドを追加
   * @param {string} name - コマンド名
   * @param {string[]} sequence - キーシーケンス
   * @param {number} priority - 優先度
   */
  addCommand(name, sequence, priority = 10) {
    this.commandBuffer.registerCommand(name, sequence, priority);
  }

  /**
   * デバッグ情報を取得
   * @returns {Object} デバッグ情報
   */
  getDebugInfo() {
    return {
      ...this.commandBuffer.getDebugInfo(),
      lastInputTime: this.lastInputTime,
      timeSinceLastInput: Date.now() - this.lastInputTime
    };
  }

  /**
   * 更新処理（毎フレーム呼び出し）
   */
  update() {
    // 必要に応じて定期的なクリーンアップなどを実行
    // 現在は特に処理なし
  }

  /**
   * 破棄処理
   */
  destroy() {
    this.commandBuffer.clearBuffer();
    this.keys = {};
  }
}