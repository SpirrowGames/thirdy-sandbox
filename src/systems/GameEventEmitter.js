import { GAME_EVENTS } from '../types/GameEvents.js';

/**
 * ゲーム状態の変更を監視してUISceneにイベントを発信するクラス
 */
export class GameEventEmitter {
  constructor(scene) {
    this.scene = scene;
    this.previousStates = {
      playerHp: null,
      combo: null,
      score: null,
      bossHp: null,
      weapon: null,
      gameState: null
    };
    
    // デバウンス用タイマー
    this.debounceTimers = new Map();
  }

  /**
   * プレイヤーHP変更を通知
   */
  emitPlayerHpChange(current, max) {
    const percentage = Math.round((current / max) * 100);
    const eventData = { current, max, percentage };
    
    // 前回と同じ値の場合は発信しない
    if (this.previousStates.playerHp && 
        this.previousStates.playerHp.current === current) {
      return;
    }
    
    this.previousStates.playerHp = eventData;
    this.scene.events.emit(GAME_EVENTS.PLAYER_HP_CHANGE, eventData);
    
    // デバッグログ
    console.log(`[GameEvent] Player HP: ${current}/${max} (${percentage}%)`);
  }

  /**
   * コンボ更新を通知
   */
  emitComboUpdate(count, multiplier = 1.0) {
    const isActive = count > 0;
    const eventData = { count, multiplier, isActive };
    
    // コンボ数が変わった場合のみ発信
    if (this.previousStates.combo && 
        this.previousStates.combo.count === count) {
      return;
    }
    
    this.previousStates.combo = eventData;
    this.scene.events.emit(GAME_EVENTS.COMBO_UPDATE, eventData);
    
    console.log(`[GameEvent] Combo: ${count}x (multiplier: ${multiplier})`);
  }

  /**
   * スコア更新を通知（デバウンス付き）
   */
  emitScoreUpdate(score, lastEarnedPoints = 0, reason = 'enemy_defeat') {
    const eventData = { score, lastEarnedPoints, reason };
    
    // 高頻度更新を避けるため100ms間隔でデバウンス
    this.debounceEmit('score', () => {
      this.previousStates.score = eventData;
      this.scene.events.emit(GAME_EVENTS.SCORE_UPDATE, eventData);
      console.log(`[GameEvent] Score: ${score} (+${lastEarnedPoints}, ${reason})`);
    }, 100);
  }

  /**
   * ボスHP変更を通知
   */
  emitBossHpChange(current, max, phase = 1) {
    const percentage = Math.round((current / max) * 100);
    const eventData = { current, max, percentage, phase };
    
    // HP値とフェーズが変わった場合のみ発信
    if (this.previousStates.bossHp && 
        this.previousStates.bossHp.current === current &&
        this.previousStates.bossHp.phase === phase) {
      return;
    }
    
    this.previousStates.bossHp = eventData;
    this.scene.events.emit(GAME_EVENTS.BOSS_HP_CHANGE, eventData);
    
    console.log(`[GameEvent] Boss HP: ${current}/${max} (Phase ${phase})`);
  }

  /**
   * 武器変更を通知
   */
  emitWeaponChange(weapon) {
    let eventData;
    
    if (weapon) {
      eventData = {
        name: weapon.name,
        durability: weapon.durability,
        maxDurability: weapon.maxDurability,
        type: weapon.type
      };
    } else {
      eventData = {
        name: null,
        durability: 0,
        maxDurability: 0,
        type: null
      };
    }
    
    // 武器の種類または耐久度が変わった場合のみ発信
    if (this.previousStates.weapon && 
        this.previousStates.weapon.type === eventData.type &&
        this.previousStates.weapon.durability === eventData.durability) {
      return;
    }
    
    this.previousStates.weapon = eventData;
    this.scene.events.emit(GAME_EVENTS.WEAPON_CHANGE, eventData);
    
    if (weapon) {
      console.log(`[GameEvent] Weapon: ${weapon.name} (${weapon.durability}/${weapon.maxDurability})`);
    } else {
      console.log(`[GameEvent] Weapon: none`);
    }
  }

  /**
   * ゲーム状態変更を通知
   */
  emitGameStateChange(state, waveNumber = null) {
    const eventData = { state, waveNumber };
    
    if (this.previousStates.gameState && 
        this.previousStates.gameState.state === state) {
      return;
    }
    
    this.previousStates.gameState = eventData;
    this.scene.events.emit(GAME_EVENTS.GAME_STATE_CHANGE, eventData);
    
    console.log(`[GameEvent] Game State: ${state}${waveNumber ? ` (Wave ${waveNumber})` : ''}`);
  }

  /**
   * ウェーブ開始を通知
   */
  emitWaveStart(waveNumber) {
    this.scene.events.emit(GAME_EVENTS.WAVE_START, { waveNumber });
    console.log(`[GameEvent] Wave Start: ${waveNumber}`);
  }

  /**
   * ウェーブクリアを通知
   */
  emitWaveClear(waveNumber, bonus = 0) {
    this.scene.events.emit(GAME_EVENTS.WAVE_CLEAR, { waveNumber, bonus });
    console.log(`[GameEvent] Wave Clear: ${waveNumber} (bonus: ${bonus})`);
  }

  /**
   * ステージクリアを通知
   */
  emitStageClear(finalScore, timeBonus = 0) {
    this.scene.events.emit(GAME_EVENTS.STAGE_CLEAR, { finalScore, timeBonus });
    console.log(`[GameEvent] Stage Clear: ${finalScore} (time bonus: ${timeBonus})`);
  }

  /**
   * デバウンス機能付きイベント発信
   */
  debounceEmit(key, callback, delay) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  /**
   * クリーンアップ
   */
  destroy() {
    // デバウンスタイマーをクリア
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.previousStates = null;
  }
}