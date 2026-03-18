import { PlayerState } from './PlayerState.js';

export class AttackState extends PlayerState {
  constructor(name, attackLevel) {
    super(name);
    this.attackLevel = attackLevel;
    this.animationComplete = false;
    this.canCancel = false;
    this.hitboxCreated = false;
  }

  enter(player) {
    this.animationComplete = false;
    this.canCancel = false;
    this.hitboxCreated = false;
    
    player.body.setVelocity(0, 0);
    player.sprite.play(`player_${this.name}`, false);
    
    // アニメーション完了イベント
    player.sprite.once('animationcomplete', () => {
      this.animationComplete = true;
    });

    // キャンセル可能タイミング（アニメーションの60%時点）
    player.scene.time.delayedCall(
      player.sprite.anims.currentAnim.duration * 0.6,
      () => { this.canCancel = true; }
    );

    // 攻撃判定発生タイミング（アニメーションの30%時点）
    player.scene.time.delayedCall(
      player.sprite.anims.currentAnim.duration * 0.3,
      () => { this.createHitbox(player); }
    );
  }

  createHitbox(player) {
    if (this.hitboxCreated) return;
    this.hitboxCreated = true;

    const damage = this.getAttackDamage(player);
    const range = this.getAttackRange(player);
    
    player.scene.createAttackHitbox(player, damage, range, 100);
    
    // コンボカウント増加
    player.incrementCombo();
  }

  getAttackDamage(player) {
    const baseDamage = [15, 18, 25]; // attack_1, attack_2, attack_3
    let damage = baseDamage[this.attackLevel - 1];
    
    // 武器補正
    if (player.heldWeapon) {
      damage += player.heldWeapon.damage;
      player.heldWeapon.use(); // 耐久度減少
    }
    
    return damage;
  }

  getAttackRange(player) {
    let range = 80; // 基本リーチ
    if (player.heldWeapon) {
      range = player.heldWeapon.range;
    }
    return range;
  }

  update(player, time, delta) {
    const keys = player.keys;

    // キャンセル可能時間内の次段攻撃
    if (this.canCancel && Phaser.Input.Keyboard.JustDown(keys.Z)) {
      if (this.attackLevel < 3) {
        return `attack_${this.attackLevel + 1}`;
      }
    }

    // アニメーション完了でIDLEに戻る
    if (this.animationComplete) {
      return 'idle';
    }

    return null;
  }

  canTransitionTo(nextState) {
    // 攻撃中は特定のステートにのみ遷移可能
    const allowedStates = ['attack_2', 'attack_3', 'idle', 'hurt', 'knockdown'];
    return allowedStates.includes(nextState);
  }
}