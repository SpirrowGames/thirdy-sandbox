import { EventBus } from '../systems/EventBus.js';
import { GAME_EVENTS } from '../events/GameEvents.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // EventBusの初期化
    this.eventBus = new EventBus(this);
    
    // 開発時のみデバッグモード有効
    if (process.env.NODE_ENV === 'development') {
      this.eventBus.setDebugMode(true);
    }

    // ゲームエンティティの初期化
    this.initializeEntities();
    
    // 初期状態のイベント発火
    this.emitInitialEvents();
  }

  /**
   * プレイヤーHP変更イベントを発火
   * @param {number} current - 現在HP
   * @param {number} max - 最大HP
   */
  emitPlayerHpChange(current, max) {
    const percentage = max > 0 ? current / max : 0;
    this.eventBus.emit(GAME_EVENTS.PLAYER_HP_CHANGE, {
      current,
      max,
      percentage
    });
  }

  /**
   * コンボ更新イベントを発火
   * @param {number} count - コンボ数
   */
  emitComboUpdate(count) {
    const multiplier = this.calculateComboMultiplier(count);
    const isMax = count >= 50; // 最大コンボ数の閾値

    this.eventBus.emit(GAME_EVENTS.COMBO_UPDATE, {
      count,
      multiplier,
      isMax
    });
  }

  /**
   * ボスHP変更イベントを発火
   * @param {number} current - 現在HP
   * @param {number} max - 最大HP
   * @param {number} phase - フェーズ番号
   */
  emitBossHpChange(current, max, phase = 1) {
    const percentage = max > 0 ? current / max : 0;
    this.eventBus.emit(GAME_EVENTS.BOSS_HP_CHANGE, {
      current,
      max,
      percentage,
      phase
    });
  }

  /**
   * 武器変更イベントを発火
   * @param {Object|null} weapon - 武器オブジェクト（null=素手）
   */
  emitWeaponChange(weapon) {
    const data = weapon ? {
      name: weapon.name,
      durability: weapon.durability,
      maxDurability: weapon.maxDurability,
      type: weapon.type
    } : {
      name: null,
      durability: 0,
      maxDurability: 0,
      type: 'bare_hands'
    };

    this.eventBus.emit(GAME_EVENTS.WEAPON_CHANGE, data);
  }

  /**
   * スコア更新イベントを発火
   * @param {Object} scoreData - スコアデータ
   */
  emitScoreUpdate(scoreData) {
    this.eventBus.emit(GAME_EVENTS.SCORE_UPDATE, {
      total: scoreData.total || 0,
      base: scoreData.base || 0,
      combo: scoreData.combo || 0,
      time: scoreData.time || 0
    });
  }

  /**
   * ウェーブ開始イベントを発火
   * @param {number} waveNumber - ウェーブ番号
   * @param {number} enemyCount - 敵数
   */
  emitWaveStart(waveNumber, enemyCount) {
    this.eventBus.emit(GAME_EVENTS.WAVE_START, {
      waveNumber,
      enemyCount
    });
  }

  /**
   * ウェーブクリアイベントを発火
   * @param {number} waveNumber - ウェーブ番号
   * @param {number} clearTime - クリア時間（秒）
   */
  emitWaveClear(waveNumber, clearTime) {
    this.eventBus.emit(GAME_EVENTS.WAVE_CLEAR, {
      waveNumber,
      clearTime
    });
  }

  /**
   * ステージクリアイベントを発火
   * @param {Object} clearData - クリアデータ
   */
  emitStageClear(clearData) {
    this.eventBus.emit(GAME_EVENTS.STAGE_CLEAR, clearData);
  }

  /**
   * 初期状態のイベントを発火
   * @private
   */
  emitInitialEvents() {
    // プレイヤーの初期HP
    this.emitPlayerHpChange(100, 100);
    
    // 初期コンボ
    this.emitComboUpdate(0);
    
    // 初期スコア
    this.emitScoreUpdate({ total: 0, base: 0, combo: 0, time: 0 });
    
    // 初期武器状態（素手）
    this.emitWeaponChange(null);
  }

  /**
   * コンボ倍率を計算
   * @private
   * @param {number} count - コンボ数
   * @returns {number} 倍率
   */
  calculateComboMultiplier(count) {
    if (count < 5) return 1.0;
    if (count < 10) return 1.2;
    if (count < 20) return 1.5;
    if (count < 50) return 2.0;
    return 3.0; // 最大倍率
  }

  /**
   * エンティティの初期化
   * @private
   */
  initializeEntities() {
    // プレイヤー、敵、武器などの初期化処理
    // 実際のエンティティ実装に応じて詳細を追加
  }

  /**
   * シーン終了時のクリーンアップ
   */
  shutdown() {
    if (this.eventBus) {
      this.eventBus.removeAllListeners();
    }
  }
}