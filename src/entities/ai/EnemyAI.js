/**
 * 敵AI基底クラス
 * プレイヤー接近判定、攻撃範囲計算、奥行き判定、攻撃クールダウン管理を担当
 */
export class EnemyAI {
  constructor(owner, config = {}) {
    this.owner = owner;
    this.target = null;
    
    // AI設定（デフォルト値）
    this.config = {
      detectionRange: config.detectionRange || 300,    // 検知範囲（px）
      attackRange: config.attackRange || 60,           // 攻撃範囲（px）
      attackCooldown: config.attackCooldown || 1500,   // 攻撃クールダウン（ms）
      moveSpeed: config.moveSpeed || 80,               // 移動速度（px/s）
      aggroLossTime: config.aggroLossTime || 3000,     // ターゲット喪失時間（ms）
      ...config
    };
    
    // 状態管理
    this.state = 'idle';
    this.lastAttackTime = 0;
    this.aggroTime = 0;
    this.stateTimer = 0;
    
    // デバッグ用
    this.debugMode = false;
  }

  /**
   * 毎フレーム更新
   */
  update(time, delta, player) {
    this.target = player;
    this.stateTimer += delta;
    
    // 状態に応じた行動
    switch (this.state) {
      case 'idle':
        this.updateIdle(time, delta);
        break;
      case 'patrol':
        this.updatePatrol(time, delta);
        break;
      case 'chase':
        this.updateChase(time, delta);
        break;
      case 'attack':
        this.updateAttack(time, delta);
        break;
      case 'cooldown':
        this.updateCooldown(time, delta);
        break;
      case 'hurt':
        this.updateHurt(time, delta);
        break;
    }
    
    this.debugDraw();
  }

  /**
   * プレイヤーとの距離計算（X軸）
   */
  getDistanceToPlayer() {
    if (!this.target) return Infinity;
    return Math.abs(this.owner.x - this.target.x);
  }

  /**
   * プレイヤーとの奥行き判定
   */
  isDepthAligned() {
    if (!this.target) return false;
    const depthDiff = Math.abs(this.owner.groundY - this.target.groundY);
    return depthDiff < this.config.depthThreshold || 40; // デフォルト40px
  }

  /**
   * プレイヤーが検知範囲内にいるかチェック
   */
  isPlayerInDetectionRange() {
    return this.getDistanceToPlayer() <= this.config.detectionRange;
  }

  /**
   * プレイヤーが攻撃範囲内にいるかチェック
   */
  isPlayerInAttackRange() {
    const inRange = this.getDistanceToPlayer() <= this.config.attackRange;
    const depthOk = this.isDepthAligned();
    return inRange && depthOk;
  }

  /**
   * 攻撃クールダウン中かチェック
   */
  isAttackOnCooldown(currentTime) {
    return currentTime - this.lastAttackTime < this.config.attackCooldown;
  }

  /**
   * プレイヤーの方向を取得
   */
  getDirectionToPlayer() {
    if (!this.target) return 0;
    return this.target.x > this.owner.x ? 1 : -1;
  }

  /**
   * 待機状態の更新
   */
  updateIdle(time, delta) {
    // プレイヤーを検知したら追跡開始
    if (this.isPlayerInDetectionRange()) {
      this.changeState('chase');
      this.aggroTime = time;
    }
    
    // 一定時間後にパトロール開始（オプション）
    if (this.stateTimer > 2000) {
      this.changeState('patrol');
    }
  }

  /**
   * パトロール状態の更新
   */
  updatePatrol(time, delta) {
    // プレイヤーを検知したら追跡開始
    if (this.isPlayerInDetectionRange()) {
      this.changeState('chase');
      this.aggroTime = time;
      return;
    }
    
    // 簡単なパトロール動作（左右移動）
    const patrolSpeed = this.config.moveSpeed * 0.5;
    const direction = Math.sin(time * 0.001) > 0 ? 1 : -1;
    this.owner.setVelocityX(direction * patrolSpeed);
  }

  /**
   * 追跡状態の更新
   */
  updateChase(time, delta) {
    // プレイヤーが攻撃範囲内なら攻撃
    if (this.isPlayerInAttackRange() && !this.isAttackOnCooldown(time)) {
      this.changeState('attack');
      return;
    }
    
    // プレイヤーが検知範囲外に出て一定時間経過したら諦める
    if (!this.isPlayerInDetectionRange()) {
      if (time - this.aggroTime > this.config.aggroLossTime) {
        this.changeState('idle');
        return;
      }
    } else {
      this.aggroTime = time; // 検知範囲内なら時間リセット
    }
    
    // プレイヤーに向かって移動
    this.moveTowardsPlayer();
  }

