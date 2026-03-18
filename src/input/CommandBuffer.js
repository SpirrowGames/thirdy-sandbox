/**
 * コマンド入力バッファシステム
 * キー入力履歴を管理し、コマンドパターンマッチングを行う
 */

// コマンド入力猶予時間（ms）
export const COMMAND_WINDOW = 400;

// 定義済みコマンド（優先度順）
export const COMMANDS = {
  steamBlow: { 
    sequence: ['RIGHT', 'RIGHT', 'Z'], 
    priority: 10,
    name: 'スチームブロー'
  },
  boilerUpper: { 
    sequence: ['DOWN', 'RIGHT', 'Z'], 
    priority: 10,
    name: 'ボイラーアッパー'
  },
  backdraft: { 
    sequence: ['LEFT', 'LEFT', 'Z'], 
    priority: 10,
    name: 'バックドラフト'
  },
  grab: {
    sequence: ['Z', 'X'],
    priority: 5,
    name: '掴み投げ'
  }
};

export class CommandBuffer {
  constructor() {
    this.buffer = []; // { key: string, time: number }[]
    this.enabled = true;
    this.debugMode = false;
  }

  /**
   * キー入力をバッファに追加
   * @param {string} key - 入力されたキー
   * @returns {string|null} - マッチしたコマンド名、またはnull
   */
  push(key) {
    if (!this.enabled) return null;

    const now = Date.now();
    this.buffer.push({ key, time: now });

    // 期限切れの入力を削除
    this.cleanupExpiredInputs(now);

    // デバッグ出力
    if (this.debugMode) {
      console.log('CommandBuffer:', this.buffer.map(b => b.key).join(' '));
    }

    // コマンドマッチング
    return this.matchCommand();
  }

  /**
   * 期限切れの入力をバッファから削除
   * @param {number} currentTime - 現在時刻
   */
  cleanupExpiredInputs(currentTime) {
    this.buffer = this.buffer.filter(
      entry => currentTime - entry.time <= COMMAND_WINDOW
    );
  }

  /**
   * コマンドパターンマッチング
   * @returns {string|null} - マッチしたコマンド名
   */
  matchCommand() {
    // 優先度の高い順にチェック（長いシーケンス優先）
    const sortedCommands = Object.entries(COMMANDS)
      .sort(([,a], [,b]) => {
        // まず優先度で比較
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // 同じ優先度なら長いシーケンス優先
        return b.sequence.length - a.sequence.length;
      });

    for (const [commandName, command] of sortedCommands) {
      if (this.sequenceMatches(command.sequence)) {
        // マッチしたらバッファをクリア
        this.clear();
        
        if (this.debugMode) {
          console.log(`Command matched: ${commandName} (${command.name})`);
        }
        
        return commandName;
      }
    }

    return null;
  }

  /**
   * バッファの末尾が指定されたシーケンスと一致するかチェック
   * @param {string[]} sequence - チェックするシーケンス
   * @returns {boolean} - マッチするかどうか
   */
  sequenceMatches(sequence) {
    if (this.buffer.length < sequence.length) {
      return false;
    }

    const recentKeys = this.buffer
      .slice(-sequence.length)
      .map(entry => entry.key);

    return sequence.every((expectedKey, index) => 
      expectedKey === recentKeys[index]
    );
  }

  /**
   * バッファをクリア
   */
  clear() {
    this.buffer = [];
  }

  /**
   * 入力受付の有効/無効を切り替え
   * @param {boolean} enabled - 有効かどうか
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} debug - デバッグモードかどうか
   */
  setDebugMode(debug) {
    this.debugMode = debug;
  }

  /**
   * 現在のバッファ状態を取得（デバッグ用）
   * @returns {object} - バッファの状態情報
   */
  getState() {
    return {
      buffer: this.buffer.map(b => ({ ...b })),
      bufferSize: this.buffer.length,
      enabled: this.enabled,
      oldestInputAge: this.buffer.length > 0 ? 
        Date.now() - this.buffer[0].time : 0
    };
  }

  /**
   * コマンド定義を追加（実行時拡張用）
   * @param {string} name - コマンド名
   * @param {object} command - コマンド定義
   */
  addCommand(name, command) {
    if (!command.sequence || !Array.isArray(command.sequence)) {
      throw new Error('Command must have a sequence array');
    }
    
    COMMANDS[name] = {
      sequence: [...command.sequence],
      priority: command.priority || 1,
      name: command.name || name
    };
  }

  /**
   * コマンド定義を削除
   * @param {string} name - コマンド名
   */
  removeCommand(name) {
    delete COMMANDS[name];
  }
}

/**
 * Phaserシーン用のコマンドバッファヘルパー
 */
export class PhaserCommandBuffer extends CommandBuffer {
  constructor(scene) {
    super();
    this.scene = scene;
    this.cursors = null;
    this.keys = {};
    this.setupInput();
  }

  /**
   * Phaserの入力システムをセットアップ
   */
  setupInput() {
    // カーソルキー
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // アクションキー
    this.keys = {
      Z: this.scene.input.keyboard.addKey('Z'),
      X: this.scene.input.keyboard.addKey('X')
    };

    // キーイベントリスナーを設定
    this.setupKeyListeners();
  }

  /**
   * キーイベントリスナーを設定
   */
  setupKeyListeners() {
    // 方向キー
    this.cursors.left.on('down', () => this.push('LEFT'));
    this.cursors.right.on('down', () => this.push('RIGHT'));
    this.cursors.up.on('down', () => this.push('UP'));
    this.cursors.down.on('down', () => this.push('DOWN'));

    // アクションキー
    this.keys.Z.on('down', () => this.push('Z'));
    this.keys.X.on('down', () => this.push('X'));
  }

  /**
   * 現在の入力状態を取得（移動用）
   * @returns {object} - 入力状態
   */
  getMovementInput() {
    return {
      left: this.cursors.left.isDown,
      right: this.cursors.right.isDown,
      up: this.cursors.up.isDown,
      down: this.cursors.down.isDown,
      z: this.keys.Z.isDown,
      x: this.keys.X.isDown
    };
  }

  /**
   * リソースをクリーンアップ
   */
  destroy() {
    if (this.cursors) {
      Object.values(this.cursors).forEach(key => key.destroy());
    }
    if (this.keys) {
      Object.values(this.keys).forEach(key => key.destroy());
    }
  }
}