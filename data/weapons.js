/**
 * 武器定義データ
 * 各武器の基本ステータス、特殊技、ボス弱点を定義
 */
export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,          // X方向リーチ（px）
    maxDurability: 4,
    attackSpeed: 1.2,    // 攻撃間隔倍率（1.0が基準）
    knockback: 80,       // ノックバック力
    bossWeakness: false,
    
    // 特殊技：蒸気噴射
    special: {
      name: '蒸気噴射',
      durabilityConsumption: 2,
      cooldown: 2000,    // ms
      execute: (scene, owner) => {
        // 前方扇形（120度）に蒸気噴射
        const direction = owner.facingRight ? 1 : -1;
        const startAngle = owner.facingRight ? -60 : 120;
        const endAngle = owner.facingRight ? 60 : 240;
        
        scene.createSteamBlast({
          x: owner.x + direction * 60,
          y: owner.groundY,
          width: 180,
          height: 100,
          damage: 12,
          duration: 800,
          knockback: 120,
          effect: 'steam_particles'
        });
        
        // 音響効果
        scene.sound.play('steam_blast', { volume: 0.7 });
        
        // 視覚効果
        scene.cameras.main.shake(200, 0.02);
      }
    }
  },

  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,          // 投擲武器のため長射程
    maxDurability: 5,
    attackSpeed: 0.8,    // 投擲のため少し遅い
    knockback: 40,
    bossWeakness: true,  // ボスの弱点武器
    
    // 特殊技：5連射
    special: {
      name: '歯車連射',
      durabilityConsumption: 3,
      cooldown: 3000,
      execute: (scene, owner) => {
        const direction = owner.facingRight ? 1 : -1;
        
        // 5連射を100ms間隔で実行
        for (let i = 0; i < 5; i++) {
          scene.time.delayedCall(i * 100, () => {
            scene.createProjectile({
              x: owner.x + direction * 30,
              y: owner.groundY - 20,
              velocityX: direction * 500,
              velocityY: Phaser.Math.Between(-50, 50), // ランダムな縦ブレ
              damage: 8,
              range: 600,
              sprite: 'gear_projectile',
              piercing: true,  // 貫通弾
              spin: true       // 回転エフェクト
            });
          });
        }
        
        scene.sound.play('gear_throw_multi', { volume: 0.6 });
      }
    }
  },

  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,           // 短射程
    maxDurability: 3,
    attackSpeed: 1.5,    // 早い攻撃速度
    knockback: 60,
    bossWeakness: false,
    
    // 特殊技：360度放電
    special: {
      name: '放電爆発',
      durabilityConsumption: 2,
      cooldown: 2500,
      execute: (scene, owner) => {
        // 周囲360度に電撃ダメージ
        scene.createElectricBlast({
          x: owner.x,
          y: owner.groundY,
          radius: 120,
          damage: 20,
          duration: 600,
          stunDuration: 1000,  // 感電による麻痺効果
          effect: 'electric_burst'
        });
        
        // 画面フラッシュ効果
        scene.cameras.main.flash(150, 255, 255, 0);
        scene.sound.play('electric_blast', { volume: 0.8 });
      }
    }
  }
};

/**
 * 武器タイプの列挙
 */
export const WEAPON_TYPES = {
  STEAM_PIPE: 'steam_pipe',
  GEAR_STAR: 'gear_star',
  SPARK_LANTERN: 'spark_lantern'
};

/**
 * ボス弱点武器の取得
 * @returns {string[]} 弱点武器のタイプ配列
 */
export function getBossWeaponWeaknesses() {
  return Object.entries(WEAPON_DEFS)
    .filter(([type, def]) => def.bossWeakness)
    .map(([type, def]) => type);
}

/**
 * 武器定義の取得（安全なアクセス）
 * @param {string} weaponType 武器タイプ
 * @returns {Object|null} 武器定義オブジェクト
 */
export function getWeaponDef(weaponType) {
  return WEAPON_DEFS[weaponType] || null;
}

/**
 * 武器のダメージ計算（ボス弱点システム込み）
 * @param {string} weaponType 武器タイプ
 * @param {boolean} isAgainstBoss ボス戦かどうか
 * @returns {number} 計算後のダメージ値
 */
export function calculateWeaponDamage(weaponType, isAgainstBoss = false) {
  const def = getWeaponDef(weaponType);
  if (!def) return 0;
  
  let damage = def.damage;
  
  // ボス弱点システム
  if (isAgainstBoss && def.bossWeakness) {
    damage = Math.floor(damage * 1.5); // 1.5倍ダメージ
  }
  
  return damage;
}

/**
 * 武器の特殊技が使用可能かチェック
 * @param {Object} weapon 武器インスタンス
 * @param {number} currentTime 現在時刻
 * @returns {boolean} 使用可能かどうか
 */
export function canUseSpecialAttack(weapon, currentTime) {
  const def = getWeaponDef(weapon.type);
  if (!def) return false;
  
  // 耐久度チェック
  if (weapon.durability < def.special.durabilityConsumption) {
    return false;
  }
  
  // クールダウンチェック
  const timeSinceLastSpecial = currentTime - (weapon.lastSpecialTime || 0);
  if (timeSinceLastSpecial < def.special.cooldown) {
    return false;
  }
  
  return true;
}