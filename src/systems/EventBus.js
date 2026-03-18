/**
 * GameScene→UIScene間のイベント通信を管理するシステム
 * Phaserの標準EventEmitterを拡張し、型安全性とデバッグ機能を追加
 */
import { GAME_EVENTS } from '../events/GameEvents.js';

export class EventBus {
  constructor(scene) {
    this.scene = scene;
    this.listeners = new Map();
    this.debugMode = false;
  }

  /**
   * イベントを発火
   * @param {string} eventName - イベント名
   * @param {Object} data - イベントデータ
   */
  emit(eventName, data = {}) {
    // デバッグログ出力
    if (this.debugMode) {
      console.log(`[EventBus] Emit: ${eventName}`, data);
    }

    // データ検証
    this._validateEventData(eventName, data);

    // Phaserイベントシステムを使用して発火
    this.scene.events.emit(eventName, data);
  }

  /**
   * イベントリスナーを登録
   * @param {string} eventName - イベント名
   * @param {Function} callback - コールバック関数
   * @param {Object} context - thisコンテキスト
   */
  on(eventName, callback, context = null) {
    if (this.debugMode) {
      console.log(`[EventBus] Register listener: ${eventName}`);
    }

    // リスナー情報を保存（デバッグ用）
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push({ callback, context });

    // Phaserイベントシステムに登録
    this.scene.events.on(eventName, callback, context);
  }

  /**
   * イベントリスナーを削除
   * @param {string} eventName - イベント名
   * @param {Function} callback - コールバック関数
   * @param {Object} context - thisコンテキスト
   */
  off(eventName, callback, context = null) {
    this.scene.events.off(eventName, callback, context);

    // リスナー情報からも削除
    if (this.listeners.has(eventName)) {
      const listeners = this.listeners.get(eventName);
      const index = listeners.findIndex(l => l.callback === callback && l.context === context);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * すべてのリスナーを削除
   */
  removeAllListeners() {
    this.scene.events.removeAllListeners();
    this.listeners.clear();
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled - デバッグモード有効フラグ
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * 登録されているリスナー数を取得
   * @param {string} eventName - イベント名
   * @returns {number} リスナー数
   */
  getListenerCount(eventName) {
    return this.listeners.get(eventName)?.length || 0;
  }

  /**
   * イベントデータの検証
   * @private
   */
  _validateEventData(eventName, data) {
    // 必須フィールドの検証
    switch (eventName) {
      case GAME_EVENTS.PLAYER_HP_CHANGE:
        if (typeof data.current !== 'number' || typeof data.max !== 'number') {
          console.warn(`[EventBus] Invalid data for ${eventName}:`, data);
        }
        break;
      case GAME_EVENTS.COMBO_UPDATE:
        if (typeof data.count !== 'number') {
          console.warn(`[EventBus] Invalid data for ${eventName}:`, data);
        }
        break;
      // 他のイベントの検証も同様に追加
    }
  }
}