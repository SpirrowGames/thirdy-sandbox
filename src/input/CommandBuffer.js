const COMMANDS = {
  steamBlow: {
    sequence: ['RIGHT', 'RIGHT', 'Z'],
    priority: 10,
    cooldown: 2000, // ms
    mpCost: 20
  },
  boilerUpper: {
    sequence: ['DOWN', 'RIGHT', 'Z'], 
    priority: 10,
    cooldown: 1500,
    mpCost: 15
  },
  backdraft: {
    sequence: ['LEFT', 'LEFT', 'Z'],
    priority: 10, 
    cooldown: 2500,
    mpCost: 25
  }
};

const COMMAND_WINDOW = 400; // ms

class CommandBuffer {
  constructor() {
    this.buffer = []; // { key: string, time: number }[]
    this.lastCommandTimes = {}; // コマンド名 -> 最後の実行時間
  }

  /**
   * キー入力をバッファに追加し、コマンドマッチングを実行
   * @param {string} key - 押されたキー（'LEFT', 'RIGHT', 'UP', 'DOWN', 'Z', 'X'）
   * @returns {string|null} - マッチしたコマンド名またはnull
   */
  push(key) {
    const now = Date.now();
    this.buffer.push({ key, time: now });
    
    // 期限切れの入力を削除
    this.buffer = this.buffer.filter(entry => now - entry.time <= COMMAND_WINDOW);
    
    return this.match();
  }

  /**
   * バッファ内の入力シーケンスとコマンドパターンをマッチング
   * @returns {string|null} - マッチしたコマンド名またはnull
   */
  match() {
    // 優先度順、シーケンス長順でコマンドを検索
    const sortedCommands = Object.entries(COMMANDS)
      .sort((a, b) => {
        if (a[1].priority !== b[1].priority) {
          return b[1].priority - a[1].priority;
        }
        return b[1].sequence.length - a[1].sequence.length;
      });

    for (const [commandName, commandDef] of sortedCommands) {
      if (this.endsWith(commandDef.sequence) && this.canExecute(commandName)) {
        this.buffer = []; // マッチ後にバッファをクリア
        this.lastCommandTimes[commandName] = Date.now();
        return commandName;
      }
    }
    
    return null;
  }

  /**
   * バッファの末尾が指定されたシーケンスと一致するかチェック
   * @param {string[]} sequence - チェックするコマンドシーケンス
   * @returns {boolean}
   */
  endsWith(sequence) {
    if (this.buffer.length < sequence.length) {
      return false;
    }
    
    const keys = this.buffer.map(entry => entry.key);
    const tail = keys.slice(-sequence.length);
    
    return sequence.every((expectedKey, index) => expectedKey === tail[index]);
  }

  /**
   * コマンドが実行可能かチェック（クールダウン確認）
   * @param {string} commandName - コマンド名
   * @returns {boolean}
   */
  canExecute(commandName) {
    const commandDef = COMMANDS[commandName];
    const lastTime = this.lastCommandTimes[commandName] || 0;
    const now = Date.now();
    
    return (now - lastTime) >= commandDef.cooldown;
  }

  /**
   * 特定のコマンドの残りクールダウン時間を取得
   * @param {string} commandName - コマンド名
   * @returns {number} - 残りクールダウン時間（ms）
   */
  getRemainingCooldown(commandName) {
    const commandDef = COMMANDS[commandName];
    const lastTime = this.lastCommandTimes[commandName] || 0;
    const elapsed = Date.now() - lastTime;
    
    return Math.max(0, commandDef.cooldown - elapsed);
  }

  /**
   * バッファをクリア
   */
  clear() {
    this.buffer = [];
  }

  /**
   * デバッグ用：現在のバッファ状態を取得
   * @returns {object}
   */
  getDebugInfo() {
    return {
      buffer: this.buffer.map(entry => ({
        key: entry.key,
        age: Date.now() - entry.time
      })),
      cooldowns: Object.keys(COMMANDS).reduce((acc, cmd) => {
        acc[cmd] = this.getRemainingCooldown(cmd);
        return acc;
      }, {})
    };
  }
}

export { CommandBuffer, COMMANDS };