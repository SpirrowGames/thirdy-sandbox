export const STAGE1 = {
  width: 3000,
  background: 'bg_alley',

  spawnEvents: [
    {
      id: 'wave_1',
      triggerX: 500,
      enemies: [
        { type: 'grunt', offsetX: 0,   groundY: 400 },
        { type: 'grunt', offsetX: 80,  groundY: 460 },
        { type: 'grunt', offsetX: 160, groundY: 430 },
      ]
    },
    {
      id: 'wave_2', 
      triggerX: 1200,
      enemies: [
        { type: 'grunt', offsetX: 0,  groundY: 420 },
        { type: 'grunt', offsetX: 80, groundY: 450 },
      ]
    },
    {
      id: 'boss_wave',
      triggerX: 2000,
      enemies: [
        { type: 'boss', offsetX: 0, groundY: 440 },
      ]
    },
  ],

  weaponPlacements: [
    { type: 'steam_pipe',    x: 300,  groundY: 430 },
    { type: 'gear_star',     x: 800,  groundY: 460 },
    { type: 'spark_lantern', x: 1600, groundY: 420 },
  ],
};