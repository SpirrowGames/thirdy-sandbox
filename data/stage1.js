/**
 * ステージ1: スチームパンク路地裏
 * 
 * 蒸気管が走る薄暗い路地で、工場労働者の暴徒と戦う。
 * 最後に蒸気鎧の兵士がボスとして登場。
 */

export const STAGE1 = {
  // ステージ基本設定
  name: 'スチームパンク路地裏',
  width: 3000,  // ステージ全幅（px）
  height: 540,  // 画面高さ
  
  // 背景設定
  background: {
    texture: 'bg_alley',
    parallax: [
      { texture: 'bg_pipes_far',  scrollFactor: 0.2 },   // 遠景の蒸気管
      { texture: 'bg_buildings',  scrollFactor: 0.5 },   // 中景の建物
      { texture: 'bg_pipes_near', scrollFactor: 0.8 },   // 近景の蒸気管
    ]
  },

  // 敵スポーンイベント（X座標トリガー）
  spawnEvents: [
    // 序盤ウェーブ - チュートリアル的な3体
    {
      triggerX: 500,
      name: 'opening_wave',
      description: '工場労働者の暴徒 × 3',
      enemies: [
        { 
          type: 'grunt', 
          offsetX: 0,      // カメラ右端からの相対位置
          groundY: 400,    // 奥行きY座標
          delay: 0         // 出現遅延（ms）
        },
        { 
          type: 'grunt', 
          offsetX: 80, 
          groundY: 460, 
          delay: 500       // 0.5秒後に出現
        },
        { 
          type: 'grunt', 
          offsetX: 160, 
          groundY: 430, 
          delay: 1000      // 1秒後に出現
        },
      ]
    },

    // 中間ウェーブ - 武器の有効性を学ぶ
    {
      triggerX: 1200,
      name: 'weapon_tutorial',
      description: '武器活用ウェーブ',
      enemies: [
        { 
          type: 'grunt', 
          offsetX: 0, 
          groundY: 420, 
          delay: 0 
        },
        { 
          type: 'grunt', 
          offsetX: 120, 
          groundY: 450, 
          delay: 800 
        },
      ]
    },

    // ボス前ウェーブ - 最後の雑魚戦
    {
      triggerX: 1800,
      name: 'pre_boss',
      description: 'ボス前の精鋭部隊',
      enemies: [
        { 
          type: 'grunt', 
          offsetX: 0, 
          groundY: 440, 
          delay: 0 
        },
        { 
          type: 'grunt', 
          offsetX: 60, 
          groundY: 400, 
          delay: 300 
        },
        { 
          type: 'grunt', 
          offsetX: 120, 
          groundY: 470, 
          delay: 600 
        },
        { 
          type: 'grunt', 
          offsetX: 180, 
          groundY: 430, 
          delay: 1200 
        },
      ]
    },

    // ボス戦
    {
      triggerX: 2400,
      name: 'boss_battle',
      description: '蒸気鎧の兵士',
      isBoss: true,
      backgroundChange: 'bg_boss_arena',  // ボス戦用背景に切り替え
      enemies: [
        { 
          type: 'boss', 
          offsetX: 200,    // ボスは少し奥に配置
          groundY: 440, 
          delay: 1500      // 演出後に登場
        },
      ]
    },
  ],

  // 武器配置（ステージ上の固定位置）
  weaponPlacements: [
    // 序盤 - 基本的なスチームパイプ
    {
      type: 'steam_pipe',
      x: 300,
      groundY: 430,
      description: '蒸気噴射が可能な配管の一部'
    },

    // 中盤 - 遠距離武器
    {
      type: 'gear_star',
      x: 800,
      groundY: 460,
      description: '工場から転がってきた精密歯車'
    },

    // ボス前 - 強力な近接武器
    {
      type: 'spark_lantern',
      x: 1600,
      groundY: 420,
      description: '電気を帯びた作業用ランタン'
    },

    // ボス戦エリア - 弱点武器（歯車手裏剣）
    {
      type: 'gear_star',
      x: 2200,
      groundY: 450,
      description: 'ボス戦用の予備武器'
    },
  ],

  // 環境ギミック（将来拡張用）
  environmentObjects: [
    // 蒸気噴出口 - 踏むとダメージ
    {
      type: 'steam_vent',
      x: 1000,
      groundY: 400,
      width: 60,
      height: 40,
      damage: 5,
      interval: 3000,  // 3秒間隔で噴出
      description: '定期的に蒸気を噴出する危険地帯'
    },

    // 破壊可能な木箱 - 武器やアイテムが出現する可能性
    {
      type: 'crate',
      x: 600,
      groundY: 440,
      width: 40,
      height: 40,
      hp: 1,
      dropTable: [
        { type: 'weapon', item: 'steam_pipe', chance: 0.3 },
        { type: 'health', amount: 20, chance: 0.2 },
      ],
      description: '叩くと壊れる木製の荷箱'
    },

    {
      type: 'crate',
      x: 1400,
      groundY: 420,
      width: 40,
      height: 40,
      hp: 1,
      dropTable: [
        { type: 'weapon', item: 'gear_star', chance: 0.4 },
        { type: 'health', amount: 20, chance: 0.2 },
      ],
      description: '工場の資材箱'
    },
  ],

  // ステージクリア条件
  clearConditions: {
    type: 'defeat_all_enemies',
    description: '全ての敵を倒してステージクリア',
    scoreMultiplier: 1.0,
    timeLimit: null,  // 制限時間なし
  },

  // BGM設定
  audio: {
    bgm: 'bgm_stage1',
    bossBgm: 'bgm_boss1',
    ambientSounds: [
      { sound: 'steam_ambient', volume: 0.3, loop: true },
      { sound: 'factory_distant', volume: 0.2, loop: true },
    ]
  },

  // デバッグ・調整用設定
  debug: {
    showSpawnTriggers: false,
    showWeaponPlacements: false,
    skipToWave: null,  // 数値指定で特定ウェーブから開始
    godMode: false,
  },
};

