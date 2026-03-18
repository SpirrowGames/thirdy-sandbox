/**
 * 武器定義データ
 * 各武器の基本パラメータ、特殊技、ボス弱点を定義
 */

export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    description: '蒸気を噴出する金属パイプ。リーチが長く、特殊技で範囲攻撃可能',
    
    // 基本パラメータ
    damage: 18,
    range: 120,           // X方向リーチ（px）
    maxDurability: 4,
    weight: 'heavy',      // light, medium, heavy
    
    // 攻撃特性
    attackSpeed: 0.8,     // 攻撃速度倍率（1.0が基準）
    knockback: 150,       // ノックバック力
    hitStun: 100,         // ヒットストップ時間（ms）
    
    // 特殊技設定
    specialName: '蒸気噴射',
    specialDescription: '前方扇形に高温蒸気を噴射',
    specialCost: 1,       // 耐久度消費
    specialCooldown: 0,   // クールダウン（ms）
    
    // ボス戦用設定
    bossWeakness: false,
    bossMultiplier: 1.0,
    
    // 視覚効果
    color: 0x666666,      // 矩形表示時の色
    spriteKey: 'steam_pipe_sprite',
    
    // 特殊技実装
    special: (scene, owner) => {
      // 前方120度扇形、距離250px、ダメージ12
      const steamDamage = 12;
      const steamRange = 250;
      const steamAngle = Math.PI / 3; // 60度（片側）
      
      scene.createSteamBlast(owner, steamRange, steamAngle, steamDamage);
      
      // エフェクト生成
      scene.events.emit('weaponSpecialUsed', {
        weapon: 'steam_pipe',
        owner: owner,
        effectType: 'steam_blast'
      });
    }
  },

  gear_star: {
    name: '歯車手裏剣',
    description: '回転する金属歯車。投擲武器として遠距離攻撃が可能',
    
    // 基本パラメータ
    damage: 12,
    range: 400,           // 投擲武器
    maxDurability: 5,
    weight: 'light',
    
    // 攻撃特性
    attackSpeed: 1.3,     // 軽量で素早い
    knockback: 80,
    hitStun: 60,
    
    // 特殊技設定
    specialName: '連続投擲',
    specialDescription: '5枚の歯車を連続で投げる',
    specialCost: 2,
    specialCooldown: 500,
    
    // ボス戦用設定
    bossWeakness: true,   // ボスの弱点武器
    bossMultiplier: 1.5,
    
    // 視覚効果
    color: 0xccaa00,
    spriteKey: 'gear_star_sprite',
    
    // 特殊技実装
    special: (scene, owner) => {
      const projectileDamage = 12;
      const projectileSpeed = 500;
      
      // 5連射（100ms間隔）
      for (let i = 0; i < 5; i++) {
        scene.time.delayedCall(i * 100, () => {
          if (owner.alive) {
            scene.createProjectile(owner, projectileDamage, projectileSpeed, 'gear');
          }
        });
      }
      
      scene.events.emit('weaponSpecialUsed', {
        weapon: 'gear_star',
        owner: owner,
        effectType: 'multi_projectile'
      });
    }
  },

  spark_lantern: {
    name: '電気ランタン',
    description: '電気を蓄えたランタン。周囲に放電して複数の敵を攻撃',
    
    // 基本パラメータ
    damage: 8,
    range: 60,            // 短リーチ
    maxDurability: 3,
    weight: 'medium',
    
    // 攻撃特性
    attackSpeed: 1.0,
    knockback: 200,       // 電撃で大きく弾く
    hitStun: 120,
    
    // 特殊技設定
    specialName: '放電',
    specialDescription: '周囲360度に電撃を放つ',
    specialCost: 1,
    specialCooldown: 800,
    
    // ボス戦用設定
    bossWeakness: false,
    bossMultiplier: 1.0,
    
    // 視覚効果
    color: 0x00aaff,
    spriteKey: 'spark_lantern_sprite',
    
    // 特殊技実装
    special: (scene, owner) => {
      const electricDamage = 20;
      const electricRange = 120;
      
      scene.createElectricBlast(owner, electricRange, electricDamage);
      
      scene.events.emit('weaponSpecialUsed', {
        weapon: 'spark_lantern',
        owner: owner,
        effectType: 'electric_blast'
      });
    }
  },

  wrench: {
    name: 'スパナ',
    description: 'バランスの取れた工具。敵の武器を奪う特殊技を持つ',
    
    // 基本パラメータ
    damage: 15,
    range: 80,
    maxDurability: 6,     // 頑丈
    weight: 'medium',
    
    // 攻撃特性
    attackSpeed: 1.1,
    knockback: 120,
    hitStun: 80,
    
    // 特殊技設定
    specialName: '武器奪取',
    specialDescription: '敵の武器を奪って投げ返す',
    specialCost: 0,       // 耐久消費なし（成功時のみ効果）
    specialCooldown: 1000,
    
    // ボス戦用設定
    bossWeakness: false,
    bossMultiplier: 1.0,
    
    // 視覚効果
    color: 0x888888,
    spriteKey: 'wrench_sprite',
    
    // 特殊技実装
    special: (scene, owner) => {
      // 近くの敵から武器を奪う試行
      const stealRange = 100;
      const nearbyEnemies = scene.findEnemiesInRange(owner, stealRange);
      
      for (const enemy of nearbyEnemies) {
        if (enemy.hasWeapon && enemy.hasWeapon()) {
          const stolenWeapon = enemy.dropWeapon();
          scene.throwWeapon(owner, stolenWeapon, enemy);
          
          scene.events.emit('weaponSpecialUsed', {
            weapon: 'wrench',
            owner: owner,
            effectType: 'weapon_steal',
            target: enemy
          });
          return; // 1つだけ奪う
        }
      }
      
      // 武器を持つ敵が近くにいない場合、通常の投擲攻撃
      scene.throwWeapon(owner, 'wrench', null);
    }
  },

  steam_gun: {
    name: '蒸気銃',
    description: '蒸気圧で弾丸を発射する銃。チャージで貫通弾を撃てる',
    
    // 基本パラメータ
    damage: 14,
    range: 500,           // 長射程
    maxDurability: 8,
    weight: 'heavy',
    
    // 攻撃特性
    attackSpeed: 0.7,     // 重くて遅い
    knockback: 100,
    hitStun: 90,
    
    // 特殊技設定
    specialName: 'チャージショット',
    specialDescription: '高圧弾で敵を貫通する',
    specialCost: 2,
    specialCooldown: 1200,
    
    // ボス戦用設定
    bossWeakness: false,
    bossMultiplier: 1.0,
    
    // 視覚効果
    color: 0x664422,
    spriteKey: 'steam_gun_sprite',
    
    // 特殊技実装
    special: (scene, owner) => {
      const chargeDamage = 25;
      const chargeSpeed = 600;
      
      // 貫通弾を発射
      scene.createPiercingProjectile(owner, chargeDamage, chargeSpeed);
      
      scene.events.emit('weaponSpecialUsed', {
        weapon: 'steam_gun',
        owner: owner,
        effectType: 'charge_shot'
      });
    }
  }
};

