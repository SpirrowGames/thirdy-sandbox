/**
 * 武器の定義データ
 * 各武器タイプの基本パラメータと特殊技を定義
 */
export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,
    maxDurability: 4,
    bossWeakness: false,
    special: (scene, owner) => {
      // 前方扇形に蒸気噴射
      if (scene.steamBlast && typeof scene.steamBlast === 'function') {
        scene.steamBlast(owner, 180, 250, 12);
      } else {
        console.warn('steamBlast method not found on scene');
      }
    }
  },

  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,
    maxDurability: 5,
    bossWeakness: true,
    special: (scene, owner) => {
      // 5連射
      for (let i = 0; i < 5; i++) {
        if (scene.time && scene.time.delayedCall && scene.throwProjectile) {
          scene.time.delayedCall(i * 100, () => {
            if (scene.throwProjectile && typeof scene.throwProjectile === 'function') {
              scene.throwProjectile(owner, 12);
            }
          });
        } else {
          console.warn('Required scene methods not found for gear_star special');
          break;
        }
      }
    }
  },

  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,
    maxDurability: 3,
    bossWeakness: false,
    special: (scene, owner) => {
      // 360°放電
      if (scene.electricBlast && typeof scene.electricBlast === 'function') {
        scene.electricBlast(owner, 120, 20);
      } else {
        console.warn('electricBlast method not found on scene');
      }
    }
  },

  // テスト用の簡単な武器
  test_weapon: {
    name: 'テスト武器',
    damage: 10,
    range: 80,
    maxDurability: 2,
    bossWeakness: false,
    special: (scene, owner) => {
      // テスト用の特殊技（何もしない）
      console.log('Test weapon special attack executed');
    }
  }
};