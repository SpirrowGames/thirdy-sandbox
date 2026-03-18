import { DEPTH_THRESHOLD, GROUND_Y_MIN, GROUND_Y_MAX } from '../constants.js';

export class Enemy {
  constructor(scene, x, y, type = 'grunt') {
    this.scene = scene;
    this.type = type;
    
    // 基本ステータス
    this.hp = 30;
    this.maxHp = 30;
    this.speed = 80; // px/s
    this.attackRange = 60; // px（X軸）
    this.attackDamage = 10;
    this.attackCooldown = 1500; // ms
    this.lastAttackTime = 0;
    
    // 位置情報
    this.x = x;
    this.groundY = Math.max(GROUND_Y_MIN, Math.min(GROUND_Y_MAX, y));
    this.displayY = this.groundY;
    
    // 状態管理
    this.state = 'idle';
    this.stateTimer = 0;
    this.alive = true;
    this.facingRight = true;
    
    // 移動制御
    this.velocity = { x: 0, y: 0 };
    this.targetPosition = { x: this.x, y: this.groundY };
    
    // Phaserスプライト作成（開発初期は矩形）
    this.sprite = this.scene.add.rectangle(x, this.displayY, 32, 48, 0xff6666);
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(32, 48);
    
    // 物理設定
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setImmovable(false);
    
    // 敵グループに追加
    if (this.scene.enemies) {
      this.scene.enemies.add(this.sprite);
    }
    
    // スプライトにエンティティ参照を保存
    this.sprite.entity = this;
  }

  /**
   * メインアップデートループ
   * @param {Object} player - プレイヤーオブジェクト
   * @param {number} delta - フレーム間隔（ms）
   */
  update(player, delta) {
    if (!this.alive || !player) return;

    this.stateTimer += delta;
    
    switch (this.state) {
      case 'idle':
        this.updateIdle(player, delta);
        break;
      case 'walk':
        this.updateWalk(player, delta);
        break;
      case 'attack':
        this.updateAttack(player, delta);
        break;
      case 'hurt':
        this.updateHurt(player, delta);
        break;
    }

    // 物理位置を更新
    this.updatePhysics(delta);
    
    // 向きを更新
    this.updateFacing(player);
  }

  /**
   * アイドル状態の更新
   */
  updateIdle(player, delta) {
    // 0.5秒後にwalk状態へ移行
    if (this.stateTimer > 500) {
      this.setState('walk');
    }
  }

  /**
   * 歩行状態の更新
   */
  updateWalk(player, delta) {
    // プレイヤーに向かって移動
    this.moveTowardsPlayer(player, delta);
    
    // 攻撃範囲内に入ったら攻撃状態へ
    if (this.inAttackRange(player)) {
      const currentTime = Date.now();
      if (currentTime - this.lastAttackTime >= this.attackCooldown) {
        this.setState('attack');
      }
    }
  }

  /**
   * 攻撃状態の更新
   */
  updateAttack(player, delta) {
    // 攻撃モーション中は移動停止
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    // 攻撃実行（アニメーション完了後）
    if (this.stateTimer > 600) { // 0.6秒後に攻撃判定
      this.executeAttack(player);
      this.setState('walk');
    }
  }

  /**
   * 被弾状態の更新
   */
  updateHurt(player, delta) {
    // ノックバック中は移動制御なし
    if (this.stateTimer > 400) { // 0.4秒後に復帰
      this.setState('walk');
    }
  }

  /**
   * プレイヤーに向かって移動する
   * @param {Object} player - プレイヤーオブジェクト
   * @param {number} delta - フレーム間隔（ms）
   */
  moveTowardsPlayer(player, delta) {
    const deltaSeconds = delta / 1000;
    
    // X軸移動（横方向）
    const dx = player.x - this.x;
    if (Math.abs(dx) > 5) { // 5px以内は停止
      const moveX = Math.sign(dx) * this.speed * deltaSeconds;
      this.velocity.x = Math.sign(dx) * this.speed;
      this.targetPosition.x = this.x + moveX;
    } else {
      this.velocity.x = 0;
    }

    // Y軸移動（奥行き）
    const dy = player.groundY - this.groundY;
    if (Math.abs(dy) > 5) { // 5px以内は停止
      const moveY = Math.sign(dy) * this.speed * deltaSeconds;
      this.velocity.y = Math.sign(dy) * this.speed;
      this.targetPosition.y = this.groundY + moveY;
      
      // 奥行き範囲制限
      this.targetPosition.y = Math.max(GROUND_Y_MIN, 
        Math.min(GROUND_Y_MAX, this.targetPosition.y));
    } else {
      this.velocity.y = 0;
    }
  }

  /**
   * プレイヤーが攻撃範囲内にいるかチェック
   * @param {Object} player - プレイヤーオブジェクト
   * @returns {boolean} 攻撃範囲内かどうか
   */
  inAttackRange(player) {
    // X軸距離チェック
    const dx = Math.abs(this.x - player.x);
    const xInRange = dx <= this.attackRange;
    
    // Y軸（奥行き）距離チェック
    const dy = Math.abs(this.groundY - player.groundY);
    const yInRange = dy <= DEPTH_THRESHOLD;
    
    return xInRange && yInRange;
  }

