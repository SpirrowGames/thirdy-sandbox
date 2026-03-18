import { IdleState } from './IdleState.js';
import { WalkState } from './WalkState.js';
import { AttackState } from './AttackState.js';
import { DashState } from './DashState.js';
import { GrabState } from './GrabState.js';
import { ThrowState } from './ThrowState.js';
import { SpecialState } from './SpecialState.js';
import { HurtState } from './HurtState.js';
import { KnockdownState } from './KnockdownState.js';

/**
 * プレイヤーのステートマシン
 */
export class PlayerStateMachine {
  constructor(player) {
    this.player = player;
    this.states = {
      idle: new IdleState(),
      walk: new WalkState(),
      attack_1: new AttackState('attack_1', 1),
      attack_2: new AttackState('attack_2', 2),
      attack_3: new AttackState('attack_3', 3),
      dash: new DashState(),
      grab: new GrabState(),
      throw: new ThrowState(),
      special: new SpecialState(),
      hurt: new HurtState(),
      knockdown: new KnockdownState()
    };
    
    this.currentState = this.states.idle;
    this.previousState = null;
  }

  /**
   * ステート遷移
   */
  changeState(stateName) {
    const newState = this.states[stateName];
    if (!newState) {
      console.warn(`Unknown state: ${stateName}`);
      return false;
    }

    if (!this.currentState.canTransitionTo(stateName)) {
      return false;
    }

    this.currentState.exit(this.player);
    this.previousState = this.currentState;
    this.currentState = newState;
    this.currentState.enter(this.player);
    
    return true;
  }

  /**
   * 現在のステート名を取得
   */
  getCurrentStateName() {
    return this.currentState.name;
  }

  /**
   * 毎フレーム更新
   */
  update(time, delta) {
    const nextState = this.currentState.update(this.player, time, delta);
    if (nextState) {
      this.changeState(nextState);
    }
  }
}