// ステージデータの検証関数
export function validateStage(stageData) {
  const errors = [];

  // 必須フィールドの確認
  if (!stageData.name) errors.push('ステージ名が未定義');
  if (!stageData.width || stageData.width <= 0) errors.push('ステージ幅が不正');
  if (!Array.isArray(stageData.spawnEvents)) errors.push('spawnEventsが配列ではない');
  if (!Array.isArray(stageData.weaponPlacements)) errors.push('weaponPlacementsが配列ではない');

  // スポーンイベントの検証
  stageData.spawnEvents.forEach((event, index) => {
    if (typeof event.triggerX !== 'number') {
      errors.push(`spawnEvents[${index}]: triggerXが数値ではない`);
    }
    if (!Array.isArray(event.enemies)) {
      errors.push(`spawnEvents[${index}]: enemiesが配列ではない`);
    }
    
    event.enemies.forEach((enemy, enemyIndex) => {
      if (!enemy.type) {
        errors.push(`spawnEvents[${index}].enemies[${enemyIndex}]: typeが未定義`);
      }
      if (typeof enemy.groundY !== 'number') {
        errors.push(`spawnEvents[${index}].enemies[${enemyIndex}]: groundYが数値ではない`);
      }
    });
  });

  // 武器配置の検証
  stageData.weaponPlacements.forEach((weapon, index) => {
    if (!weapon.type) {
      errors.push(`weaponPlacements[${index}]: typeが未定義`);
    }
    if (typeof weapon.x !== 'number') {
      errors.push(`weaponPlacements[${index}]: xが数値ではない`);
    }
    if (typeof weapon.groundY !== 'number') {
      errors.push(`weaponPlacements[${index}]: groundYが数値ではない`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// スポーンイベントのX座標でソートする関数
export function sortSpawnEventsByTrigger(stageData) {
  return {
    ...stageData,
    spawnEvents: [...stageData.spawnEvents].sort((a, b) => a.triggerX - b.triggerX)
  };
}

// 特定のウェーブまでスキップするためのフィルター関数
export function filterEventsUpToWave(stageData, waveIndex) {
  return {
    ...stageData,
    spawnEvents: stageData.spawnEvents.slice(0, waveIndex + 1)
  };
}