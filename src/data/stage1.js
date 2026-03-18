/**
 * ステージ1のスポーンデータ定義
 */

export const STAGE1_SPAWN_EVENTS = [
  {
    triggerX: 500,
    enemies: [
      { type: 'grunt', offsetX: 0, groundY: 400 },
      { type: 'grunt', offsetX: 80, groundY: 460 },
      { type: 'grunt', offsetX: 160, groundY: 430 },
    ]
  },
  {
    triggerX: 1200,
    enemies: [
      { type: 'grunt', offsetX: 0, groundY: 420 },
      { type: 'grunt', offsetX: 100, groundY: 450 },
    ]
  },
  {
    triggerX: 2000,
    enemies: [
      { type: 'boss', offsetX: 0, groundY: 440 },
    ]
  },
];

export const STAGE1_CONFIG = {
  width: 3000,
  background: 'bg_alley',
  spawnEvents: STAGE1_SPAWN_EVENTS,
  weaponPlacements: [
    { type: 'steam_pipe', x: 300, groundY: 430 },
    { type: 'gear_star', x: 800, groundY: 460 },
    { type: 'spark_lantern', x: 1600, groundY: 420 },
  ],
};