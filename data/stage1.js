/**
 * ステージ1: 蒸気管の走る路地
 * 
 * MVP構成:
 * - 雑魚ウェーブ 2回 + ボス戦
 * - 武器配置 3箇所
 * - ステージ全幅 3000px
 */

export const STAGE1 = {
  // ステージ基本情報
  id: 'stage1',
  name: '蒸気管の路地',
  width: 3000,
  height: 540,
  background: 'bg_alley',
  bgm: 'bgm_stage1',

  // スポーンイベント（X座標トリガー順）
  spawnEvents: [
    {
      // 第1ウェーブ: チュートリアル的な3体構成
      triggerX: 500,
      type: 'wave',
      enemies: [
        { 
          type: 'grunt', 
          offsetX: 0,    // カメラ右端からのオフセット
          groundY: 400,  // 奥行き位置
          delay: 0       // スポーン遅延（ms）
        },
        { 
          type: 'grunt', 
          offsetX: 80, 
          groundY: 460, 
          delay: 300 
        },
        { 
          type: 'grunt', 
          offsetX: 160, 
          groundY: 430, 
          delay: 600 
        }
      ],
      // ウェーブクリア条件
      clearCondition: 'all_enemies_defeated',
      lockScroll: true,
      onClear: {
        scoreBonus: 100,
        message: 'WAVE 1 CLEAR!'
      }
    },

    {
      // 中間ウェーブ: より密集した2体
      triggerX: 1200,
      type: 'wave',
      enemies: [
        { 
          type: 'grunt', 
          offsetX: 0, 
          groundY: 420, 
          delay: 0 
        },
        { 
          type: 'grunt', 
          offsetX: 60,  // より接近配置
          groundY: 450, 
          delay: 200 
        }
      ],
      clearCondition: 'all_enemies_defeated',
      lockScroll: true,
      onClear: {
        scoreBonus: 150,
        message: 'WAVE 2 CLEAR!'
      }
    },

    {
      // ボス戦
      triggerX: 2000,
      type: 'boss',
      enemies: [
        { 
          type: 'boss', 
          offsetX: 100,  // ボスは少し奥に配置
          groundY: 440, 
          delay: 500     // 登場演出のための遅延
        }
      ],
      clearCondition: 'boss_defeated',
      lockScroll: true,
      backgroundChange: 'bg_boss_arena',  // ボス戦用背景に切り替え
      bgmChange: 'bgm_boss',
      onStart: {
        message: 'BOSS BATTLE!',
        cameraEffect: 'zoom_in'
      },
      onClear: {
        scoreBonus: 1000,
        message: 'STAGE CLEAR!',
        unlockNext: 'stage2'
      }
    }
  ],

  // 武器配置（ステージ開始時から存在）
  weaponPlacements: [
    {
      type: 'steam_pipe',
      x: 300,          // ステージ絶対座標
      groundY: 430,
      respawn: false   // 拾われたら消失（リスポーンしない）
    },
    {
      type: 'gear_star',
      x: 800,
      groundY: 460,
      respawn: false
    },
    {
      type: 'spark_lantern',
      x: 1600,         // ボス戦前の重要な武器
      groundY: 420,
      respawn: false
    }
  ],

  // ステージクリア条件
  clearConditions: {
    primary: 'all_spawn_events_cleared',
    timeLimit: 300000,  // 5分制限（ms）
    bonusConditions: [
      { type: 'no_damage', bonus: 2000 },
      { type: 'time_under', threshold: 180000, bonus: 1000 },  // 3分以内
      { type: 'combo_over', threshold: 20, bonus: 500 }
    ]
  },

  // デバッグ用設定
  debug: {
    skipToWave: null,     // null | 1 | 2 | 'boss'
    godMode: false,
    showTriggers: false   // トリガー位置の可視化
  }
};

// ステージバリデーション関数
export function validateStage(stage) {
  const errors = [];
  
  // 基本プロパティチェック
  if (!stage.id || typeof stage.id !== 'string') {
    errors.push('Stage ID is required and must be string');
  }
  
  if (!stage.width || stage.width <= 0) {
    errors.push('Stage width must be positive number');
  }
  
  // スポーンイベントの順序チェック
  let prevX = 0;
  stage.spawnEvents.forEach((event, index) => {
    if (event.triggerX <= prevX) {
      errors.push(`Spawn event ${index}: triggerX must be in ascending order`);
    }
    prevX = event.triggerX;
    
    // 敵配置の境界チェック
    event.enemies.forEach((enemy, enemyIndex) => {
      if (enemy.groundY < 360 || enemy.groundY > 480) {
        errors.push(`Spawn event ${index}, enemy ${enemyIndex}: groundY out of bounds`);
      }
    });
  });
  
  // 武器配置の境界チェック
  stage.weaponPlacements.forEach((weapon, index) => {
    if (weapon.x < 0 || weapon.x > stage.width) {
      errors.push(`Weapon ${index}: x position out of stage bounds`);
    }
    if (weapon.groundY < 360 || weapon.groundY > 480) {
      errors.push(`Weapon ${index}: groundY out of bounds`);
    }
  });
  
  return errors;
}

// ステージデータのユーティリティ関数
export const StageUtils = {
  /**
   * 指定X座標で発生するスポーンイベントを取得
   */
  getEventAtPosition(stage, x) {
    return stage.spawnEvents.find(event => event.triggerX === x);
  },

  /**
   * 次のスポーンイベントのX座標を取得
   */
  getNextEventPosition(stage, currentX) {
    const nextEvent = stage.spawnEvents.find(event => event.triggerX > currentX);
    return nextEvent ? nextEvent.triggerX : null;
  },

  /**
   * ステージ進行率を計算（0.0 - 1.0）
   */
  getProgressRatio(stage, currentX) {
    return Math.min(currentX / stage.width, 1.0);
  },

  /**
   * 指定範囲内の武器を取得
   */
  getWeaponsInRange(stage, minX, maxX) {
    return stage.weaponPlacements.filter(weapon => 
      weapon.x >= minX && weapon.x <= maxX
    );
  },

  /**
   * デバッグ用: 指定ウェーブまでスキップするためのX座標を計算
   */
  getSkipPosition(stage, waveIndex) {
    if (waveIndex === 'boss') {
      const bossEvent = stage.spawnEvents.find(e => e.type === 'boss');
      return bossEvent ? bossEvent.triggerX - 50 : 0;
    }
    
    const waveEvents = stage.spawnEvents.filter(e => e.type === 'wave');
    if (waveIndex > 0 && waveIndex <= waveEvents.length) {
      return waveEvents[waveIndex - 1].triggerX - 50;
    }
    
    return 0;
  }
};