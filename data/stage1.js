/**
 * ステージ1: スチームパンク路地裏
 * 蒸気管が走る薄暗い路地で、工場労働者の暴徒と蒸気鎧のボスとの戦い
 */

// ステージ定数
export const STAGE_CONSTANTS = {
  // ステージ寸法
  STAGE_WIDTH: 3000,
  STAGE_HEIGHT: 540,
  
  // 奥行き範囲（Y座標）
  GROUND_Y_MIN: 360,
  GROUND_Y_MAX: 480,
  
  // カメラ・スクロール設定
  CAMERA_FOLLOW_LERP: 0.1,
  SCROLL_MARGIN: 100,  // 画面端からのマージン
};

/**
 * ステージ1のメインデータ
 */
export const STAGE1 = {
  // ステージ基本情報
  id: 'stage1',
  name: 'スチームパンク路地裏',
  width: STAGE_CONSTANTS.STAGE_WIDTH,
  height: STAGE_CONSTANTS.STAGE_HEIGHT,
  
  // 背景設定
  background: {
    key: 'bg_alley',
    parallaxLayers: [
      { key: 'bg_pipes', scrollFactor: 0.3 },      // 遠景の蒸気管
      { key: 'bg_buildings', scrollFactor: 0.6 },  // 中景の建物
      { key: 'bg_foreground', scrollFactor: 1.0 }, // 前景の路地
    ]
  },

  // 敵出現イベント（X座標トリガー）
  spawnEvents: [
    {
      id: 'wave1',
      triggerX: 500,
      description: '最初の工場労働者集団',
      enemies: [
        {
          type: 'grunt',
          offsetX: 0,     // カメラ右端からの相対位置
          groundY: 400,
          spawnDelay: 0,  // ms
        },
        {
          type: 'grunt',
          offsetX: 80,
          groundY: 460,
          spawnDelay: 200,
        },
        {
          type: 'grunt',
          offsetX: 160,
          groundY: 430,
          spawnDelay: 400,
        },
      ],
      // ウェーブクリア条件
      clearCondition: 'all_enemies_defeated',
      // クリア時のリワード
      rewards: {
        baseScore: 300,
        timeBonus: true,
      }
    },

    {
      id: 'wave2_mini',
      triggerX: 1200,
      description: '中間地点の小グループ',
      enemies: [
        {
          type: 'grunt',
          offsetX: 0,
          groundY: 420,
          spawnDelay: 0,
        },
        {
          type: 'grunt',
          offsetX: 80,
          groundY: 450,
          spawnDelay: 300,
        },
      ],
      clearCondition: 'all_enemies_defeated',
      rewards: {
        baseScore: 200,
        timeBonus: true,
      }
    },

    {
      id: 'boss_encounter',
      triggerX: 2000,
      description: '蒸気鎧の兵士ボス戦',
      enemies: [
        {
          type: 'boss',
          offsetX: 0,
          groundY: 440,
          spawnDelay: 0,
        },
      ],
      clearCondition: 'all_enemies_defeated',
      rewards: {
        baseScore: 1000,
        timeBonus: true,
        stageClear: true,
      },
      // ボス戦専用設定
      bossEncounter: {
        cameraLock: true,
        bgmChange: 'boss_theme',
        introSequence: {
          duration: 2000,  // ms
          bossIntroText: '蒸気鎧の兵士が立ちはだかる！',
        }
      }
    },
  ],

  // 武器配置（ステージ上の固定位置）
  weaponPlacements: [
    {
      id: 'pipe1',
      type: 'steam_pipe',
      x: 300,
      groundY: 430,
      respawn: false,  // 一度拾ったら復活しない
    },
    {
      id: 'gear1',
      type: 'gear_star',
      x: 800,
      groundY: 460,
      respawn: false,
    },
    {
      id: 'lantern1',
      type: 'spark_lantern',
      x: 1600,
      groundY: 420,
      respawn: false,
    },
    // ボス戦前の最後の武器
    {
      id: 'pipe2',
      type: 'steam_pipe',
      x: 1900,
      groundY: 440,
      respawn: false,
    },
  ],

  // 環境オブジェクト（破壊可能オブジェクト等）
  environmentObjects: [
    {
      type: 'steam_vent',
      x: 600,
      groundY: 380,
      width: 60,
      height: 20,
      // 定期的に蒸気を噴射（視覚効果のみ）
      effect: {
        interval: 3000,  // ms
        duration: 1000,
        damage: 0,       // ダメージなし（演出のみ）
      }
    },
    {
      type: 'gear_pile',
      x: 1000,
      groundY: 470,
      width: 80,
      height: 40,
      destructible: true,
      hp: 20,
      dropItems: ['gear_star'],  // 破壊時のドロップ
    },
    {
      type: 'steam_pipe_obstacle',
      x: 1500,
      groundY: 350,
      width: 100,
      height: 30,
      // プレイヤーの移動を一部制限（奥行きの上限を狭める）
      collision: {
        type: 'depth_limit',
        restrictY: 380,  // この位置より奥に行けない
      }
    },
  ],

  // ステージクリア条件
  clearConditions: {
    primary: 'defeat_all_bosses',
    secondary: [
      'collect_all_weapons',    // 全武器を一度は拾う
      'no_damage_bonus',        // ノーダメージクリア
      'time_attack_bonus',      // 制限時間内クリア
    ]
  },

  // ステージ固有のゲーム設定
  gameSettings: {
    timeLimit: 300000,        // 5分（ms）
    comboResetTime: 1500,     // ms
    maxEnemiesOnScreen: 6,    // 同時出現敵数制限
    playerSpawnX: 100,        // プレイヤー開始位置
    playerSpawnY: 440,
  },

  // デバッグ・テスト用設定
  debug: {
    skipToWave: null,         // 'wave1', 'wave2_mini', 'boss_encounter' or null
    infiniteWeapons: false,   // 武器の耐久度無限
    showTriggerLines: false,  // スポーントリガーの可視化
    godMode: false,           // プレイヤー無敵
  }
};

