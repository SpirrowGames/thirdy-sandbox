/**
 * 武器定義データ
 * 各武器の基本パラメータと特殊技を定義
 */
export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,           // X方向リーチ（px）
    maxDurability: 4,
    description: '蒸気を噴射する長いパイプ。リーチが長く、特殊技で前方扇形攻撃が可能。',
    
    /**
     * 特殊技：蒸気噴射
     * 前方120°扇形に蒸気を噴射し、範囲内の敵にダメージとノックバックを与える
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者（Player等）
     */
    special: (scene, owner) => {
      // 前方扇形（120°、射程250px）に蒸気噴射エフェクトを生成
      const direction = owner.facingRight ? 1 : -1;
      const angle = owner.facingRight ? 0 : Math.PI;
      
      // 蒸気エフェクトの視覚的表現
      scene.createSteamBlastEffect(owner.x, owner.groundY, direction);
      
      // 範囲内の敵を検索してダメージ
      scene.enemies.children.entries.forEach(enemy => {
        if (!enemy.active || !enemy.alive) return;
        
        const dx = enemy.x - owner.x;
        const dy = enemy.groundY - owner.groundY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 射程内かつ奥行き判定内
        if (distance <= 250 && Math.abs(dy) <= scene.DEPTH_THRESHOLD) {
          // 角度判定（前方120°扇形）
          const targetAngle = Math.atan2(dy, dx);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(targetAngle - angle));
          
          if (angleDiff <= Math.PI / 3) { // 60° × 2 = 120°
            enemy.takeDamage(12, { x: direction * 200, y: 0 }); // ノックバック付き
            // 蒸気による特殊効果（スタン0.5秒）
            enemy.applyStatusEffect('steam_stun', 500);
          }
        }
      });
      
      // SE再生
      scene.sound.play('steam_blast');
    },
    
    bossWeakness: false,
    weaponType: 'melee',
    attackSpeed: 0.8,     // 攻撃速度倍率（1.0が基準）
    knockbackPower: 1.2,  // ノックバック倍率
  },

  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,           // 投擲武器の射程
    maxDurability: 5,
    description: '回転する歯車型の投擲武器。ボスに対して特に効果的。',
    
    /**
     * 特殊技：連続投擲
     * 0.1秒間隔で5枚の歯車を連射する
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者
     */
    special: (scene, owner) => {
      const direction = owner.facingRight ? 1 : -1;
      const baseVelocity = 600; // px/s
      
      // 5連射（100ms間隔）
      for (let i = 0; i < 5; i++) {
        scene.time.delayedCall(i * 100, () => {
          if (!owner.alive) return; // 投擲中に倒れた場合の安全策
          
          // 歯車プロジェクタイルを生成
          const projectile = scene.physics.add.sprite(
            owner.x + direction * 30, 
            owner.groundY, 
            'gear_projectile'
          );
          
          // 物理設定
          projectile.setVelocityX(direction * baseVelocity);
          projectile.setRotation(0);
          projectile.body.setSize(24, 24);
          
          // 回転アニメーション
          scene.tweens.add({
            targets: projectile,
            rotation: direction * Math.PI * 4, // 2回転
            duration: 1000,
            ease: 'Linear'
          });
          
          // 敵との衝突判定
          scene.physics.add.overlap(projectile, scene.enemies, (proj, enemy) => {
            if (Math.abs(proj.y - enemy.groundY) <= scene.DEPTH_THRESHOLD) {
              enemy.takeDamage(12);
              // 歯車ヒットエフェクト
              scene.createGearHitEffect(proj.x, proj.y);
              proj.destroy();
            }
          });
          
          // 画面外で自動削除
          scene.time.delayedCall(1500, () => {
            if (projectile && projectile.active) {
              projectile.destroy();
            }
          });
        });
      }
      
      // 連射音
      scene.sound.play('gear_throw');
    },
    
    bossWeakness: true,   // ボスの弱点武器
    weaponType: 'ranged',
    attackSpeed: 1.0,
    knockbackPower: 0.8,
  },

  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,            // 近接武器としての基本射程
    maxDurability: 3,
    description: '電気を蓄えたランタン。特殊技で周囲360°に放電攻撃。',
    
    /**
     * 特殊技：放電
     * 使用者を中心とした半径120pxの円形範囲に電撃ダメージ
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者
     */
    special: (scene, owner) => {
      const blastRadius = 120;
      
      // 放電エフェクト生成
      scene.createElectricBlastEffect(owner.x, owner.groundY, blastRadius);
      
      // 範囲内の全敵にダメージ
      scene.enemies.children.entries.forEach(enemy => {
        if (!enemy.active || !enemy.alive) return;
        
        const dx = enemy.x - owner.x;
        const dy = enemy.groundY - owner.groundY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 球形範囲内かつ奥行き判定内
        if (distance <= blastRadius && Math.abs(dy) <= scene.DEPTH_THRESHOLD) {
          enemy.takeDamage(20); // 特殊技は高威力
          // 感電効果（1秒間継続ダメージ）
          enemy.applyStatusEffect('electric_shock', 1000);
          
          // 電撃チェインエフェクト
          scene.createLightningChain(owner.x, owner.groundY, enemy.x, enemy.groundY);
        }
      });
      
      // 放電音
      scene.sound.play('electric_blast');
      
      // 使用者にも短時間の無敵フレーム（自爆防止）
      owner.setInvincible(300);
    },
    
    bossWeakness: false,
    weaponType: 'special',
    attackSpeed: 0.9,
    knockbackPower: 0.5,  // 電撃は吹き飛ばしよりスタン重視
  },
};

