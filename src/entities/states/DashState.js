import { PlayerState } from './PlayerState.js';

export class DashState extends PlayerState {
  constructor() {
    super('dash');
    this.dashTimer = 0;
    this.DASH_DURATION = 200; // ms
    this.DASH_SPEED = 400;
  }

  enter(player) {
    this.dashTimer = 0;
    player.sprite.play('player_dash', false);
    
    // ダッシュ方向決定（入力に基づく）
    const cursors = player.cursors;
    let dashX = 0;
    let dashY = 0;
    
    if (cursors.left.isDown) dashX = -1;
    else if (cursors.right.isDown) dashX = 1;
    else dashX = player.facingRight ? 1 : -1; // 向いている方向
    
    if (cursors.up.isDown) dashY = -0.6;
    else if (cursors.down.isDown) dashY = 0.6;
    
    player.body.setVelocity(dashX * this.DASH_SPEED, dashY * this.DASH_SPEED);
    
    // ダッシュ中は無敵
    player.setInvincible(true, this.DASH_DURATION);
  }

  update(player, time, delta) {
    this.dashTimer += delta;
    
    if (this.dashTimer >= this.DASH_DURATION) {
      return 'idle';
    }
    
    return null;
  }

  exit(player) {
    player.body.setVelocity(0, 0);
  }

  canTransitionTo(nextState) {
    // ダッシュ中は被弾ステートにのみ遷移可能
    const allowedStates = ['idle', 'hurt', 'knockdown'];
    return allowedStates.includes(nextState);
  }
}