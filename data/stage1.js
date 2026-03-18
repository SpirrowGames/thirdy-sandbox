export const STAGE1 = {
  // ステージ基本設定
  width: 3000,
  background: 'bg_alley', // 蒸気管の走る路地
  
  // 敵出現イベント（X座標トリガー）
  spawnEvents: [
    {
      triggerX: 500,
      enemies: [
        { type: 'grunt', offsetX: 0,   groundY: 400 },
        { type: 'grunt', offsetX: 80,  groundY: 460 },
        { type: 'grunt', offsetX: 160, groundY: 430 },
      ]
    },
    {
      triggerX: 1200,
      enemies: [
        { type: 'grunt', offsetX: 0,  groundY: 420 },
        { type: 'grunt', offsetX: 80, groundY: 450 },
      ]
    },
    {
      triggerX: 2000,
      enemies: [
        { type: 'boss', offsetX: 0, groundY: 440 },
      ]
    },
  ],

  // 武器配置
  weaponPlacements: [
    { type: 'steam_pipe',    x: 300,  groundY: 430 },
    { type: 'gear_star',     x: 800,  groundY: 460 },
    { type: 'spark_lantern', x: 1600, groundY: 420 },
  ],

  // ステージ固有設定
  settings: {
    scrollLockEnabled: true,    // ウェーブクリアまでスクロールロック
    backgroundMusic: 'bgm_alley',
    ambientSounds: ['steam_hiss', 'gear_clank'],
  },

  // デバッグ用設定
  debug: {
    showSpawnTriggers: false,   // スポーントリガーX座標の可視化
    showWeaponPlacements: false, // 武器配置の可視化
    skipToWave: 0,             // 0=通常、1,2,3=該当ウェーブから開始
  }
};

// ステージデータの妥当性チェック関数
export function validateStageData(stageData) {
  const errors = [];
  
  // 必須プロパティチェック
  const requiredProps = ['width', 'spawnEvents', 'weaponPlacements'];
  requiredProps.forEach(prop => {
    if (!stageData[prop]) {
      errors.push(`Missing required property: ${prop}`);
    }
  });

  // spawnEventsの妥当性チェック
  if (stageData.spawnEvents) {
    stageData.spawnEvents.forEach((event, index) => {
      if (typeof event.triggerX !== 'number' || event.triggerX < 0) {
        errors.push(`spawnEvents[${index}]: invalid triggerX`);
      }
      if (!Array.isArray(event.enemies) || event.enemies.length === 0) {
        errors.push(`spawnEvents[${index}]: enemies must be non-empty array`);
      }
      
      event.enemies.forEach((enemy, enemyIndex) => {
        if (!enemy.type || typeof enemy.type !== 'string') {
          errors.push(`spawnEvents[${index}].enemies[${enemyIndex}]: invalid type`);
        }
        if (typeof enemy.groundY !== 'number') {
          errors.push(`spawnEvents[${index}].enemies[${enemyIndex}]: invalid groundY`);
        }
        if (typeof enemy.offsetX !== 'number') {
          errors.push(`spawnEvents[${index}].enemies[${enemyIndex}]: invalid offsetX`);
        }
      });
    });
  }

  // weaponPlacementsの妥当性チェック
  if (stageData.weaponPlacements) {
    stageData.weaponPlacements.forEach((weapon, index) => {
      if (!weapon.type || typeof weapon.type !== 'string') {
        errors.push(`weaponPlacements[${index}]: invalid type`);
      }
      if (typeof weapon.x !== 'number' || weapon.x < 0 || weapon.x > stageData.width) {
        errors.push(`weaponPlacements[${index}]: invalid x coordinate`);
      }
      if (typeof weapon.groundY !== 'number') {
        errors.push(`weaponPlacements[${index}]: invalid groundY`);
      }
    });
  }

  return errors;
}

// ステージデータからスポーンイベントを時系列順に取得
export function getSpawnEventsSorted(stageData) {
  return [...stageData.spawnEvents].sort((a, b) => a.triggerX - b.triggerX);
}

// 指定X座標で発生するスポーンイベントを取得
export function getSpawnEventAt(stageData, triggerX) {
  return stageData.spawnEvents.find(event => event.triggerX === triggerX);
}

// 指定範囲内の武器配置を取得
export function getWeaponsInRange(stageData, startX, endX) {
  return stageData.weaponPlacements.filter(
    weapon => weapon.x >= startX && weapon.x <= endX
  );
}

// デバッグ用：ステージ情報をコンソール出力
export function debugStageInfo(stageData) {
  console.log('=== Stage Debug Info ===');
  console.log(`Width: ${stageData.width}px`);
  console.log(`Spawn Events: ${stageData.spawnEvents.length}`);
  console.log(`Weapon Placements: ${stageData.weaponPlacements.length}`);
  
  stageData.spawnEvents.forEach((event, i) => {
    console.log(`Wave ${i + 1}: X=${event.triggerX}, Enemies=${event.enemies.length}`);
  });
  
  stageData.weaponPlacements.forEach((weapon, i) => {
    console.log(`Weapon ${i + 1}: ${weapon.type} at X=${weapon.x}, Y=${weapon.groundY}`);
  });
}