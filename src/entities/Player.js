export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y;
    this.displayY = y;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200;
    
    // コンボシステム
    this.comboCount = 0;
    this.comboTimer = 0;
    this.COMBO_RESET = 1500; // ms
    this.MAX_COMBO = 3;
    
    // 状態管理
    this.state = 'idle';
    this.animationTimer = 0;
    this.canCancel = false; // キャンセルポイント管理
    
    // 攻撃タイミング設定
    this.ATTACK_DURATIONS = {
      1: { total: 400, cancelStart: 200, cancelEnd: 350 },
      2: { total: 500, cancelStart: 250, cancelEnd: 400 },
      3: { total: 800, cancelStart: 0, cancelEnd: 0 } // フィニッシャーはキャンセル不可
    };
    
    // 入力バッファ
    this.inputBuffer = [];
    this.INPUT_BUFFER_TIME = 200; // ms
    
    this.createSprite();
    this.setupInput();
  }
  
  createSprite() {
    // 開発初期は矩形で実装
    this.sprite = this.scene.add.rectangle(this.x, this.displayY, 48, 64, 0x3399ff);
    this.scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(48, 64);
    this.sprite.body.setCollideWorldBounds(true);
  }
  
  setupInput() {
    this.keys = this.scene.input.keyboard.addKeys('W,A,S,D,Z,X');
  }
  
  update(time, delta) {
    this.updateTimers(delta);
    this.handleInput();
    this.updateState(delta);
    this.updateMovement(delta);
    this.updateDisplay();
    
    // デバッグ表示
    this.updateDebugInfo();
  }
  
  updateTimers(delta) {
    // コンボタイマー更新
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
    
    // アニメーションタイマー更新
    if (this.animationTimer > 0) {
      this.animationTimer -= delta;
    }
    
    // 入力バッファクリーンアップ
    const now = time;
    this.inputBuffer = this.inputBuffer.filter(input => 
      now - input.time <= this.INPUT_BUFFER_TIME
    );
  }
  
  handleInput() {
    // Z攻撃入力
    if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
      this.bufferInput('Z', this.scene.time.now);
      this.tryAttack();
    }
    
    // 移動入力（攻撃中でない場合のみ）
    if (!this.isAttacking()) {
      this.handleMovementInput();
    }
  }
  
  bufferInput(key, time) {
    this.inputBuffer.push({ key, time });
  }
  
  tryAttack() {
    switch (this.state) {
      case 'idle':
      case 'walk':
        this.startAttack(1);
        break;
        
      case 'attack_1':
      case 'attack_2':
        if (this.canCancel) {
          const nextCombo = this.getCurrentComboLevel() + 1;
          if (nextCombo <= this.MAX_COMBO) {
            this.startAttack(nextCombo);
          }
        } else {
          // キャンセル不可時は入力をバッファに保存
          // アニメーション終了時にチェックする
        }
        break;
        
      case 'attack_3':
        // フィニッシャーはキャンセル不可
        break;
    }
  }
  
  startAttack(level) {
    const prevState = this.state;
    this.state = `attack_${level}`;
    
    const attackData = this.ATTACK_DURATIONS[level];
    this.animationTimer = attackData.total;
    this.canCancel = false;
    
    // ダメージとヒットボックス生成
    this.createAttackHitbox(level);
    
    // コンボカウント更新
    if (prevState === 'idle' || prevState === 'walk') {
      // 新しいコンボ開始
      this.comboCount = 1;
    } else {
      // コンボ継続
      this.comboCount = level;
    }
    
    // コンボタイマーリセット
    this.comboTimer = this.COMBO_RESET;
    
    // キャンセルポイント設定
    if (level < this.MAX_COMBO) {
      this.scene.time.delayedCall(attackData.cancelStart, () => {
        if (this.state === `attack_${level}`) {
          this.canCancel = true;
        }
      });
      
      this.scene.time.delayedCall(attackData.cancelEnd, () => {
        if (this.state === `attack_${level}`) {
          this.canCancel = false;
        }
      });
    }
    
    // 攻撃終了処理
    this.scene.time.delayedCall(attackData.total, () => {
      if (this.state === `attack_${level}`) {
        this.endAttack(level);
      }
    });
    
    // イベント通知
    this.scene.events.emit('comboUpdate', { 
      count: this.comboCount, 
      level: level 
    });
    
    // 視覚的フィードバック
    this.showAttackFeedback(level);
  }
  
  createAttackHitbox(level) {
    const damage = this.getAttackDamage(level);
    const range = this.getAttackRange(level);
    const duration = 100; // ヒットボックス持続時間
    
    const direction = 1; // 向き（実装時は this.facingRight を使用）
    const hitboxX = this.x + direction * range * 0.5;
    
    // 一時的なヒットボックス作成
    const hitbox = this.scene.physics.add.image(hitboxX, this.groundY, null);
    hitbox.setSize(range, 80); // 縦幅は奥行き判定用
    hitbox.setVisible(false);
    hitbox.body.setImmovable(true);
    
    // 敵との衝突判定（実装時は scene.enemies グループと判定）
    // this.scene.physics.add.overlap(hitbox, this.scene.enemies, this.onHitEnemy, null, this);
    
    // ヒットボックス削除
    this.scene.time.delayedCall(duration, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });
  }
  
  getAttackDamage(level) {
    const baseDamage = [15, 18, 25]; // レベル1,2,3
    return baseDamage[level - 1];
  }
  
  getAttackRange(level) {
    const baseRange = [80, 90, 120]; // レベル1,2,3
    return baseRange[level - 1];
  }
  
  endAttack(level) {
    // バッファされた入力をチェック
    const hasBufferedAttack = this.inputBuffer.some(input => input.key === 'Z');
    
    if (hasBufferedAttack && level < this.MAX_COMBO) {
      // バッファされた攻撃を実行
      this.inputBuffer = this.inputBuffer.filter(input => input.key !== 'Z');
      this.startAttack(level + 1);
    } else {
      // 攻撃終了
      this.state = 'idle';
      this.canCancel = false;
    }
  }
  
  updateState(delta) {
    switch (this.state) {
      case 'attack_1':
      case 'attack_2':
      case 'attack_3':
        // 攻撃アニメーション中の処理
        this.updateAttackAnimation(delta);
        break;
        
      case 'idle':
        // 移動入力があれば walk 状態に
        if (this.hasMovementInput()) {
          this.state = 'walk';
        }
        break;
        
      case 'walk':
        // 移動入力がなければ idle 状態に
        if (!this.hasMovementInput()) {
          this.state = 'idle';
        }
        break;
    }
  }
  
  updateAttackAnimation(delta) {
    const level = this.getCurrentComboLevel();
    const attackData = this.ATTACK_DURATIONS[level];
    const progress = 1 - (this.animationTimer / attackData.total);
    
    // 攻撃アニメーションの視覚的表現
    this.updateAttackVisuals(level, progress);
  }
  
  updateAttackVisuals(level, progress) {
    // 攻撃レベルに応じた色変化
    const colors = [0xff6666, 0xff9966, 0xffff66]; // レベル1,2,3
    const color = colors[level - 1];
    
    // フラッシュ効果
    if (progress < 0.3) {
      this.sprite.setTint(color);
    } else {
      this.sprite.clearTint();
    }
    
    // サイズ変化（攻撃の迫力演出）
    const scale = 1 + (Math.sin(progress * Math.PI) * 0.2);
    this.sprite.setScale(scale);
  }
  
  handleMovementInput() {
    let velocityX = 0;
    let velocityY = 0;
    
    if (this.keys.A.isDown) velocityX = -this.speed;
    if (this.keys.D.isDown) velocityX = this.speed;
    if (this.keys.W.isDown) velocityY = -this.speed;
    if (this.keys.S.isDown) velocityY = this.speed;
    
    this.sprite.body.setVelocity(velocityX, velocityY);
  }
  
  updateMovement(delta) {
    if (this.isAttacking()) {
      // 攻撃中は移動停止
      this.sprite.body.setVelocity(0, 0);
    }
  }
  
  updateDisplay() {
    // 位置更新
    this.x = this.sprite.x;
    this.y = this.sprite.y;
    this.groundY = this.y; // 簡易実装（ジャンプ未実装）
    this.displayY = this.y;
  }
  
  resetCombo() {
    const oldCount = this.comboCount;
    this.comboCount = 0;
    this.comboTimer = 0;
    
    if (oldCount > 0) {
      // コンボリセットイベント
      this.scene.events.emit('comboReset', { previousCount: oldCount });
    }
  }
  
  // ヘルパーメソッド
  isAttacking() {
    return this.state.startsWith('attack_');
  }
  
  getCurrentComboLevel() {
    if (!this.isAttacking()) return 0;
    return parseInt(this.state.split('_')[1]);
  }
  
  hasMovementInput() {
    return this.keys.A.isDown || this.keys.D.isDown || 
           this.keys.W.isDown || this.keys.S.isDown;
  }
  
  showAttackFeedback(level) {
    // 攻撃レベルに応じたエフェクト
    const effectColors = [0xff0000, 0xff8800, 0xffff00];
    const color = effectColors[level - 1];
    
    // パーティクル風エフェクト（簡易実装）
    const particles = this.scene.add.group();
    for (let i = 0; i < level * 3; i++) {
      const particle = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-30, 30),
        this.y + Phaser.Math.Between(-20, 20),
        4, 4, color
      );
      particles.add(particle);
      
      // パーティクルアニメーション
      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0,
        duration: 300,
        onComplete: () => particle.destroy()
      });
    }
  }
  
  updateDebugInfo() {
    // デバッグ情報表示（開発用）
    if (!this.debugText) {
      this.debugText = this.scene.add.text(10, 10, '', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000aa'
      });
      this.debugText.setScrollFactor(0);
    }
    
    this.debugText.setText([
      `State: ${this.state}`,
      `Combo: ${this.comboCount}`,
      `Timer: ${Math.ceil(this.comboTimer)}ms`,
      `Can Cancel: ${this.canCancel}`,
      `Anim Timer: ${Math.ceil(this.animationTimer)}ms`,
      `Buffer: ${this.inputBuffer.length}`
    ]);
  }
  
  // 外部からのダメージ処理（コンボリセット）
  takeDamage(amount) {
    this.hp -= amount;
    this.resetCombo(); // 被弾時はコンボリセット
    
    // 被弾状態に移行
    this.state = 'hurt';
    this.animationTimer = 300;
    
    this.scene.time.delayedCall(300, () => {
      if (this.state === 'hurt') {
        this.state = 'idle';
      }
    });
    
    // 無敵時間設定等は別途実装
  }
}