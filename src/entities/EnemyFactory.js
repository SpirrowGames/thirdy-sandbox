import { Enemy } from './Enemy.js';

export const ENEMY_TYPES = {
  grunt: {
    hp: 30,
    speed: 80,
    attackRange: 60,
    attackDamage: 10,
    attackCooldown: 1500
  },
  
  heavy: {
    hp: 50,
    speed: 60,
    attackRange: 80,
    attackDamage: 15,
    attackCooldown: 2000
  },
  
  fast: {
    hp: 20,
    speed: 120,
    attackRange: 50,
    attackDamage: 8,
    attackCooldown: 1200
  }
};

export class EnemyFactory {
  static create(scene, type, x, y) {
    const config = ENEMY_TYPES[type];
    if (!config) {
      console.warn(`Unknown enemy type: ${type}`);
      return null;
    }
    
    return new Enemy(scene, x, y, config);
  }
}