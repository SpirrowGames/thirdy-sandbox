import { GAME_EVENTS } from './GameEvents.js';

/**
 * ゲームイベント発信管理クラス
 * GameSceneで使用し、各種状態変更をUISceneに通知する
 */
export class GameEventEmitter {
  constructor(scene) {
    this.scene = scene;
    this.events = scene.events;
    
    // デバッグモード（開発時のイベント追跡用）
    this.debugMode = false;
    
    // イベント発信履歴（デバッグ用）
    this.eventHistory = [];
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled 
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * イベント発信の共通処理
   * @param {string} eventName 
   * @param {Object} data 
   * @private
   */
  _emit(eventName, data) {
    if (this.debugMode) {
      console.log(`[GameEvent] ${eventName}:`, data);
      this.eventHistory.push({ 
        event: eventName, 
        data: { ...data }, 
        timestamp: Date.now() 
      });
      
      // 履歴が長くなりすぎないよう制限
      if (this.eventHistory.length > 100) {
        this.eventHistory.shift();
      }
    }
    
    this.events.emit(eventName, data);
  }

  // === プレイヤー関連イベント ===
  
  /**
   * プレイヤーHP変更を通知
   * @param {number} current 現在HP
   * @param {number} max 最大HP
   */
  emitPlayerHpChange(current, max) {
    this._emit(GAME_EVENTS.PLAYER_HP_CHANGE, {
      current,
      max,
      percentage: max > 0 ? current / max : 0
    });
  }

  /**
   * プレイヤーダメージを通知
   * @param {number} damage ダメージ量
   * @param {string} source ダメージ源
   */
  emitPlayerDamage(damage, source = 'unknown') {
    this._emit(GAME_EVENTS.PLAYER_DAMAGE, {
      damage,
      source,
      timestamp: Date.now()
    });
  }

  // === コンボ関連イベント ===
  
  /**
   * コンボ更新を通知
   * @param {number} count コンボ数
   * @param {number} multiplier 倍率
   * @param {boolean} isNewRecord 新記録かどうか
   */
  emitComboUpdate(count, multiplier = 1.0, isNewRecord = false) {
    this._emit(GAME_EVENTS.COMBO_UPDATE, {
      count,
      multiplier,
      isNewRecord
    });
  }

  /**
   * コンボリセットを通知
   * @param {number} finalCount 最終コンボ数
   */
  emitComboReset(finalCount = 0) {
    this._emit(GAME_EVENTS.COMBO_RESET, {
      finalCount
    });
  }

  // === 武器関連イベント ===
  
  /**
   * 武器変更を通知
   * @param {Object|null} weapon 武器オブジェクト（null = 素手）
   */
  emitWeaponChange(weapon) {
    const data = weapon ? {
      name: weapon.name,
      type: weapon.type,
      durability: weapon.durability,
      maxDurability: weapon.maxDurability,
      isSpecialReady: weapon.durability >= 2 // 特殊技は耐久2以上必要
    } : {
      name: null,
      type: null,
      durability: 0,
      maxDurability: 0,
      isSpecialReady: false
    };
    
    this._emit(GAME_EVENTS.WEAPON_CHANGE, data);
  }

  /**
   * 武器耐久度変更を通知
   * @param {Object} weapon 武器オブジェクト
   */
  emitWeaponDurabilityChange(weapon) {
    this._emit(GAME_EVENTS.WEAPON_DURABILITY_CHANGE, {
      durability: weapon.durability,
      maxDurability: weapon.maxDurability,
      isSpecialReady: weapon.durability >= 2
    });
  }

  /**
   * 武器破壊を通知
   * @param {string} weaponName 破壊された武器名
   */
  emitWeaponBreak(weaponName) {
    this._emit(GAME_EVENTS.WEAPON_BREAK, {
      weaponName
    });
  }

  // === ボス関連イベント ===
  
  /**
   * ボスHP変更を通知
   * @param {number} current 現在HP
   * @param {number} max 最大HP
   * @param {number} phase 現在フェーズ
   */
  emitBossHpChange(current, max, phase = 1) {
    this._emit(GAME_EVENTS.BOSS_HP_CHANGE, {
      current,
      max,
      percentage: max > 0 ? current / max : 0,
      phase
    });
  }

  /**
   * ボスフェーズ変更を通知
   * @param {number} newPhase 新しいフェーズ
   * @param {number} oldPhase 前のフェーズ
   */
  emitBossPhaseChange(newPhase, oldPhase) {
    this._emit(GAME_EVENTS.BOSS_PHASE_CHANGE, {
      newPhase,
      oldPhase
    });
  }

  // === スコア関連イベント ===
  
  /**
   * スコア更新を通知
   * @param {Object} scoreData スコアデータ
   */
  emitScoreUpdate(scoreData) {
    this._emit(GAME_EVENTS.SCORE_UPDATE, {
      total: scoreData.total || 0,
      base: scoreData.base || 0,
      combo: scoreData.combo || 0,
      time: scoreData.time || 0,
      recent: scoreData.recent || 0
    });
  }

  // === ゲーム進行関連イベント ===
  
  /**
   * ウェーブ開始を通知
   * @param {number} waveNumber ウェーブ番号
   * @param {number} enemyCount 敵の数
   */
  emitWaveStart(waveNumber, enemyCount) {
    this._emit(GAME_EVENTS.WAVE_START, {
      waveNumber,
      enemyCount
    });
  }

  /**
   * ウェーブクリアを通知
   * @param {number} waveNumber クリアしたウェーブ番号
   * @param {number} bonusScore ボーナススコア
   */
  emitWaveClear(waveNumber, bonusScore = 0) {
    this._emit(GAME_EVENTS.WAVE_CLEAR, {
      waveNumber,
      bonusScore
    });
  }
}