/**
 * コマンド入力バッファシステム
 * キー入力履歴を管理し、定義されたコマンドパターンとマッチングを行う
 */

// コマンド定義（優先度順、長いシーケンス優先）
export const COMMANDS = {
  steamBlow: {
    sequence: ['RIGHT', 'RIGHT', 'Z'],
    priority: 10,
    description: 'スチームブロー'
  },
  boilerUpper: {
    sequence: ['DOWN', 'RIGHT', 'Z'],
    priority: 10,
    description: 'ボイラーアッパー'
  },
  backdraft: {
    sequence: ['LEFT', 'LEFT', 'Z'],
    priority: 10,
    description: 'バックドラフト'
  },
  // 将来の拡張用コマンド例
  grab: {
    sequence: ['Z', 'X'],
    priority: 5,
    description: '掴み投げ'
  }
};

// コマンド入力の猶予時間（ミリ秒）
export const COMMAND_WINDOW = 400;

export class CommandBuffer {
  constructor() {
    /**
     * 入力履歴バッファ
     * @type {Array<{key: string, time: number}>}
     */
    this.buffer = [];
    
    /**
     * デバッグモード
     * @type {boolean}
     */
    this.debugMode = false;
  }

  /**
   * キー入力をバッファに追加し、コマンドマッチングを実行
   * @param {string} key - 入力されたキー ('LEFT', 'RIGHT', 'UP', 'DOWN', 'Z', 'X')
   * @returns {string|null} - マッチしたコマンド名、またはnull
   */
  push(key) {
    if (!this._isValidKey(key)) {
      if (this.debugMode) {
        console.warn(`CommandBuffer: Invalid key '${key}'`);
      }
      return null;
    }

    const now = Date.now();
    
    // 新しい入力を追加
    this.buffer.push({ key, time: now });
    
    if (this.debugMode) {
      console.log(`CommandBuffer: Added '${key}' at ${now}`);
    }

    // 期限切れの入力を削除
    this._cleanExpiredInputs(now);

    // コマンドマッチングを実行
    const matchedCommand = this._matchCommand();
    
    if (matchedCommand) {
      if (this.debugMode) {
        console.log(`CommandBuffer: Matched command '${matchedCommand}'`);
      }
      // マッチした場合はバッファをクリア
      this.clear();
    }

    return matchedCommand;
  }

  /**
   * バッファをクリア
   */
  clear() {
    this.buffer = [];
    if (this.debugMode) {
      console.log('CommandBuffer: Buffer cleared');
    }
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled - デバッグモードの有効/無効
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * 現在のバッファ状態を取得（デバッグ用）
   * @returns {Array<string>} キーのシーケンス
   */
  getBufferSequence() {
    return this.buffer.map(entry => entry.key);
  }

  /**
   * 有効なキー入力かチェック
   * @param {string} key - チェックするキー
   * @returns {boolean}
   * @private
   */
  _isValidKey(key) {
    const validKeys = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'Z', 'X'];
    return validKeys.includes(key);
  }

  /**
   * 期限切れの入力をバッファから削除
   * @param {number} currentTime - 現在時刻
   * @private
   */
  _cleanExpiredInputs(currentTime) {
    const beforeCount = this.buffer.length;
    this.buffer = this.buffer.filter(entry => 
      currentTime - entry.time <= COMMAND_WINDOW
    );
    
    if (this.debugMode && this.buffer.length < beforeCount) {
      console.log(`CommandBuffer: Cleaned ${beforeCount - this.buffer.length} expired inputs`);
    }
  }

  /**
   * バッファ内の入力シーケンスとコマンド定義をマッチング
   * @returns {string|null} マッチしたコマンド名
   * @private
   */
  _matchCommand() {
    if (this.buffer.length === 0) {
      return null;
    }

    const currentSequence = this.buffer.map(entry => entry.key);
    
    // 優先度とシーケンス長でソート（長いシーケンス、高い優先度を優先）
    const sortedCommands = Object.entries(COMMANDS).sort((a, b) => {
      const [, cmdA] = a;
      const [, cmdB] = b;
      
      // まずシーケンス長で比較（長い方を優先）
      if (cmdA.sequence.length !== cmdB.sequence.length) {
        return cmdB.sequence.length - cmdA.sequence.length;
      }
      
      // シーケンス長が同じなら優先度で比較
      return cmdB.priority - cmdA.priority;
    });

    // 各コマンドとマッチングを試行
    for (const [commandName, commandDef] of sortedCommands) {
      if (this._sequenceEndsWith(currentSequence, commandDef.sequence)) {
        return commandName;
      }
    }

    return null;
  }

  /**
   * シーケンスが指定されたパターンで終わっているかチェック
   * @param {Array<string>} sequence - チェック対象のシーケンス
   * @param {Array<string>} pattern - マッチングパターン
   * @returns {boolean}
   * @private
   */
  _sequenceEndsWith(sequence, pattern) {
    if (sequence.length < pattern.length) {
      return false;
    }

    const tail = sequence.slice(-pattern.length);
    return pattern.every((key, index) => key === tail[index]);
  }

  /**
   * 特定のコマンドが入力可能な状態かチェック
   * @param {string} commandName - チェックするコマンド名
   * @returns {boolean}
   */
  canExecuteCommand(commandName) {
    const commandDef = COMMANDS[commandName];
    if (!commandDef) {
      return false;
    }

    const currentSequence = this.buffer.map(entry => entry.key);
    return this._sequenceEndsWith(currentSequence, commandDef.sequence);
  }

  /**
   * 現在の入力状況から次に必要なキーを取得
   * @param {string} commandName - 対象コマンド名
   * @returns {string|null} 次に必要なキー、またはnull
   */
  getNextRequiredKey(commandName) {
    const commandDef = COMMANDS[commandName];
    if (!commandDef) {
      return null;
    }

    const currentSequence = this.buffer.map(entry => entry.key);
    const targetSequence = commandDef.sequence;

    // 現在のシーケンスがターゲットの開始部分とマッチしているかチェック
    if (currentSequence.length >= targetSequence.length) {
      return null; // 既に完了済み
    }

    // 部分マッチをチェック
    const isPartialMatch = currentSequence.every((key, index) => 
      index < targetSequence.length && key === targetSequence[index]
    );

    if (isPartialMatch) {
      return targetSequence[currentSequence.length];
    }

    return targetSequence[0]; // 最初から開始
  }
}