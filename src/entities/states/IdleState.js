import { PlayerState } from './PlayerState.js';

export class IdleState extends PlayerState {
  constructor() {
    super('idle');
  }

  enter(player) {
    player.sprite.play('player_idle', true);
    player.body.setVelocity(0, 0);
  }

  update(player, time, delta) {
    const cursors = player.cursors;
    const keys = player.keys;

    // 移動入力チェック
    if (cursors.left.isDown || cursors.right.isDown || 
        cursors.up.isDown || cursors.down.isDown) {
      return 'walk';
    }

    // 攻撃入力チェック
    if (Phaser.Input.Keyboard.JustDown(keys.Z)) {
      // コマンド入力チェック
      const command = player.commandBuffer.push('Z');
      if (command) {
        player.executeSpecialAttack(command);
        return 'special';
      }
      return 'attack_1';
    }

    // ダッシュ入力チェック
    if (Phaser.Input.Keyboard.JustDown(keys.X)) {
      return 'dash';
    }

    // 掴み入力チェック（Z+X同時押し）
    if (keys.Z.isDown && Phaser.Input.Keyboard.JustDown(keys.X)) {
      const nearbyEnemy = player.findNearbyEnemy();
      if (nearbyEnemy) {
        player.grabbedEnemy = nearbyEnemy;
        return 'grab';
      }
    }

    return null;
  }
}