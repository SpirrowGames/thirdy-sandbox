/**
 * キーコード → コマンド文字列の変換ユーティリティ
 */

// Phaserのキーコードからコマンド文字列への変換マップ
export const KEY_MAPPINGS = {
  'ArrowLeft':  'LEFT',
  'ArrowRight': 'RIGHT',
  'ArrowUp':    'UP',
  'ArrowDown':  'DOWN',
  'KeyZ':       'Z',
  'KeyX':       'X'
};

/**
 * Phaserのキーイベントからコマンド文字列に変換
 * @param {Phaser.Input.Keyboard.Key} key - Phaserのキーオブジェクト
 * @returns {string|null} - コマンド文字列またはnull
 */
export function mapKeyToCommand(key) {
  return KEY_MAPPINGS[key.keyCode] || KEY_MAPPINGS[key.code] || null;
}

/**
 * キーコード文字列からコマンド文字列に変換
 * @param {string} keyCode - キーコード文字列
 * @returns {string|null} - コマンド文字列またはnull
 */
export function mapKeyCodeToCommand(keyCode) {
  return KEY_MAPPINGS[keyCode] || null;
}

/**
 * コマンド文字列を日本語表示用に変換
 * @param {string} command - コマンド文字列
 * @returns {string} - 日本語表示文字列
 */
export function commandToDisplayString(command) {
  const displayMap = {
    'LEFT':  '←',
    'RIGHT': '→',
    'UP':    '↑',
    'DOWN':  '↓',
    'Z':     'Z',
    'X':     'X'
  };
  
  return displayMap[command] || command;
}