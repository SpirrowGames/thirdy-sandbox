/**
 * コマンド入力バッファシステム
 * キー履歴を管理し、コマンドパターンをマッチングする
 */
export class CommandBuffer {
  constructor(windowMs = 400) {
    this.buffer = [];           // { key: string, time: number }[]
    this.windowMs = windowMs;   // コマンド入力猶予時間（ms）
    this.commands = new Map();  // コマンド定義
    this.enabled = true;
  }

  /**
   * コマンド定義を登録する
   * @param {string} name - コマンド名
   * @param {string[]} sequence - キーシーケンス（例: ['RIGHT', 'RIGHT', 'Z']）
   * @param {number} priority - 優先度（高いほど優先、デフォルト: 10）
   */
  registerCommand(name, sequence, priority = 10) {
    if (!name || !Array.isArray(sequence) || sequence.length === 0) {
      throw new Error('Invalid command definition');
    }
    
    this.commands.set(name, {
      sequence: [...sequence], // コピーして保持
      priority,
      length: sequence.length
    });
  }

  /**
   * 複数のコマンドを一括登録する
   * @param {Object} commandDefs - コマンド定義オブジェクト
   */
  registerCommands(commandDefs) {
    Object.entries(commandDefs).forEach(([name, def]) => {
      this.registerCommand(name, def.sequence, def.priority);
    });
  }

  /**
   * キー入力をバッファに追加し、コマンドマッチングを実行する
   * @param {string} key - 押されたキー
   * @returns {string|null} マッチしたコマンド名、またはnull
   */
  push(key) {
    if (!this.enabled) return null;

    const now = Date.now();
    this.buffer.push({ key, time: now });
    
    // 古い入力を削除
    this.cleanupOldInputs(now);
    
    // コマンドマッチング実行
    return this.match();
  }

  /**
   * 期限切れの入力をバッファから削除する
   * @param {number} currentTime - 現在時刻
   */
  cleanupOldInputs(currentTime) {
    this.buffer = this.buffer.filter(
      input => currentTime - input.time <= this.windowMs
    );
  }

  /**
   * バッファ内の入力シーケンスとコマンドパターンをマッチングする
   * @returns {string|null} マッチしたコマンド名、またはnull
   */
  match() {
    if (this.buffer.length === 0) return null;

    // 優先度順、長さ順でソートしたコマンドリスト
    const sortedCommands = Array.from(this.commands.entries())
      .sort(([, a], [, b]) => {
        // 優先度が高い順、同じなら長いシーケンス順
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.length - a.length;
      });

    // 各コマンドパターンとマッチングを試行
    for (const [name, command] of sortedCommands) {
      if (this.matchesSequence(command.sequence)) {
        this.clearBuffer(); // マッチ後はバッファをクリア
        return name;
      }
    }

    return null;
  }

  /**
   * バッファの末尾が指定されたシーケンスと一致するかチェック
   * @param {string[]} sequence - チェックするシーケンス
   * @returns {boolean} 一致するかどうか
   */
  matchesSequence(sequence) {
    if (this.buffer.length < sequence.length) return false;

    const bufferKeys = this.buffer.map(input => input.key);
    const tailKeys = bufferKeys.slice(-sequence.length);
    
    return sequence.every((expectedKey, index) => 
      expectedKey === tailKeys[index]
    );
  }

  /**
   * バッファをクリアする
   */
  clearBuffer() {
    this.buffer = [];
  }

  /**
   * バッファを有効/無効にする
   * @param {boolean} enabled - 有効かどうか
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clearBuffer();
    }
  }

  /**
   * 現在のバッファ状態を取得する（デバッグ用）
   * @returns {Object} バッファの状態情報
   */
  getDebugInfo() {
    return {
      bufferLength: this.buffer.length,
      recentKeys: this.buffer.map(input => input.key).join('->'),
      registeredCommands: Array.from(this.commands.keys()),
      enabled: this.enabled,
      windowMs: this.windowMs
    };
  }
}