/**
 * 武器タイプ一覧を取得
 * @returns {string[]} 武器タイプの配列
 */
export function getWeaponTypes() {
  return Object.keys(WEAPON_DEFS);
}

/**
 * 武器定義を取得
 * @param {string} type 武器タイプ
 * @returns {Object|null} 武器定義オブジェクト
 */
export function getWeaponDef(type) {
  return WEAPON_DEFS[type] || null;
}

/**
 * ボスの弱点武器一覧を取得
 * @returns {string[]} 弱点武器タイプの配列
 */
export function getBossWeaknesses() {
  return Object.keys(WEAPON_DEFS).filter(type => WEAPON_DEFS[type].bossWeakness);
}

/**
 * 重量別武器一覧を取得
 * @param {string} weight 重量カテゴリ（light, medium, heavy）
 * @returns {string[]} 該当する武器タイプの配列
 */
export function getWeaponsByWeight(weight) {
  return Object.keys(WEAPON_DEFS).filter(type => WEAPON_DEFS[type].weight === weight);
}

/**
 * 武器の基本情報を表示用に整形
 * @param {string} type 武器タイプ
 * @returns {Object|null} 表示用武器情報
 */
export function getWeaponDisplayInfo(type) {
  const def = getWeaponDef(type);
  if (!def) return null;
  
  return {
    name: def.name,
    description: def.description,
    damage: def.damage,
    durability: def.maxDurability,
    specialName: def.specialName,
    specialDescription: def.specialDescription,
    isBossWeakness: def.bossWeakness
  };
}