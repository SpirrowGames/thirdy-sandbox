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
    description: '蒸気を噴出しながら薙ぎ払う長いパイプ',
    
    /**
     * 特殊技：蒸気噴射
     * 前方扇形に蒸気を噴射し、範囲内の敵にダメージとノックバック
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Player} owner - 武器使用者
     */
    special: (scene, owner) => {
      const direction = owner.facingRight ? 1 : -1;
      const startAngle = owner.facingRight ? -30 : 150;
      const endAngle = owner.facingRight ? 30 : 210;
      
      // 蒸気エフェクトを生成
      scene.createSteamEffect(owner.x, owner.groundY, direction);
      
      // 扇形範囲内の敵を検出してダメージ
      scene.enemies.children.entries.forEach(enemy => {
        if (!enemy.active) return;
        
        const distance = Phaser.Math.Distance.Between(owner.x, owner.groundY, enemy.x, enemy.groundY);
        if (distance <= 250) {
          const angle = Phaser.Math.Angle.Between(owner.x, owner.groundY, enemy.x, enemy.groundY);
          const angleDeg = Phaser.Math.RadToDeg(angle);
          
          if (angleDeg >= startAngle && angleDeg <= endAngle) {
            enemy.takeDamage(12, { x: direction * 200, y: 0 });
          }
        }
      });
    },
    
    bossWeakness: false,
    weaponType: 'melee',
    throwable: true,      // 掴み投げ時に武器も投げるか
  },

  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,           // 投擲武器
    maxDurability: 5,
    description: '回転する歯車を投げつける遠距離武器',
    
    /**
     * 特殊技：連続投擲
     * 5枚の歯車を連続で投げる弾幕攻撃
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Player} owner - 武器使用者
     */
    special: (scene, owner) => {
      const direction = owner.facingRight ? 1 : -1;
      
      for (let i = 0; i < 5; i++) {
        scene.time.delayedCall(i * 100, () => {
          if (!owner.alive) return;
          
          // 少しずつ角度をずらして投擲
          const angleOffset = (i - 2) * 15; // -30, -15, 0, 15, 30度
          scene.throwProjectile(
            owner, 
            12, 
            direction, 
            angleOffset,
            'gear_projectile'
          );
        });
      }
    },
    
    bossWeakness: true,   // ボスの弱点武器
    weaponType: 'ranged',
    throwable: false,     // 既に投擲武器なので掴み投げ不可
  },

  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,
    maxDurability: 3,
    description: '電気を放電する近接必殺武器',
    
    /**
     * 特殊技：360度放電
     * 周囲全方位に電撃を放ち、近くの敵を感電させる
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Player} owner - 武器使用者
     */
    special: (scene, owner) => {
      // 電撃エフェクトを生成
      scene.createElectricEffect(owner.x, owner.groundY);
      
      // 周囲120px以内の全ての敵にダメージ
      scene.enemies.children.entries.forEach(enemy => {
        if (!enemy.active) return;
        
        const distance = Phaser.Math.Distance.Between(owner.x, owner.groundY, enemy.x, enemy.groundY);
        if (distance <= 120) {
          // 奥行き判定も考慮
          if (Math.abs(owner.groundY - enemy.groundY) < 40) {
            enemy.takeDamage(20, { x: 0, y: 0 });
            enemy.applyStatusEffect('stunned', 1000); // 1秒間スタン
          }
        }
      });
    },
    
    bossWeakness: false,
    weaponType: 'melee',
    throwable: true,
  },

  // 将来拡張用の武器定義例
  wrench: {
    name: 'スパナ',
    damage: 14,
    range: 80,
    maxDurability: 6,
    description: 'バランスの取れた汎用武器、敵の武器を奪える',
    
    /**
     * 特殊技：武器奪取
     * 敵を掴んで武器を奪い、その武器を投げ返す
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Player} owner - 武器使用者
     */
    special: (scene, owner) => {
      // 前方の敵を検索
      const direction = owner.facingRight ? 1 : -1;
      const grabRange = 100;
      
      const target = scene.enemies.children.entries.find(enemy => {
        if (!enemy.active || !enemy.heldWeapon) return false;
        
        const dx = Math.abs(enemy.x - owner.x);
        const dy = Math.abs(enemy.groundY - owner.groundY);
        const inDirection = owner.facingRight ? enemy.x > owner.x : enemy.x < owner.x;
        
        return dx <= grabRange && dy < 40 && inDirection;
      });
      
      if (target && target.heldWeapon) {
        // 敵の武器を奪取
        const stolenWeapon = target.heldWeapon;
        target.dropWeapon();
        
        // 奪った武器を投げ返す
        scene.time.delayedCall(200, () => {
          scene.throwWeapon(owner, stolenWeapon, direction);
        });
      }
    },
    
    bossWeakness: false,
    weaponType: 'melee',
    throwable: true,
  },

  steam_gun: {
    name: '蒸気銃',
    damage: 15,
    range: 350,
    maxDurability: 8,
    description: '蒸気圧で弾を発射する遠距離武器',
    
    /**
     * 特殊技：チャージショット
     * 装填時間の後、貫通する強力な弾を発射
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Player} owner - 武器使用者
     */
    special: (scene, owner) => {
      // チャージ中は移動不可
      owner.setCharging(true);
      
      // チャージエフェクト
      scene.createChargeEffect(owner.x, owner.groundY);
      
      scene.time.delayedCall(800, () => {
        if (!owner.alive) return;
        
        owner.setCharging(false);
        const direction = owner.facingRight ? 1 : -1;
        
        // 貫通弾を発射
        scene.firePenetratingShot(
          owner.x + direction * 30,
          owner.groundY,
          direction,
          25  // ダメージ
        );
      });
    },
    
    bossWeakness: false,
    weaponType: 'ranged',
    throwable: false,
  }
};

/**
 * 武器タイプ別の基本設定
 */
export const WEAPON_TYPE_CONFIG = {
  melee: {
    attackSpeed: 1.0,
    knockbackMultiplier: 1.2,
    comboBonus: 1.1,
  },
  ranged: {
    attackSpeed: 0.8,
    knockbackMultiplier: 0.8,
    comboBonus: 1.0,
  }
};

/**
 * 武器の基本性能を取得
 * @param {string} weaponType - 武器タイプ
 * @returns {Object} 武器定義オブジェクト、存在しない場合はnull
 */
export function getWeaponDef(weaponType) {
  return WEAPON_DEFS[weaponType] || null;
}

/**
 * 全武器の名前リストを取得（デバッグ用）
 * @returns {string[]} 武器名の配列
 */
export function getAllWeaponNames() {
  return Object.values(WEAPON_DEFS).map(def => def.name);
}

/**
 * ボス弱点武器のリストを取得
 * @returns {string[]} ボス弱点武器のキー配列
 */
export function getBossWeaknessWeapons() {
  return Object.keys(WEAPON_DEFS).filter(key => WEAPON_DEFS[key].bossWeakness);
}

/**
 * 武器タイプ別にフィルタリング
 * @param {'melee'|'ranged'} type - 武器タイプ
 * @returns {Object} フィルタリングされた武器定義
 */
export function getWeaponsByType(type) {
  const result = {};
  Object.entries(WEAPON_DEFS).forEach(([key, def]) => {
    if (def.weaponType === type) {
      result[key] = def;
    }
  });
  return result;
}