  /**
   * 攻撃実行
   * @param {Object} player - プレイヤーオブジェクト
   */
  executeAttack(player) {
    if (!this.inAttackRange(player)) return;

    // プレイヤーにダメージを与える
    if (player.takeDamage) {
      player.takeDamage(this.attackDamage, this.x);
    }

    // 攻撃クールダウン設定
    this.lastAttackTime = Date.now();
    
    // 攻撃エフェクト（簡易実装）
    this.showAttackEffect();
  }

  /**
   * 攻撃エフェクト表示
   */
  showAttackEffect() {
    const direction = this.facingRight ? 1 : -1;
    const effectX = this.x + direction * 30;
    
    // 一時的な攻撃エフェクト矩形を表示
    const effect = this.scene.add.rectangle(effectX, this.displayY, 20, 20, 0xffff00);
    effect.setAlpha(0.8);
    
    // 0.2秒後に消去
    this.scene.time.delayedCall(200, () => {
      if (effect) effect.destroy();
    });
  }

  /**
   * 物理位置の更新
   * @param {number} delta - フレーム間隔（ms）
   */
  updatePhysics(delta) {
    // 位置を更新
    this.x = this.targetPosition.x;
    this.groundY = this.targetPosition.y;
    this.displayY = this.groundY;
    
    // Phaserスプライトの位置を同期
    if (this.sprite && this.sprite.body) {
      this.sprite.x = this.x;
      this.sprite.y = this.displayY;
      this.sprite.body.setVelocity(this.velocity.x, this.velocity.y);
    }
  }

  /**
   * 向きの更新
   * @param {Object} player - プレイヤーオブジェクト
   */
  updateFacing(player) {
    if (player.x > this.x) {
      this.facingRight = true;
    } else if (player.x < this.x) {
      this.facingRight = false;
    }
    
    // スプライトの向きを反映（scaleXで反転）
    if (this.sprite) {
      this.sprite.scaleX = this.facingRight ? 1 : -1;
    }
  }

  /**
   * 状態変更
   * @param {string} newState - 新しい状態
   */
  setState(newState) {
    this.state = newState;
    this.stateTimer = 0;
    
    // 状態に応じた初期化処理
    switch (newState) {
      case 'attack':
        // 攻撃状態では色を変更（視覚的フィードバック）
        if (this.sprite) {
          this.sprite.setFillStyle(0xff3333);
          this.scene.time.delayedCall(600, () => {
            if (this.sprite) this.sprite.setFillStyle(0xff6666);
          });
        }
        break;
    }
  }

  /**
   * ダメージを受ける
   * @param {number} amount - ダメージ量
   * @param {number} sourceX - 攻撃源のX座標（ノックバック用）
   */
  takeDamage(amount, sourceX = null) {
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.destroy();
      return;
    }

    // ノックバック処理
    if (sourceX !== null) {
      const knockbackDirection = this.x > sourceX ? 1 : -1;
      const knockbackDistance = 50;
      
      this.targetPosition.x += knockbackDirection * knockbackDistance;
      this.velocity.x = knockbackDirection * 200; // 一時的な高速移動
      
      // ノックバック後に速度リセット
      this.scene.time.delayedCall(200, () => {
        this.velocity.x = 0;
      });
    }

    // 被弾状態に移行
    this.setState('hurt');
    
    // 被弾エフェクト
    if (this.sprite) {
      this.sprite.setFillStyle(0xffffff);
      this.scene.time.delayedCall(100, () => {
        if (this.sprite) this.sprite.setFillStyle(0xff6666);
      });
    }
  }

  /**
   * エンティティの破棄
   */
  destroy() {
    this.alive = false;
    
    // 死亡エフェクト
    if (this.sprite) {
      this.sprite.setFillStyle(0x666666);
      this.sprite.setAlpha(0.5);
    }
    
    // 0.5秒後に完全に削除
    this.scene.time.delayedCall(500, () => {
      if (this.sprite) {
        this.sprite.destroy();
      }
      
      // SpawnSystemに死亡通知
      if (this.scene.spawnSystem) {
        this.scene.spawnSystem.onEnemyDead();
      }
    });
  }

  /**
   * プレイヤーとの距離を取得
   * @param {Object} player - プレイヤーオブジェクト
   * @returns {number} 距離
   */
  getDistanceToPlayer(player) {
    const dx = this.x - player.x;
    const dy = this.groundY - player.groundY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * デバッグ情報の描画
   */
  drawDebugInfo() {
    if (!this.scene.debugGraphics) return;
    
    const graphics = this.scene.debugGraphics;
    
    // 攻撃範囲の可視化
    graphics.lineStyle(1, 0x00ff00);
    graphics.strokeCircle(this.x, this.displayY, this.attackRange);
    
    // 状態表示
    if (this.scene.debugText) {
      this.scene.debugText.setText(`State: ${this.state}\nHP: ${this.hp}/${this.maxHp}`);
    }
  }
}