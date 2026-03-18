import { GAME_CONFIG } from '../main.js';

/**
 * ゲーム設定の妥当性をチェックする
 * @returns {Array<string>} エラーメッセージの配列（空なら正常）
 */
export function validateGameConfig() {
  const errors = [];
  
  // 画面サイズチェック
  if (GAME_CONFIG.GAME_WIDTH <= 0 || GAME_CONFIG.GAME_HEIGHT <= 0) {
    errors.push('画面サイズは正の値である必要があります');
  }
  
  // 奥行き設定チェック
  if (GAME_CONFIG.GROUND_Y_MIN >= GAME_CONFIG.GROUND_Y_MAX) {
    errors.push('GROUND_Y_MIN は GROUND_Y_MAX より小さい必要があります');
  }
  
  if (GAME_CONFIG.DEPTH_THRESHOLD <= 0) {
    errors.push('DEPTH_THRESHOLD は正の値である必要があります');
  }
  
  // 時間設定チェック
  if (GAME_CONFIG.COMMAND_WINDOW <= 0) {
    errors.push('COMMAND_WINDOW は正の値である必要があります');
  }
  
  if (GAME_CONFIG.COMBO_RESET_TIME <= 0) {
    errors.push('COMBO_RESET_TIME は正の値である必要があります');
  }
  
  // 速度設定チェック
  if (GAME_CONFIG.PLAYER_SPEED <= 0 || GAME_CONFIG.ENEMY_SPEED <= 0) {
    errors.push('移動速度は正の値である必要があります');
  }
  
  // HP設定チェック
  if (GAME_CONFIG.PLAYER_MAX_HP <= 0 || GAME_CONFIG.BOSS_MAX_HP <= 0) {
    errors.push('最大HPは正の値である必要があります');
  }
  
  // フェーズ2閾値チェック
  if (GAME_CONFIG.BOSS_PHASE2_THRESHOLD <= 0 || GAME_CONFIG.BOSS_PHASE2_THRESHOLD >= 1) {
    errors.push('BOSS_PHASE2_THRESHOLD は 0 と 1 の間の値である必要があります');
  }
  
  return errors;
}

/**
 * 設定値をコンソールに出力する（デバッグ用）
 */
export function logGameConfig() {
  console.group('🎮 Game Configuration');
  console.table(GAME_CONFIG);
  console.groupEnd();
  
  const errors = validateGameConfig();
  if (errors.length > 0) {
    console.group('⚠️ Configuration Errors');
    errors.forEach(error => console.error(error));
    console.groupEnd();
  } else {
    console.log('✅ Configuration is valid');
  }
}