/**
 * 武器定義データ
 * 各武器の基本性能、特殊技、ボス弱点設定を管理
 */
export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,           // X方向リーチ（px）
    maxDurability: 4,
    description: '蒸気を噴出する金属パイプ。リーチが長く薙ぎ払いに優れる',
    
    /**
     * 特殊技: 蒸気噴射
     * 前方扇形に蒸気を噴射してノックバック効果
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者（Player）
     */
    special: (scene, owner) => {
      // 前方180度扇形、距離250px、ダメージ12
      scene.steamBlast(owner, 180, 250, 12);
    },
    
    bossWeakness: false,
    
    // 武器タイプ別の追加プロパティ
    weaponType: 'melee',
    attackSpeed: 0.8,      // 攻撃速度倍率（1.0が標準）
    knockbackPower: 1.5,   // ノックバック力倍率
  },

  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,           // 投擲武器の射程
    maxDurability: 5,
    description: '精密加工された歯車の手裏剣。連続投擲が可能',
    
    /**
     * 特殊技: 連続投擲
     * 5枚の歯車を連続で投擲する弾幕攻撃
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者（Player）
     */
    special: (scene, owner) => {
      // 5連射、100ms間隔でダメージ12の投擲物
      for (let i = 0; i < 5; i++) {
        scene.time.delayedCall(i * 100, () => {
          scene.throwProjectile(owner, 12, {
            speed: 500,
            piercing: true,    // 貫通弾
            range: 400
          });
        });
      }
    },
    
    bossWeakness: true,    // ボスの弱点武器（1.5倍ダメージ）
    
    weaponType: 'projectile',
    attackSpeed: 1.2,      // 投擲武器は素早い
    knockbackPower: 0.8,   // ノックバック力は控えめ
  },

  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,            // 近接武器（短リーチ）
    maxDurability: 3,
    description: '電気を蓄えたランタン。放電で周囲の敵を感電させる',
    
    /**
     * 特殊技: 360度放電
     * 周囲全方向に電撃を放って複数の敵を同時攻撃
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者（Player）
     */
    special: (scene, owner) => {
      // 半径120px、360度範囲、ダメージ20
      scene.electricBlast(owner, 120, 20);
    },
    
    bossWeakness: false,
    
    weaponType: 'melee',
    attackSpeed: 1.1,      // やや素早い攻撃
    knockbackPower: 0.6,   // ノックバックは弱いが感電効果
    statusEffect: 'stun',  // 感電による一時スタン効果
    statusDuration: 500,   // 500ms
  },
};

/**
 * 武器タイプ別の共通設定
 */
export const WEAPON_TYPE_CONFIG = {
  melee: {
    hitSound: 'weapon_hit_melee',
    breakSound: 'weapon_break',
    swingSound: 'weapon_swing',
  },
  projectile: {
    hitSound: 'weapon_hit_projectile',
    breakSound: 'weapon_break',
    throwSound: 'weapon_throw',
  },
};

/**
 * 武器の特殊技で消費する耐久度
 */
export const SPECIAL_DURABILITY_COST = 2;

/**
 * ボス弱点武器のダメージ倍率
 */
export const BOSS_WEAKNESS_MULTIPLIER = 1.5;

/**
 * 武器定義の検証
 * 開発時のデータ整合性チェック用
 * @param {string} weaponType - 武器タイプ
 * @returns {boolean} 有効な武器定義かどうか
 */
export function validateWeaponDef(weaponType) {
  const def = WEAPON_DEFS[weaponType];
  if (!def) return false;
  
  const required = ['name', 'damage', 'range', 'maxDurability', 'special', 'bossWeakness'];
  return required.every(prop => def.hasOwnProperty(prop));
}

/**
 * 武器タイプ一覧を取得
 * @returns {string[]} 利用可能な武器タイプの配列
 */
export function getAvailableWeaponTypes() {
  return Object.keys(WEAPON_DEFS);
}

/**
 * ボス弱点武器のみを取得
 * @returns {string[]} ボス弱点武器のタイプ配列
 */
export function getBossWeaknessWeapons() {
  return Object.entries(WEAPON_DEFS)
    .filter(([_, def]) => def.bossWeakness)
    .map(([type, _]) => type);
}

/**
 * 武器タイプ別の武器を取得
 * @param {string} weaponType - 'melee' | 'projectile'
 * @returns {string[]} 該当する武器タイプの配列
 */
export function getWeaponsByType(weaponType) {
  return Object.entries(WEAPON_DEFS)
    .filter(([_, def]) => def.weaponType === weaponType)
    .map(([type, _]) => type);
}