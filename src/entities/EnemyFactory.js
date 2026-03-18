import { Enemy } from './Enemy.js';
import { ENEMY_CONFIGS } from '../config/constants.js';

export class EnemyFactory {
  static create(scene, type, x, y) {
    const config = ENEMY_CONFIGS[type];
    if (!config) {
      console.warn(`Unknown enemy type: ${type}`);
      return null;
    }
    
    return new Enemy(scene, x, y, config);
  }
}