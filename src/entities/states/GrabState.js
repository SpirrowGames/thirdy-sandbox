import { PlayerState } from './PlayerState.js';

export class GrabState extends PlayerState {
  constructor() {
    super('grab');
    this.grabTimer = 0;
    this.GRAB_DURATION = 300; // ms
  }

  enter(player) {
    this.grabTimer = 0;
    player.sprite.play('player_grab', false);
    player.body.setVelocity(0, 0);
    
    // 掴んだ敵を無力化
    if (player.grabbedEnemy) {
      player.grabbedEnemy.setGrabbed(true);
    }
  }

  update(player, time, delta) {
    const keys = player.keys;
    this.grabTimer += delta;
    
    // 投げ入力
    if (Phaser.Input.Keyboard.JustDown(keys.Z)) {
      return 'throw';
    }
    
    // 掴み時間終了または敵が存在しない
    if (this.grabTimer >= this.GRAB_DURATION || !player.grabbedEnemy || !player.grabbedEnemy.alive) {
      return 'idle';
    }
    
    return null;
  }

  exit(player) {
    if (player.grabbedEnemy) {
      player.grabbedEnemy.setGrabbed(false);
    }
  }

  canTransitionTo(nextState) {
    const allowedStates = ['throw', 'idle', 'hurt', 'knockdown'];
    return allowedStates.includes(nextState);
  }
}