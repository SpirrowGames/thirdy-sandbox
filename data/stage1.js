/**
 * ステージ1: 蒸気管の走る路地
 * ベルトスクロールアクションゲームのメインステージデータ
 * 
 * 構成:
 * - 3つのスポーンウェーブ (X座標トリガー)
 * - 3つの武器配置ポイント
 * - スチームパンク路地の背景設定
 */

export const STAGE1 = {
  // ステージ基本情報
  id: 'stage1',
  name: '蒸気管の走る路地',
  description: '工場地帯の裏路地。蒸気管から立ち上る煙が視界を遮る',
  
  // ステージサイズ
  width: 3000,
  height: 540,
  
  // 背景・環境設定
  background: {
    key: 'bg_alley',
    parallaxLayers: [
      { key: 'bg_far', scrollFactor: 0.1 },      // 遠景（工場の煙突）
      { key: 'bg_mid', scrollFactor: 0.3 },      // 中景（建物）
      { key: 'bg_near', scrollFactor: 0.7 }      // 近景（蒸気管）
    ]
  },
  
  // プレイヤー開始位置
  playerStart: {
    x: 100,
    groundY: 440
  },
  
  // 奥行き移動範囲
  depthBounds: {
    min: 360,  // 上限（奥）
    max: 480   // 下限（手前）
  },
  
  // スポーンイベント（X座標トリガー）
  spawnEvents: [
    {
      id: 'wave1',
      triggerX: 500,
      description: '最初の雑魚ウェーブ - 工場労働者3体',
      enemies: [
        {
          type: 'grunt',
          offsetX: 0,      // カメラ右端からのオフセット
          groundY: 400,
          spawnDelay: 0    // ms
        },
        {
          type: 'grunt',
          offsetX: 80,
          groundY: 460,
          spawnDelay: 200
        },
        {
          type: 'grunt',
          offsetX: 160,
          groundY: 430,
          spawnDelay: 400
        }
      ],
      // ウェーブクリア条件
      clearCondition: 'all_defeated',
      // クリア時の報酬
      rewards: {
        baseScore: 300
      }
    },
    
    {
      id: 'wave2',
      triggerX: 1200,
      description: '中間ウェーブ - 工場労働者2体',
      enemies: [
        {
          type: 'grunt',
          offsetX: 0,
          groundY: 420,
          spawnDelay: 0
        },
        {
          type: 'grunt',
          offsetX: 80,
          groundY: 450,
          spawnDelay: 300
        }
      ],
      clearCondition: 'all_defeated',
      rewards: {
        baseScore: 200
      }
    },
    
    {
      id: 'boss_wave',
      triggerX: 2000,
      description: 'ボス戦 - 蒸気鎧の兵士',
      enemies: [
        {
          type: 'boss',
          offsetX: 200,    // ボスは少し奥に配置
          groundY: 440,
          spawnDelay: 0
        }
      ],
      clearCondition: 'all_defeated',
      rewards: {
        baseScore: 1000,
        stageClear: true
      },
      // ボス戦専用設定
      bossSettings: {
        lockCamera: true,           // カメラを完全固定
        backgroundChange: 'boss',   // 背景切り替え
        musicChange: 'boss_theme'   // BGM切り替え
      }
    }
  ],
  
  // 武器配置
  weaponPlacements: [
    {
      id: 'weapon1',
      type: 'steam_pipe',
      x: 300,
      groundY: 430,
      description: '序盤の武器 - スチームパイプ'
    },
    {
      id: 'weapon2', 
      type: 'gear_star',
      x: 800,
      groundY: 460,
      description: '中盤の武器 - 歯車手裏剣（ボス弱点）'
    },
    {
      id: 'weapon3',
      type: 'spark_lantern',
      x: 1600,
      groundY: 420,
      description: '終盤の武器 - 電気ランタン'
    }
  ],
  
  // 環境ギミック（将来拡張用）
  environmentObjects: [
    {
      id: 'steam_vent1',
      type: 'steam_vent',
      x: 600,
      groundY: 380,
      properties: {
        interval: 3000,    // 3秒間隔で蒸気噴出
        damage: 5,
        duration: 1000     // 1秒間持続
      }
    },
    {
      id: 'crate1',
      type: 'destructible_crate',
      x: 1000,
      groundY: 450,
      properties: {
        hp: 1,
        dropChance: 0.3,   // 30%の確率でアイテムドロップ
        possibleDrops: ['health_small', 'score_bonus']
      }
    }
  ],
  
  // ステージ固有の設定
  settings: {
    // スクロール設定
    scrollSpeed: 100,              // 自動スクロール時の速度（px/s）
    scrollLockDuration: 0,         // ウェーブ開始時のロック時間（ms）
    
    // 環境効果
    ambientEffects: {
      steamParticles: true,        // 蒸気パーティクル
      emberParticles: false,       // 火の粉パーティクル
      fogOverlay: 0.1             // 霧のオーバーレイ透明度
    },
    
    // 音響設定
    audio: {
      bgm: 'stage1_theme',
      ambientLoop: 'factory_ambient',
      volume: {
        bgm: 0.7,
        ambient: 0.3,
        sfx: 0.8
      }
    },
    
    // 難易度調整
    difficulty: {
      enemySpawnDelay: 1.0,        // スポーン遅延倍率
      enemyHealthMultiplier: 1.0,  // 敵HP倍率
      enemyDamageMultiplier: 1.0,  // 敵攻撃力倍率
      playerDamageMultiplier: 1.0  // プレイヤー攻撃力倍率
    }
  },
  
  // ステージクリア条件
  clearConditions: {
    primary: 'defeat_all_waves',   // 全ウェーブ撃破
    timeLimit: 300000,             // 制限時間5分（ms）
    minScore: 0                    // 最低スコア
  },
  
  // スコア計算設定
  scoring: {
    enemyDefeatBase: 100,          // 敵撃破基本スコア
    comboMultiplier: 1.2,          // コンボ倍率
    timeBonus: {
      maxBonus: 5000,              // 最大タイムボーナス
      threshold: 180000            // 3分以内クリアで満額
    },
    perfectBonus: 2000,            // 無被弾クリアボーナス
    weaponMasteryBonus: 500        // 全武器使用ボーナス
  }
};

