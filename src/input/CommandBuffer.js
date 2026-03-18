/**
 * コマンド入力バッファシステム
 * キー入力履歴を管理し、特定のコマンドパターンをマッチングする
 */

// コマンド定義（データ駆動）
export const COMMANDS = {
  steamBlow: {
    name: 'スチームブロー',
    sequence: ['RIGHT', 'RIGHT', 'Z'],
    priority: 10,
    description: '蒸気を噴出しながら前進パンチ'
  },
  boilerUpper: {
    name: 'ボイラーアッパー',
    sequence: ['DOWN', 'RIGHT', 'Z'],
    priority: 10,
    description: '爆圧で打ち上げ、浮かせ技'
  },
  backdraft: {
    name: 'バックドラフト',
    sequence: ['LEFT', 'LEFT', 'Z'],
    priority: 10,
    description: '後退しながら薙ぎ払い、ガード崩し'
  }
};

// コマンド入力の猶予時間（ms）
export const COMMAND_WINDOW = 400;

/**
 * コマンド入力バッファクラス
 */
export class CommandBuffer {
  constructor(windowMs = COMMAND_WINDOW) {
    this.buffer = []; // { key: string, time: number }[]
    this.windowMs = windowMs;
    this.enabled = true;
  }

  /**
   * キー入力をバッファに追加し、コマンドマッチングを実行
   * @param {string} key - 入力されたキー（'LEFT', 'RIGHT', 'UP', 'DOWN', 'Z', 'X'）
   * @returns {string|null} - マッチしたコマンド名、またはnull
   */
  push(key) {
    if (!this.enabled) {
      return null;
    }

    const now = Date.now();
    
    // 入力をバッファに追加
    this.buffer.push({ key, time: now });
    
    // 期限切れの入力を削除
    this.cleanup(now);
    
    // コマンドマッチング実行
    return this.matchCommand();
  }

  /**
   * 期限切れの入力をバッファから削除
   * @param {number} currentTime - 現在時刻
   */
  cleanup(currentTime) {
    this.buffer = this.buffer.filter(entry => 
      currentTime - entry.time <= this.windowMs
    );
  }

  /**
   * バッファの内容からコマンドをマッチング
   * @returns {string|null} - マッチしたコマンド名、またはnull
   */
  matchCommand() {
    // 優先度順でコマンドをソート（同優先度の場合は長いシーケンス優先）
    const sortedCommands = Object.entries(COMMANDS).sort((a, b) => {
      const [, cmdA] = a;
      const [, cmdB] = b;
      
      if (cmdA.priority !== cmdB.priority) {
        return cmdB.priority - cmdA.priority; // 高優先度を先に
      }
      
      return cmdB.sequence.length - cmdA.sequence.length; // 長いシーケンスを先に
    });

    // 各コマンドに対してマッチング判定
    for (const [commandName, commandDef] of sortedCommands) {
      if (this.matchSequence(commandDef.sequence)) {
        this.clear(); // マッチ後はバッファクリア
        return commandName;
      }
    }

    return null;
  }

  /**
   * 指定されたシーケンスがバッファの末尾とマッチするかチェック
   * @param {string[]} sequence - チェックするコマンドシーケンス
   * @returns {boolean} - マッチするかどうか
   */
  matchSequence(sequence) {
    if (this.buffer.length < sequence.length) {
      return false;
    }

    const keys = this.buffer.map(entry => entry.key);
    const tail = keys.slice(-sequence.length);

    return sequence.every((expectedKey, index) => 
      expectedKey === tail[index]
    );
  }

  /**
   * バッファをクリア
   */
  clear() {
    this.buffer = [];
  }

  /**
   * コマンド入力を有効/無効にする
   * @param {boolean} enabled - 有効かどうか
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * 現在のバッファ状態を取得（デバッグ用）
   * @returns {object} - バッファの状態
   */
  getState() {
    const now = Date.now();
    return {
      buffer: this.buffer.map(entry => ({
        key: entry.key,
        age: now - entry.time
      })),
      windowMs: this.windowMs,
      enabled: this.enabled
    };
  }

  /**
   * バッファの内容を文字列として取得（デバッグ用）
   * @returns {string} - バッファの内容
   */
  getBufferString() {
    return this.buffer.map(entry => entry.key).join(' → ');
  }

  /**
   * 利用可能なコマンドリストを取得
   * @returns {object} - コマンド定義オブジェクト
   */
  static getAvailableCommands() {
    return COMMANDS;
  }

  /**
   * コマンドシーケンスを文字列として取得
   * @param {string} commandName - コマンド名
   * @returns {string} - コマンドシーケンスの文字列表現
   */
  static getCommandString(commandName) {
    const command = COMMANDS[commandName];
    if (!command) {
      return '';
    }
    return command.sequence.join(' → ');
  }
}