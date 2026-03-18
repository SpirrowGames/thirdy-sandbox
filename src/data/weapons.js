export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,
    maxDurability: 4,
    attackDuration: 200, // ms
    special: (scene, owner) => {
      scene.steamBlast(owner, 180, 250, 12);
    },
    bossWeakness: false,
  },
  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,
    maxDurability: 5,
    attackDuration: 150,
    special: (scene, owner) => {
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
    attackDuration: 180,
    special: (scene, owner) => {
      scene.electricBlast(owner, 120, 20);
    },
    bossWeakness: false,
  },
};