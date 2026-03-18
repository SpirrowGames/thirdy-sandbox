export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,
    maxDurability: 4,
    special: (scene, owner) => {
      // 蒸気噴射：前方扇形範囲攻撃
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
      // 5連射：連続投擲攻撃
      scene.gearBarrage(owner, 5, 100, 12);
    },
    bossWeakness: true,
  },
  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,
    maxDurability: 3,
    special: (scene, owner) => {
      // 360°放電：周囲全方位攻撃
      scene.electricBlast(owner, 120, 20);
    },
    bossWeakness: false,
  },
};