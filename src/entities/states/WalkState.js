import { PlayerState } from './PlayerState.js';

export class WalkState extends PlayerState {
  constructor() {
    super('walk');
  }

  enter(player) {
    player.sprite.play('player_walk', true);
  }

  update(player, time, delta) {
    const cursors = player.cursors;
    const keys = player.keys;
    let velocityX = 0;
    let velocityY = 0;

    // 移動処理
    if (cursors.left.isDown) {
      velocityX = -player.speed;
      player.setFacing(false);
      player.commandBuffer.push('LEFT');
    } else if (cursors.right.isDown) {
      velocityX = player.speed;
      player.setFacing(true);
      player.commandBuffer.push('RIGHT');
    }

    if (cursors.up.isDown) {
      velocityY = -player.speed * 0.6; // 奥行き移動は少し遅く
      player.commandBuffer.push('UP');
    } else if (cursors.down.isDown) {
      velocityY = player.speed * 0.6;
      player.commandBuffer.push('DOWN');
    }

    player.body.setVelocity(velocityX, velocityY);

    // Y座標制限
    if (player.groundY < player.GROUND_Y_MIN) {
      player.groundY = player.GROUND_Y_MIN;
      player.body.setVelocityY(0);
    } else if (player.groundY > player.GROUND_Y_MAX) {
      player.groundY = player.GROUND_Y_MAX;
      player.body.setVelocityY(0);
    }

    // 移動入力がなくなったらIDLEに戻る
    if (!cursors.left.isDown && !cursors.right.isDown && 
        !cursors.up.isDown && !cursors.down.isDown) {
      return 'idle';
    }

    // 攻撃入力チェック
    if (Phaser.Input.Keyboard.JustDown(keys.Z)) {
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

    return null;
  }
}