// ステージデータの検証関数
export function validateStageData(stageData) {
  const errors = [];
  
  // 必須フィールドの確認
  if (!stageData.id) errors.push('ステージIDが未定義');
  if (!stageData.width || stageData.width <= 0) errors.push('ステージ幅が無効');
  if (!stageData.spawnEvents || stageData.spawnEvents.length === 0) {
    errors.push('スポーンイベントが未定義');
  }
  
  // スポーンイベントの検証
  stageData.spawnEvents?.forEach((event, index) => {
    if (!event.triggerX || event.triggerX < 0) {
      errors.push(`スポーンイベント${index}: triggerXが無効`);
    }
    if (!event.enemies || event.enemies.length === 0) {
      errors.push(`スポーンイベント${index}: 敵データが空`);
    }
    
    // 敵データの検証
    event.enemies?.forEach((enemy, enemyIndex) => {
      if (!enemy.type) {
        errors.push(`スポーンイベント${index}, 敵${enemyIndex}: typeが未定義`);
      }
      if (typeof enemy.groundY !== 'number') {
        errors.push(`スポーンイベント${index}, 敵${enemyIndex}: groundYが無効`);
      }
    });
  });
  
  // 武器配置の検証
  stageData.weaponPlacements?.forEach((weapon, index) => {
    if (!weapon.type) errors.push(`武器${index}: typeが未定義`);
    if (typeof weapon.x !== 'number') errors.push(`武器${index}: x座標が無効`);
    if (typeof weapon.groundY !== 'number') errors.push(`武器${index}: groundYが無効`);
  });
  
  return errors;
}

// ステージデータの前処理関数
export function preprocessStageData(stageData) {
  // スポーンイベントをX座標でソート
  const processedData = { ...stageData };
  processedData.spawnEvents = [...stageData.spawnEvents].sort((a, b) => a.triggerX - b.triggerX);
  
  // 各スポーンイベントにIDを付与（未定義の場合）
  processedData.spawnEvents.forEach((event, index) => {
    if (!event.id) {
      event.id = `wave_${index + 1}`;
    }
  });
  
  // 武器配置にIDを付与（未定義の場合）
  processedData.weaponPlacements?.forEach((weapon, index) => {
    if (!weapon.id) {
      weapon.id = `weapon_${index + 1}`;
    }
  });
  
  return processedData;
}