/**
 * 武器タイプ別の基本設定
 */
export const WEAPON_TYPE_CONFIG = {
  melee: {
    hitboxDuration: 150,    // ヒットボックス持続時間（ms）
    comboWindow: 200,       // コンボ受付時間（ms）
    canBlock: true,         // ガード可能
  },
  ranged: {
    hitboxDuration: 0,      // 投擲物の衝突判定
    comboWindow: 300,       // 投擲後の硬直
    canBlock: false,        // ガード不可
  },
  special: {
    hitboxDuration: 200,
    comboWindow: 400,       // 特殊武器は硬直長め
    canBlock: true,
  },
};

/**
 * 武器取得時のスプライト設定
 */
export const WEAPON_SPRITES = {
  steam_pipe: {
    texture: 'steam_pipe',
    scale: 1.0,
    offsetX: 20,  // プレイヤーからの相対位置
    offsetY: -10,
  },
  gear_star: {
    texture: 'gear_star',
    scale: 0.8,
    offsetX: 15,
    offsetY: -5,
  },
  spark_lantern: {
    texture: 'spark_lantern',
    scale: 1.2,
    offsetX: 10,
    offsetY: -15,
  },
};

/**
 * ボス弱点システム用の倍率設定
 */
export const BOSS_WEAKNESS_MULTIPLIER = 1.5;

/**
 * 武器耐久度による威力減衰設定
 */
export const DURABILITY_DAMAGE_CURVE = {
  // 耐久度が50%以下になると威力が徐々に減少
  threshold: 0.5,
  minMultiplier: 0.7,  // 最低威力（30%減）
};

/**
 * ユーティリティ関数：武器データの取得
 * @param {string} weaponType - 武器タイプ
 * @returns {Object|null} 武器定義データ
 */
export function getWeaponDef(weaponType) {
  return WEAPON_DEFS[weaponType] || null;
}

/**
 * ユーティリティ関数：ボス弱点判定
 * @param {string} weaponType - 武器タイプ
 * @returns {boolean} ボス弱点かどうか
 */
export function isBossWeakness(weaponType) {
  const def = getWeaponDef(weaponType);
  return def ? def.bossWeakness : false;
}

/**
 * ユーティリティ関数：耐久度による威力計算
 * @param {number} baseDamage - 基本威力
 * @param {number} currentDurability - 現在耐久度
 * @param {number} maxDurability - 最大耐久度
 * @returns {number} 実際の威力
 */
export function calculateDamageWithDurability(baseDamage, currentDurability, maxDurability) {
  const durabilityRatio = currentDurability / maxDurability;
  
  if (durabilityRatio >= DURABILITY_DAMAGE_CURVE.threshold) {
    return baseDamage; // 耐久度が高い間は威力減衰なし
  }
  
  // 耐久度に応じて線形減衰
  const decayRatio = durabilityRatio / DURABILITY_DAMAGE_CURVE.threshold;
  const multiplier = DURABILITY_DAMAGE_CURVE.minMultiplier + 
                    (1 - DURABILITY_DAMAGE_CURVE.minMultiplier) * decayRatio;
  
  return Math.floor(baseDamage * multiplier);
}