export const WEAPON_DEFS = {
  steam_pipe: {
    name: 'スチームパイプ',
    damage: 18,
    range: 120,
    maxDurability: 4,
    special: {
      name: '蒸気噴射',
      description: '前方扇形に蒸気を噴射',
      cost: 2, // 耐久度消費量
      execute: (scene, owner) => {
        scene.createSteamBlast(owner, {
          angle: 120,    // 120度扇形
          range: 250,    // 250px
          damage: 12
        });
      }
    },
    bossWeakness: false,
    sprite: 'steam_pipe_sprite',
    hitEffect: 'steam_hit',
    breakEffect: 'pipe_break'
  },
  
  gear_star: {
    name: '歯車手裏剣',
    damage: 12,
    range: 400,
    maxDurability: 5,
    special: {
      name: '連続投擲',
      description: '5枚の歯車を連射',
      cost: 2,
      execute: (scene, owner) => {
        for (let i = 0; i < 5; i++) {
          scene.time.delayedCall(i * 100, () => {
            scene.createProjectile(owner, {
              type: 'gear_star',
              damage: 12,
              speed: 500,
              piercing: true
            });
          });
        }
      }
    },
    bossWeakness: true,
    sprite: 'gear_star_sprite',
    hitEffect: 'gear_hit',
    breakEffect: 'gear_shatter'
  },
  
  spark_lantern: {
    name: '電気ランタン',
    damage: 8,
    range: 60,
    maxDurability: 3,
    special: {
      name: '放電',
      description: '周囲360度に電撃',
      cost: 2,
      execute: (scene, owner) => {
        scene.createElectricBlast(owner, {
          radius: 120,
          damage: 20,
          stunDuration: 800
        });
      }
    },
    bossWeakness: false,
    sprite: 'spark_lantern_sprite',
    hitEffect: 'electric_hit',
    breakEffect: 'lantern_break'
  }
};