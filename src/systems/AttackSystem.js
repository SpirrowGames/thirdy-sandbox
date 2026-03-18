export class AttackSystem {
  constructor() {
    this.currentAttackState = 'IDLE';
    this.attackAnimationTimer = 0;
    this.canCancel = false;
    this.nextAttackQueued = false;
    
    // 各攻撃段階の設定
    this.ATTACK_CONFIGS = {
      ATTACK_1: {
        duration: 400,      // アニメーション全体時間
        cancelWindow: 200,  // キャンセル可能時間
        damage: 15,
        range: 80,
        knockback: { x: 100, y: 0 }
      },
      ATTACK_2: {
        duration: 450,
        cancelWindow: 220,
        damage: 18,
        range: 90,
        knockback: { x: 120, y: 0 }
      },
      ATTACK_3: {
        duration: 600,
        cancelWindow: 0,    // フィニッシャーはキャンセル不可
        damage: 25,
        range: 100,
        knockback: { x: 200, y: 0 }
      }
    };
  }

  /**
   * 攻撃入力を処理する
   * @returns {string|null} - 実行される攻撃状態、またはnull
   */
  handleAttackInput() {
    switch (this.currentAttackState) {
      case 'IDLE':
      case 'WALK':
        return this.startAttack('ATTACK_1');
        
      case 'ATTACK_1':
        if (this.canCancel) {
          return this.startAttack('ATTACK_2');
        } else {
          this.nextAttackQueued = true;
          return null;
        }
        
      case 'ATTACK_2':
        if (this.canCancel) {
          return this.startAttack('ATTACK_3');
        } else {
          this.nextAttackQueued = true;
          return null;
        }
        
      case 'ATTACK_3':
        // フィニッシャーはキャンセル不可
        return null;
        
      default:
        return null;
    }
  }

  /**
   * 攻撃を開始する
   * @param {string} attackType - 攻撃タイプ
   * @returns {string} - 開始された攻撃タイプ
   */
  startAttack(attackType) {
    const config = this.ATTACK_CONFIGS[attackType];
    this.currentAttackState = attackType;
    this.attackAnimationTimer = config.duration;
    this.canCancel = false;
    this.nextAttackQueued = false;
    
    return attackType;
  }

  /**
   * フレーム毎の更新処理
   * @param {number} deltaTime - フレーム間の経過時間（ms）
   */
  update(deltaTime) {
    if (this.currentAttackState === 'IDLE' || this.currentAttackState === 'WALK') {
      return;
    }

    const config = this.ATTACK_CONFIGS[this.currentAttackState];
    this.attackAnimationTimer -= deltaTime;

    // キャンセル可能ウィンドウの判定
    const remainingTime = this.attackAnimationTimer;
    const cancelWindowEnd = config.duration - config.cancelWindow;
    this.canCancel = remainingTime > cancelWindowEnd && config.cancelWindow > 0;

    // キャンセル可能ウィンドウでキューされた攻撃を処理
    if (this.canCancel && this.nextAttackQueued) {
      this.nextAttackQueued = false;
      this.handleAttackInput();
      return;
    }

    // アニメーション終了判定
    if (this.attackAnimationTimer <= 0) {
      this.currentAttackState = 'IDLE';
      this.canCancel = false;
      this.nextAttackQueued = false;
    }
  }

  /**
   * 攻撃を強制的にリセットする（被弾時など）
   */
  resetAttack() {
    this.currentAttackState = 'IDLE';
    this.attackAnimationTimer = 0;
    this.canCancel = false;
    this.nextAttackQueued = false;
  }

  /**
   * 現在の攻撃設定を取得
   */
  getCurrentAttackConfig() {
    if (this.currentAttackState === 'IDLE' || this.currentAttackState === 'WALK') {
      return null;
    }
    return this.ATTACK_CONFIGS[this.currentAttackState];
  }
}