  /**
   * 攻撃状態の更新
   */
  updateAttack(time, delta) {
    // 攻撃実行
    this.owner.setVelocityX(0); // 移動停止
    
    if (this.stateTimer > 200) { // 攻撃準備時間
      this.performAttack();
      this.lastAttackTime = time;
      this.changeState('cooldown');
    }
  }

  /**
   * クールダウン状態の更新
   */
  updateCooldown(time, delta) {
    this.owner.setVelocityX(0);
    
    if (this.stateTimer > 500) { // クールダウン時間
      // プレイヤーがまだ近くにいるかチェック
      if (this.isPlayerInDetectionRange()) {
        this.changeState('chase');
      } else {
        this.changeState('idle');
      }
    }
  }

  /**
   * 被弾状態の更新
   */
  updateHurt(time, delta) {
    this.owner.setVelocityX(0);
    
    if (this.stateTimer > 300) { // 被弾硬直時間
      this.changeState('chase'); // 反撃に移る
      this.aggroTime = time;
    }
  }

  /**
   * プレイヤーに向かって移動
   */
  moveTowardsPlayer() {
    if (!this.target) return;
    
    const direction = this.getDirectionToPlayer();
    this.owner.setVelocityX(direction * this.config.moveSpeed);
    
    // 向きを更新
    this.owner.facingRight = direction > 0;
    
    // 奥行き調整（プレイヤーに近づく）
    const depthDiff = this.target.groundY - this.owner.groundY;
    if (Math.abs(depthDiff) > 10) {
      const depthDirection = depthDiff > 0 ? 1 : -1;
      this.owner.setVelocityY(depthDirection * this.config.moveSpeed * 0.5);
    } else {
      this.owner.setVelocityY(0);
    }
  }

  /**
   * 攻撃実行
   */
  performAttack() {
    if (!this.isPlayerInAttackRange()) return;
    
    // オーナーの攻撃メソッドを呼び出し
    if (this.owner.doAttack) {
      this.owner.doAttack(this.target);
    }
  }

  /**
   * 状態変更
   */
  changeState(newState) {
    this.state = newState;
    this.stateTimer = 0;
    
    // 状態変更時の処理
    this.onStateEnter(newState);
  }

  /**
   * 状態開始時の処理
   */
  onStateEnter(state) {
    switch (state) {
      case 'attack':
        // 攻撃アニメーション開始
        if (this.owner.play) {
          this.owner.play(`${this.owner.animPrefix}_attack`);
        }
        break;
      case 'chase':
        // 追跡アニメーション開始
        if (this.owner.play) {
          this.owner.play(`${this.owner.animPrefix}_walk`);
        }
        break;
      case 'idle':
        // 待機アニメーション開始
        if (this.owner.play) {
          this.owner.play(`${this.owner.animPrefix}_idle`);
        }
        break;
    }
  }

  /**
   * 被弾時の処理
   */
  onHit(damage, sourceX) {
    this.changeState('hurt');
    
    // ノックバック
    const direction = this.owner.x > sourceX ? 1 : -1;
    this.owner.setVelocityX(direction * 200);
    
    // 強制的にアグロを取る
    this.aggroTime = Date.now();
  }

  /**
   * デバッグ描画
   */
  debugDraw() {
    if (!this.debugMode || !this.owner.scene) return;
    
    const graphics = this.owner.scene.debugGraphics;
    if (!graphics) return;
    
    graphics.clear();
    
    // 検知範囲
    graphics.lineStyle(1, 0x00ff00);
    graphics.strokeCircle(this.owner.x, this.owner.groundY, this.config.detectionRange);
    
    // 攻撃範囲
    graphics.lineStyle(2, 0xff0000);
    graphics.strokeCircle(this.owner.x, this.owner.groundY, this.config.attackRange);
    
    // 奥行き判定範囲
    graphics.lineStyle(1, 0x0000ff);
    graphics.strokeRect(
      this.owner.x - 10, 
      this.owner.groundY - 20, 
      20, 
      40
    );
    
    // 状態表示
    if (this.owner.scene.add) {
      const text = this.owner.scene.add.text(
        this.owner.x, 
        this.owner.y - 40, 
        this.state, 
        { fontSize: '12px', fill: '#ffffff' }
      );
      text.setOrigin(0.5);
      this.owner.scene.time.delayedCall(100, () => text.destroy());
    }
  }

  /**
   * デバッグモード切り替え
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * AI設定の動的変更
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 破棄処理
   */
  destroy() {
    this.target = null;
    this.owner = null;
  }
}