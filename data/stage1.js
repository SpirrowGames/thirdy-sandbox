/**
 * ステージ1のデータ定義
 * スポーンイベント、武器配置、背景設定を含む
 */
export const STAGE1 = {
  // ステージ基本情報
  id: 'stage1',
  name: '蒸気管の路地',
  width: 3000,
  height: 540,
  background: 'bg_steam_alley',
  
  // BGM設定
  bgm: {
    normal: 'bgm_stage1',
    boss: 'bgm_boss_battle'
  },

  // スポーンイベント（X座標トリガーベース）
  spawnEvents: [
    {
      id: 'wave_1',
      triggerX: 500,
      type: 'wave',
      lockScroll: true,
      enemies: [
        { 
          type: 'grunt', 
          offsetX: 0,   
          groundY: 400,
          delay: 0        // スポーン遅延（ms）
        },
        { 
          type: 'grunt', 
          offsetX: 80,  
          groundY: 460,
          delay: 200
        },
        { 
          type: 'grunt', 
          offsetX: 160, 
          groundY: 430,
          delay: 400
        }
      ],
      onClear: {
        unlockScroll: true,
        message: null
      }
    },
    
    {
      id: 'wave_2',
      triggerX: 1200,
      type: 'wave',
      lockScroll: true,
      enemies: [
        { 
          type: 'grunt', 
          offsetX: 0,  
          groundY: 420,
          delay: 0
        },
        { 
          type: 'grunt', 
          offsetX: 80, 
          groundY: 450,
          delay: 300
        }
      ],
      onClear: {
        unlockScroll: true,
        message: null
      }
    },

    {
      id: 'boss_battle',
      triggerX: 2000,
      type: 'boss',
      lockScroll: true,
      enemies: [
        { 
          type: 'boss', 
          offsetX: 0, 
          groundY: 440,
          delay: 1000    // ボス登場演出用の遅延
        }
      ],
      onStart: {
        bgmChange: 'bgm_boss_battle',
        cameraEffect: 'shake',
        message: '蒸気鎧の兵士が現れた！'
      },
      onClear: {
        unlockScroll: false,
        bgmChange: 'bgm_victory',
        message: 'ステージクリア！',
        stageClear: true
      }
    }
  ],

  // 武器配置
  weaponPlacements: [
    { 
      type: 'steam_pipe',  
      x: 300,  
      groundY: 430,
      respawn: false      // 一度拾ったら再出現しない
    },
    { 
      type: 'gear_star',   
      x: 800,  
      groundY: 460,
      respawn: false
    },
    { 
      type: 'spark_lantern', 
      x: 1600, 
      groundY: 420,
      respawn: false
    },
    {
      type: 'steam_pipe',
      x: 1900,
      groundY: 445,
      respawn: false      // ボス戦前の最後の武器
    }
  ],

  // 環境オブジェクト（破壊可能オブジェクト等）
  environmentObjects: [
    {
      type: 'steam_barrel',
      x: 600,
      groundY: 440,
      destructible: true,
      hp: 1,
      dropItems: ['health_small']
    },
    {
      type: 'gear_crate',
      x: 1000,
      groundY: 420,
      destructible: true,
      hp: 2,
      dropItems: ['score_bonus']
    },
    {
      type: 'pipe_obstacle',
      x: 1500,
      groundY: 460,
      destructible: false,
      collision: true     // 移動を阻害する障害物
    }
  ],

  // ステージ固有設定
  settings: {
    scrollSpeed: 200,           // 自動スクロール速度（px/s）
    playerStartX: 100,
    playerStartY: 440,
    cameraFollowOffset: 200,    // プレイヤーより先行してカメラを移動
    ambientEffects: [
      {
        type: 'steam_particles',
        x: 400,
        y: 300,
        continuous: true
      },
      {
        type: 'gear_sparks',
        x: 1200,
        y: 350,
        continuous: true
      }
    ]
  },

  // 隠し要素・分岐
  secrets: [
    {
      triggerX: 900,
      triggerY: 360,        // 上の方に移動すると発見
      type: 'hidden_area',
      rewards: ['weapon_upgrade', 'score_bonus'],
      message: '隠されたアイテムを発見した！'
    }
  ]
};

// ステージデータ検証用のスキーマ
export const STAGE_SCHEMA = {
  required: ['id', 'name', 'width', 'spawnEvents'],
  properties: {
    spawnEvents: {
      type: 'array',
      items: {
        required: ['id', 'triggerX', 'type', 'enemies'],
        properties: {
          enemies: {
            type: 'array',
            items: {
              required: ['type', 'offsetX', 'groundY'],
              properties: {
                groundY: { min: 360, max: 480 }  // GROUND_Y_MIN/MAX範囲チェック
              }
            }
          }
        }
      }
    }
  }
};

// ステージデータ検証関数
export function validateStageData(stageData) {
  const errors = [];
  
  // 必須フィールドチェック
  if (!stageData.id) errors.push('Stage ID is required');
  if (!stageData.spawnEvents || !Array.isArray(stageData.spawnEvents)) {
    errors.push('spawnEvents must be an array');
  }
  
  // スポーンイベントの検証
  if (stageData.spawnEvents) {
    stageData.spawnEvents.forEach((event, index) => {
      if (!event.id) errors.push(`spawnEvent[${index}]: id is required`);
      if (typeof event.triggerX !== 'number') {
        errors.push(`spawnEvent[${index}]: triggerX must be a number`);
      }
      if (!event.enemies || !Array.isArray(event.enemies)) {
        errors.push(`spawnEvent[${index}]: enemies must be an array`);
      }
      
      // 敵データの検証
      if (event.enemies) {
        event.enemies.forEach((enemy, enemyIndex) => {
          if (enemy.groundY < 360 || enemy.groundY > 480) {
            errors.push(`spawnEvent[${index}].enemies[${enemyIndex}]: groundY must be between 360-480`);
          }
        });
      }
    });
  }
  
  // triggerXの昇順チェック
  if (stageData.spawnEvents && stageData.spawnEvents.length > 1) {
    for (let i = 1; i < stageData.spawnEvents.length; i++) {
      if (stageData.spawnEvents[i].triggerX <= stageData.spawnEvents[i-1].triggerX) {
        errors.push(`spawnEvent triggerX must be in ascending order: ${stageData.spawnEvents[i-1].triggerX} >= ${stageData.spawnEvents[i].triggerX}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ステージデータ取得用ユーティリティ
export class StageDataLoader {
  static getStageById(stageId) {
    switch (stageId) {
      case 'stage1':
        return STAGE1;
      default:
        throw new Error(`Unknown stage ID: ${stageId}`);
    }
  }
  
  static validateAndLoad(stageId) {
    const stageData = this.getStageById(stageId);
    const validation = validateStageData(stageData);
    
    if (!validation.valid) {
      console.error('Stage data validation failed:', validation.errors);
      throw new Error(`Invalid stage data for ${stageId}: ${validation.errors.join(', ')}`);
    }
    
    return stageData;
  }
  
  // スポーンイベントをX座標でソート
  static getSortedSpawnEvents(stageData) {
    return [...stageData.spawnEvents].sort((a, b) => a.triggerX - b.triggerX);
  }
  
  // 特定タイプのイベントを取得
  static getEventsByType(stageData, type) {
    return stageData.spawnEvents.filter(event => event.type === type);
  }
  
  // ボスイベントを取得（通常は1つ）
  static getBossEvent(stageData) {
    const bossEvents = this.getEventsByType(stageData, 'boss');
    return bossEvents.length > 0 ? bossEvents[0] : null;
  }
}