/**
 * ステージデータの検証関数
 * 開発時にデータの整合性をチェック
 */
export function validateStageData(stageData) {
  const errors = [];

  // 必須フィールドの確認
  if (!stageData.id) errors.push('Stage ID is required');
  if (!stageData.width || stageData.width <= 0) errors.push('Invalid stage width');
  if (!stageData.spawnEvents || stageData.spawnEvents.length === 0) {
    errors.push('At least one spawn event is required');
  }

  // スポーンイベントの検証
  stageData.spawnEvents?.forEach((event, index) => {
    if (!event.triggerX || event.triggerX < 0) {
      errors.push(`Spawn event ${index}: Invalid triggerX`);
    }
    if (!event.enemies || event.enemies.length === 0) {
      errors.push(`Spawn event ${index}: No enemies defined`);
    }
    
    // triggerXの順序確認（昇順である必要がある）
    if (index > 0 && event.triggerX <= stageData.spawnEvents[index - 1].triggerX) {
      errors.push(`Spawn event ${index}: triggerX must be greater than previous event`);
    }
  });

  // 武器配置の検証
  stageData.weaponPlacements?.forEach((weapon, index) => {
    if (!weapon.type) {
      errors.push(`Weapon placement ${index}: Missing weapon type`);
    }
    if (weapon.x < 0 || weapon.x > stageData.width) {
      errors.push(`Weapon placement ${index}: X position out of bounds`);
    }
    if (weapon.groundY < STAGE_CONSTANTS.GROUND_Y_MIN || 
        weapon.groundY > STAGE_CONSTANTS.GROUND_Y_MAX) {
      errors.push(`Weapon placement ${index}: groundY out of bounds`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ステージデータから特定のウェーブを取得
 */
export function getWaveById(stageData, waveId) {
  return stageData.spawnEvents.find(event => event.id === waveId);
}

/**
 * 指定X座標で発生するスポーンイベントを取得
 */
export function getSpawnEventAtX(stageData, x) {
  return stageData.spawnEvents.find(event => event.triggerX <= x);
}

/**
 * ステージ内の武器配置をタイプ別に取得
 */
export function getWeaponPlacementsByType(stageData, weaponType) {
  return stageData.weaponPlacements.filter(placement => placement.type === weaponType);
}

/**
 * ステージの進行率を計算（0.0 - 1.0）
 */
export function calculateStageProgress(stageData, currentX) {
  const lastTriggerX = Math.max(...stageData.spawnEvents.map(e => e.triggerX));
  return Math.min(currentX / lastTriggerX, 1.0);
}

// デフォルトエクスポート
export default STAGE1;