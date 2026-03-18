export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,
    maxDurability: 4,
    special: (scene, owner) => {
      scene.steamBlast(owner, 180, 250, 12);
    },
    bossWeakness: false,
    description: '蒸気を噴射する重厚なパイプ'
  },
  
  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,
    maxDurability: 5,
    special: (scene, owner) => {
      for (let i = 0; i < 5; i++) {
        scene.time.delayedCall(i * 100, () => scene.throwProjectile(owner, 12));
      }
    },
    bossWeakness: true, // ボスの弱点武器
    description: '機械の隙間を狙い撃つ精密武器'
  },
  
  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,
    maxDurability: 3,
    special: (scene, owner) => {
      scene.electricBlast(owner, 120, 20);
    },
    bossWeakness: false,
    description: '電気を放つ危険なランタン'
  },
  
  // 新規追加：もう一つの弱点武器
  steam_hammer: {
    name: 'スチームハンマー',
    damage: 25,
    range: 80,
    maxDurability: 3,
    special: (scene, owner) => {
      scene.groundPound(owner, 150, 30);
    },
    bossWeakness: true, // ボスの弱点武器
    description: '蒸気圧で駆動する巨大ハンマー'
  }
};

/**
 * 弱点武器のリストを取得
 */
export function getWeaknessWeapons() {
  return Object.entries(WEAPON_DEFS)
    .filter(([_, def]) => def.bossWeakness)
    .map(([type, def]) => ({ type, ...def }));
}

/**
 * 武器が弱点かどうかチェック
 */
export function isWeaknessWeapon(weaponType) {
  const def = WEAPON_DEFS[weaponType];
  return def?.bossWeakness || false;
}