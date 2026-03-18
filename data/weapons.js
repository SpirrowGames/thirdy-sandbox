/**
 * 武器定義データ
 * 各武器の基本性能と特殊技を定義
 */

export const WEAPON_DEFS = {
  steam_pipe: {
    id: 'steam_pipe',
    name: 'スチームパイプ',
    description: '蒸気を噴射する鉄パイプ',
    
    // 基本性能
    damage: 18,
    range: 120,           // X方向リーチ（px）
    attackSpeed: 0.8,     // 攻撃間隔倍率（小さいほど速い）
    maxDurability: 4,
    
    // 見た目
    sprite: 'weapon_steam_pipe',
    iconSprite: 'icon_steam_pipe',
    
    // 特殊技
    special: {
      name: '蒸気噴射',
      description: '前方扇形に蒸気を噴射',
      cost: 1,            // 耐久度消費
      cooldown: 2000,     // ms
      execute: (scene, owner) => {
        // 前方180度扇形、射程250px、ダメージ12
        scene.createSteamBlast(owner, {
          angle: 180,
          range: 250,
          damage: 12,
          effect: 'knockback'
        });
      }
    },
    
    // ボス戦での効果
    bossEffectiveness: {
      isWeakness: false,
      damageMultiplier: 1.0,
      specialEffect: null
    }
  },

  gear_star: {
    id: 'gear_star',
    name: '歯車手裏剣',
    description: '回転する歯車の投擲武器',
    
    damage: 12,
    range: 400,           // 投擲武器なので長射程
    attackSpeed: 1.2,     // やや遅め
    maxDurability: 5,
    
    sprite: 'weapon_gear_star',
    iconSprite: 'icon_gear_star',
    
    special: {
      name: '連続投擲',
      description: '5枚の歯車を連続で投げる',
      cost: 2,
      cooldown: 3000,
      execute: (scene, owner) => {
        // 100ms間隔で5連射
        for (let i = 0; i < 5; i++) {
          scene.time.delayedCall(i * 100, () => {
            scene.throwProjectile(owner, {
              damage: 12,
              speed: 500,
              sprite: 'projectile_gear'
            });
          });
        }
      }
    },
    
    bossEffectiveness: {
      isWeakness: true,     // ボスの弱点武器
      damageMultiplier: 1.5,
      specialEffect: 'armor_break'  // 特殊効果: 装甲破壊
    }
  },

  spark_lantern: {
    id: 'spark_lantern',
    name: '電気ランタン',
    description: '電撃を放つ蒸気ランタン',
    
    damage: 8,
    range: 60,            // 短射程
    attackSpeed: 1.5,     // 遅い
    maxDurability: 3,
    
    sprite: 'weapon_spark_lantern',
    iconSprite: 'icon_spark_lantern',
    
    special: {
      name: '放電',
      description: '周囲360度に電撃を放つ',
      cost: 2,
      cooldown: 2500,
      execute: (scene, owner) => {
        // 360度放電、射程120px、ダメージ20
        scene.createElectricBlast(owner, {
          radius: 120,
          damage: 20,
          effect: 'stun',
          duration: 1000    // 1秒間スタン
        });
      }
    },
    
    bossEffectiveness: {
      isWeakness: false,
      damageMultiplier: 0.8,  // ボスには効きにくい
      specialEffect: 'slow'   // 移動速度低下
    }
  }
};

// 武器データのユーティリティ関数
export const WeaponUtils = {
  /**
   * 武器IDから定義を取得
   */
  getDefinition(weaponId) {
    return WEAPON_DEFS[weaponId] || null;
  },

  /**
   * 全武器のIDリストを取得
   */
  getAllWeaponIds() {
    return Object.keys(WEAPON_DEFS);
  },

  /**
   * ボス弱点武器のリストを取得
   */
  getBossWeaknessWeapons() {
    return Object.entries(WEAPON_DEFS)
      .filter(([_, def]) => def.bossEffectiveness.isWeakness)
      .map(([id, _]) => id);
  },

  /**
   * 武器の効果的なダメージを計算（対ボス）
   */
  calculateBossDamage(weaponId, baseDamage) {
    const def = WEAPON_DEFS[weaponId];
    if (!def) return baseDamage;
    
    return Math.floor(baseDamage * def.bossEffectiveness.damageMultiplier);
  },

  /**
   * 武器の特殊技が使用可能かチェック
   */
  canUseSpecial(weaponData, currentTime) {
    const def = WEAPON_DEFS[weaponData.type];
    if (!def) return false;
    
    const hasEnoughDurability = weaponData.durability >= def.special.cost;
    const cooldownReady = !weaponData.lastSpecialUse || 
      (currentTime - weaponData.lastSpecialUse) >= def.special.cooldown;
    
    return hasEnoughDurability && cooldownReady;
  }
};