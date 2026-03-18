/**
 * コマンド入力バッファシステム
 * キー入力履歴を管理し、定義されたコマンドパターンとのマッチングを行う
 */

// コマンド定義（優先度順でソート）
const COMMANDS = {
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
};

// コマンド入力の猶予時間（ミリ秒）
const COMMAND_WINDOW = 400;

export class CommandBuffer {
  constructor() {
    this.buffer = []; // { key: string, time: number }[]
    this.commands = this._sortCommandsByPriority(COMMANDS);
    this.debugMode = false; // デバッグ用フラグ
  }

  /**
   * キー入力をバッファに追加し、コマンドマッチングを実行
   * @param {string} key - 入力されたキー（'LEFT', 'RIGHT', 'UP', 'DOWN', 'Z', 'X'）
   * @returns {string|null} - マッチしたコマンド名、またはnull
   */
  push(key) {
    if (!this._isValidKey(key)) {
      console.warn(`CommandBuffer: 無効なキー入力: ${key}`);
      return null;
    }

    const now = Date.now();
    this.buffer.push({ key, time: now });

    // デバッグログ
    if (this.debugMode) {
      console.log(`CommandBuffer: キー入力 ${key}, バッファ: ${this.buffer.map(b => b.key).join('')}`);
    }

    // 期限切れ入力を削除
    this._cleanExpiredInputs(now);

    // コマンドマッチング
    return this._matchCommand();
  }

  /**
   * バッファをクリア
   */
  clear() {
    this.buffer = [];
    if (this.debugMode) {
      console.log('CommandBuffer: バッファクリア');
    }
  }

  /**
   * 現在のバッファ状態を取得（デバッグ用）
   * @returns {Array} バッファの内容
   */
  getBuffer() {
    return [...this.buffer];
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled - デバッグモードを有効にするか
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * 期限切れの入力をバッファから削除
   * @private
   * @param {number} currentTime - 現在時刻
   */
  _cleanExpiredInputs(currentTime) {
    const initialLength = this.buffer.length;
    this.buffer = this.buffer.filter(entry => 
      currentTime - entry.time <= COMMAND_WINDOW
    );

    if (this.debugMode && this.buffer.length < initialLength) {
      console.log(`CommandBuffer: ${initialLength - this.buffer.length}個の期限切れ入力を削除`);
    }
  }

  /**
   * コマンドパターンマッチング
   * @private
   * @returns {string|null} マッチしたコマンド名
   */
  _matchCommand() {
    const inputSequence = this.buffer.map(entry => entry.key);

    // 優先度順にコマンドをチェック
    for (const [commandName, commandData] of this.commands) {
      if (this._sequenceEndsWith(inputSequence, commandData.sequence)) {
        if (this.debugMode) {
          console.log(`CommandBuffer: コマンドマッチ: ${commandName} (${commandData.name})`);
        }
        
        // マッチ後はバッファをクリア
        this.clear();
        return commandName;
      }
    }

    return null;
  }

  /**
   * 入力シーケンスが指定されたパターンで終わっているかチェック
   * @private
   * @param {Array} sequence - 入力シーケンス
   * @param {Array} pattern - マッチングパターン
   * @returns {boolean} マッチするかどうか
   */
  _sequenceEndsWith(sequence, pattern) {
    if (sequence.length < pattern.length) {
      return false;
    }

    const tail = sequence.slice(-pattern.length);
    return pattern.every((key, index) => key === tail[index]);
  }

  /**
   * 有効なキー入力かチェック
   * @private
   * @param {string} key - チェックするキー
   * @returns {boolean} 有効なキーかどうか
   */
  _isValidKey(key) {
    const validKeys = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'Z', 'X'];
    return validKeys.includes(key);
  }

  /**
   * コマンドを優先度順にソート
   * @private
   * @param {Object} commands - コマンド定義オブジェクト
   * @returns {Array} ソートされたコマンドエントリ
   */
  _sortCommandsByPriority(commands) {
    return Object.entries(commands)
      .sort(([, a], [, b]) => {
        // 優先度が同じ場合は、シーケンスの長い順
        if (a.priority === b.priority) {
          return b.sequence.length - a.sequence.length;
        }
        return b.priority - a.priority;
      });
  }

  /**
   * 新しいコマンドを追加
   * @param {string} name - コマンド名
   * @param {Array} sequence - キーシーケンス
   * @param {number} priority - 優先度
   * @param {string} displayName - 表示名
   */
  addCommand(name, sequence, priority = 1, displayName = name) {
    COMMANDS[name] = {
      sequence,
      priority,
      name: displayName
    };
    this.commands = this._sortCommandsByPriority(COMMANDS);
    
    if (this.debugMode) {
      console.log(`CommandBuffer: コマンド追加: ${name} (${sequence.join('')})`);
    }
  }

  /**
   * コマンドを削除
   * @param {string} name - 削除するコマンド名
   */
  removeCommand(name) {
    if (COMMANDS[name]) {
      delete COMMANDS[name];
      this.commands = this._sortCommandsByPriority(COMMANDS);
      
      if (this.debugMode) {
        console.log(`CommandBuffer: コマンド削除: ${name}`);
      }
    }
  }

  /**
   * 登録されているコマンド一覧を取得
   * @returns {Object} コマンド定義一覧
   */
  getCommands() {
    return { ...COMMANDS };
  }
}

// デフォルトエクスポート
export default CommandBuffer;