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
    bossWeakness: false,
    
    /**
     * 特殊技：蒸気噴射
     * 前方扇形範囲に蒸気を噴射してダメージを与える
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者
     */
    special: (scene, owner) => {
      if (!scene || !owner) {
        console.warn('steam_pipe special: invalid parameters');
        return;
      }

      // 蒸気噴射エフェクトの生成
      const direction = owner.facingRight ? 1 : -1;
      const blastX = owner.x + direction * 90; // 噴射開始位置
      const blastY = owner.groundY;

      // 前方180度扇形、距離250px、ダメージ12
      scene.steamBlast(owner, 180, 250, 12);

      // 視覚エフェクト（蒸気パーティクル）
      if (scene.add && scene.add.particles) {
        const steam = scene.add.particles(blastX, blastY, 'steam', {
          speed: { min: 100, max: 200 },
          scale: { start: 0.3, end: 0 },
          lifespan: 500,
          angle: { min: direction > 0 ? -30 : 150, max: direction > 0 ? 30 : 210 }
        });
        
        // パーティクルの自動削除
        scene.time.delayedCall(500, () => {
          if (steam && steam.destroy) {
            steam.destroy();
          }
        });
      }
    }
  },

  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,           // 投擲武器
    maxDurability: 5,
    bossWeakness: true,   // ボスの弱点武器
    
    /**
     * 特殊技：連続投擲
     * 5枚の歯車を連続で投げる
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者
     */
    special: (scene, owner) => {
      if (!scene || !owner) {
        console.warn('gear_star special: invalid parameters');
        return;
      }

      const throwCount = 5;
      const throwInterval = 100; // ms

      // 5連射の実行
      for (let i = 0; i < throwCount; i++) {
        scene.time.delayedCall(i * throwInterval, () => {
          if (owner.alive && scene.throwProjectile) {
            scene.throwProjectile(owner, {
              damage: 12,
              speed: 350,
              sprite: 'gear_projectile',
              piercing: true  // 貫通属性
            });
          }
        });
      }

      // 連射エフェクト音
      if (scene.sound) {
        scene.sound.play('gear_throw_multi', { volume: 0.7 });
      }
    }
  },

  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,
    maxDurability: 3,
    bossWeakness: false,
    
    /**
     * 特殊技：360度放電
     * 周囲全方向に電撃を放つ
     * @param {Phaser.Scene} scene - ゲームシーン
     * @param {Object} owner - 武器使用者
     */
    special: (scene, owner) => {
      if (!scene || !owner) {
        console.warn('spark_lantern special: invalid parameters');
        return;
      }

      const blastRadius = 120;
      const blastDamage = 20;

      // 360度電撃攻撃
      scene.electricBlast(owner, blastRadius, blastDamage);

      // 電撃エフェクトの生成
      if (scene.add) {
        // 中心の電撃球
        const electricBall = scene.add.circle(owner.x, owner.groundY, blastRadius, 0x00ffff, 0.3);
        
        // フラッシュエフェクト
        scene.tweens.add({
          targets: electricBall,
          alpha: { from: 0.7, to: 0 },
          scaleX: { from: 0.5, to: 1.2 },
          scaleY: { from: 0.5, to: 1.2 },
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            if (electricBall && electricBall.destroy) {
              electricBall.destroy();
            }
          }
        });

        // 放射状の電撃線
        for (let angle = 0; angle < 360; angle += 45) {
          const radian = Phaser.Math.DegToRad(angle);
          const endX = owner.x + Math.cos(radian) * blastRadius;
          const endY = owner.groundY + Math.sin(radian) * blastRadius;
          
          const lightning = scene.add.line(0, 0, owner.x, owner.groundY, endX, endY, 0xffff00);
          lightning.setLineWidth(3);
          
          scene.tweens.add({
            targets: lightning,
            alpha: { from: 1, to: 0 },
            duration: 200,
            onComplete: () => {
              if (lightning && lightning.destroy) {
                lightning.destroy();
              }
            }
          });
        }
      }

      // 電撃音エフェクト
      if (scene.sound) {
        scene.sound.play('electric_blast', { volume: 0.8 });
      }
    }
  }
};

/**
 * 武器タイプの有効性チェック
 * @param {string} weaponType - 武器タイプ
 * @returns {boolean} 有効な武器タイプかどうか
 */
export function isValidWeaponType(weaponType) {
  return weaponType && WEAPON_DEFS.hasOwnProperty(weaponType);
}

/**
 * 武器データの取得
 * @param {string} weaponType - 武器タイプ
 * @returns {Object|null} 武器データまたはnull
 */
export function getWeaponData(weaponType) {
  if (!isValidWeaponType(weaponType)) {
    console.warn(`Invalid weapon type: ${weaponType}`);
    return null;
  }
  return { ...WEAPON_DEFS[weaponType] }; // 防御的コピー
}

/**
 * ボス弱点武器の一覧取得
 * @returns {string[]} ボス弱点武器のタイプ一覧
 */
export function getBossWeaknessWeapons() {
  return Object.keys(WEAPON_DEFS).filter(type => WEAPON_DEFS[type].bossWeakness);
}

/**
 * 武器の基本情報表示用フォーマット
 * @param {string} weaponType - 武器タイプ
 * @returns {string} フォーマットされた武器情報
 */
export function formatWeaponInfo(weaponType) {
  const data = getWeaponData(weaponType);
  if (!data) return '不明な武器';
  
  const weaknessText = data.bossWeakness ? ' [対ボス有効]' : '';
  return `${data.name} (攻撃力:${data.damage} 射程:${data.range} 耐久:${data.maxDurability})${weaknessText}`;
}