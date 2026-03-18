export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,
    maxDurability: 4,
    special: (scene, owner) => {
      // 前方扇形に蒸気噴射
      scene.steamBlast(owner, 180, 250, 12);
    },
    bossWeakness: false,
  },
  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,
    maxDurability: 5,
    special: (scene, owner) => {
      // 5連射
      for (let i = 0; i < 5; i++) {
        scene.time.delayedCall(i * 100, () => scene.throwProjectile(owner, 12));
      }
    },
    bossWeakness: true,
  },
  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,
    maxDurability: 3,
    special: (scene, owner) => {
      // 360°放電
      scene.electricBlast(owner, 120, 20);
    },
    bossWeakness: false,
  },
};

// 武器タイプの型定義（JSDocコメント形式）
/**
 * @typedef {Object} WeaponDef
 * @property {string} name - 武器名
 * @property {number} damage - 基本ダメージ
 * @property {number} range - 攻撃範囲（px）
 * @property {number} maxDurability - 最大耐久度
 * @property {function(Scene, Entity): void} special - 特殊技関数
 * @property {boolean} bossWeakness - ボス弱点フラグ
 */