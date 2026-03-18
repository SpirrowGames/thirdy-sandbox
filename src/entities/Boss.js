import { Enemy } from './Enemy.js';

export class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // ボス固有ステータス
    this.hp = 200;
    this.maxHp = 200;
    this.phase = 1;
    this.speed = 60; // 雑魚より遅い
    this.attackDamage = 20;
    
    // 行動制御
    this.actionTimer = 0;
    this.actionCooldown = 2000; // 2秒間隔で行動選択
    this.currentAction = null;
    this.actionStartTime = 0;
    
    // 攻撃別クールダウン
    this.steamBlastCooldown = 0;
    this.chargeCooldown = 0;
    
    // 距離判定閾値
    this.CLOSE_RANGE = 120;
    this.MID_RANGE = 300;
    
    // スプライト設定（矩形フェーズ）
    this.sprite.setTint(0x8B4513); // 茶色（蒸気鎧）
    this.sprite.setSize(64, 96); // より大きなサイズ
    
    console.log('Boss spawned at phase 1');
  }

  update(time, delta) {
    // フェーズ移行チェック
    this.checkPhaseTransition();
    
    // 行動選択・実行
    this.updateAction(time, delta);
    
    // クールダウン更新
    this.steamBlastCooldown = Math.max(0, this.steamBlastCooldown - delta);
    this.chargeCooldown = Math.max(0, this.chargeCooldown - delta);
    
    super.update(time, delta);
  }

  checkPhaseTransition() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.enterPhase2();
    }
  }

  enterPhase2() {
    this.phase = 2;
    this.actionCooldown = 1500; // フェーズ2では行動間隔を短縮
    
    // フェーズ移行演出
    this.scene.cameras.main.flash(300, 255, 100, 100);
    this.sprite.setTint(0xFF4500); // オレンジ色に変化
    
    // 一時的な無敵
    this.invincible = true;
    this.scene.time.delayedCall(1000, () => {
      this.invincible = false;
    });
    
    console.log('Boss entered Phase 2');
    this.scene.events.emit('bossPhase2');
  }

  updateAction(time, delta) {
    const player = this.scene.player;
    if (!player || !player.alive) return;

    // 現在のアクション実行中の場合
    if (this.currentAction) {
      this.executeCurrentAction(time, delta, player);
      return;
    }

    // 新しいアクション選択
    this.actionTimer += delta;
    if (this.actionTimer >= this.actionCooldown) {
      this.selectAction(player);
      this.actionTimer = 0;
    }
  }

  selectAction(player) {
    const distance = this.getDistanceToPlayer(player);
    const actions = [];

    if (distance <= this.CLOSE_RANGE) {
      // 近距離：踏み込みパンチ
      actions.push('stompPunch');
    } else if (distance <= this.MID_RANGE) {
      // 中距離
      if (this.phase === 2 && this.steamBlastCooldown <= 0) {
        actions.push('steamBlast');
      }
      actions.push('stompPunch'); // 近づいて攻撃
    } else {
      // 遠距離
      if (this.phase === 2 && this.chargeCooldown <= 0) {
        actions.push('charge');
      }
      actions.push('advance'); // 前進
    }

    // ランダムで行動選択
    const selectedAction = actions[Math.floor(Math.random() * actions.length)];
    this.startAction(selectedAction);
  }

  startAction(actionName) {
    this.currentAction = actionName;
    this.actionStartTime = this.scene.time.now;
    
    console.log(`Boss starting action: ${actionName}`);
    
    switch (actionName) {
      case 'stompPunch':
        this.startStompPunch();
        break;
      case 'steamBlast':
        this.startSteamBlast();
        break;
      case 'charge':
        this.startCharge();
        break;
      case 'advance':
        this.startAdvance();
        break;
    }
  }

  executeCurrentAction(time, delta, player) {
    const elapsed = time - this.actionStartTime;
    
    switch (this.currentAction) {
      case 'stompPunch':
        this.executeStompPunch(elapsed, player);
        break;
      case 'steamBlast':
        this.executeSteamBlast(elapsed, player);
        break;
      case 'charge':
        this.executeCharge(elapsed, player);
        break;
      case 'advance':
        this.executeAdvance(elapsed, player);
        break;
    }
  }

  // 踏み込みパンチ実装
  startStompPunch() {
    this.body.setVelocity(0, 0); // 停止
    this.state = 'attacking';
  }

  executeStompPunch(elapsed, player) {
    if (elapsed < 500) {
      // 予備動作：0.5秒間停止
      return;
    } else if (elapsed < 700) {
      // 踏み込み：0.2秒で前進
      const direction = this.x < player.x ? 1 : -1;
      this.body.setVelocityX(direction * 400);
    } else if (elapsed < 900) {
      // 攻撃判定
      this.body.setVelocityX(0);
      if (elapsed >= 700 && elapsed < 750) { // 50ms間のみ判定
        this.performStompPunchHit(player);
      }
    } else {
      // アクション終了
      this.endCurrentAction();
    }
  }

  performStompPunchHit(player) {
    const distance = Math.abs(this.x - player.x);
    const depthDiff = Math.abs(this.groundY - player.groundY);
    
    if (distance <= 80 && depthDiff <= 40) {
      player.takeDamage(this.attackDamage, this.x);
      this.scene.hitStop(120); // 重い打撃感
      console.log('Boss stomp punch hit!');
    }
  }

  // 蒸気噴射実装
  startSteamBlast() {
    this.body.setVelocity(0, 0);
    this.state = 'special_attacking';
    this.steamBlastCooldown = 4000; // 4秒クールダウン
  }

  executeSteamBlast(elapsed, player) {
    if (elapsed < 800) {
      // チャージ時間：0.8秒
      if (elapsed % 200 < 100) {
        this.sprite.setTint(0xFF6600); // 点滅効果
      } else {
        this.sprite.setTint(0xFF4500);
      }
      return;
    } else if (elapsed < 1200) {
      // 蒸気噴射実行：0.4秒間
      if (elapsed >= 800 && elapsed < 850) { // 50ms間のみ判定
        this.performSteamBlast(player);
      }
    } else {
      // アクション終了
      this.endCurrentAction();
    }
  }

  performSteamBlast(player) {
    const dx = player.x - this.x;
    const dy = player.groundY - this.groundY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 前方120度扇形、射程250px
    if (distance <= 250) {
      const angle = Math.atan2(dy, dx);
      const facingAngle = this.facingRight ? 0 : Math.PI;
      const angleDiff = Math.abs(this.normalizeAngle(angle - facingAngle));
      
      if (angleDiff <= Math.PI / 3) { // 60度以内
        player.takeDamage(15, this.x);
        console.log('Boss steam blast hit!');
        
        // 蒸気エフェクト表示
        this.showSteamEffect();
      }
    }
  }

  showSteamEffect() {
    // 簡易蒸気エフェクト（半透明の扇形）
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xCCCCCC, 0.6);
    
    const startAngle = this.facingRight ? -Math.PI/3 : Math.PI*2/3;
    const endAngle = this.facingRight ? Math.PI/3 : Math.PI*4/3;
    
    graphics.slice(this.x, this.groundY, 250, startAngle, endAngle);
    graphics.fillPath();
    
    // 0.5秒後に消去
    this.scene.time.delayedCall(500, () => graphics.destroy());
  }

  // 突進攻撃実装
  startCharge() {
    this.body.setVelocity(0, 0);
    this.state = 'charging';
    this.chargeCooldown = 5000; // 5秒クールダウン
    this.chargeDirection = this.x < this.scene.player.x ? 1 : -1;
  }

  executeCharge(elapsed, player) {
    if (elapsed < 600) {
      // 予備動作：0.6秒
      if (elapsed % 150 < 75) {
        this.sprite.setTint(0xFF0000); // 赤く点滅
      } else {
        this.sprite.setTint(0xFF4500);
      }
      return;
    } else if (elapsed < 1400) {
      // 突進実行：0.8秒間
      this.body.setVelocityX(this.chargeDirection * 500);
      
      // 突進中の当たり判定
      const distance = Math.abs(this.x - player.x);
      const depthDiff = Math.abs(this.groundY - player.groundY);
      
      if (distance <= 60 && depthDiff <= 40) {
        player.takeDamage(25, this.x); // 高ダメージ
        this.scene.hitStop(150);
        console.log('Boss charge hit!');
        this.endCurrentAction(); // ヒット後即終了
        return;
      }
    } else {
      // アクション終了
      this.body.setVelocityX(0);
      this.endCurrentAction();
    }
  }

  // 前進行動
  startAdvance() {
    this.state = 'walking';
  }

  executeAdvance(elapsed, player) {
    if (elapsed < 1000) {
      // 1秒間前進
      const direction = this.x < player.x ? 1 : -1;
      this.body.setVelocityX(direction * this.speed);
    } else {
      this.endCurrentAction();
    }
  }

  endCurrentAction() {
    this.currentAction = null;
    this.body.setVelocity(0, 0);
    this.state = 'idle';
    this.sprite.setTint(this.phase === 1 ? 0x8B4513 : 0xFF4500); // 元の色に戻す
  }

  getDistanceToPlayer(player) {
    const dx = this.x - player.x;
    const dy = this.groundY - player.groundY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  takeDamage(amount, sourceX, weaponType = null) {
    if (this.invincible) return;
    
    // 武器弱点システム
    let multiplier = 1.0;
    if (weaponType && this.scene.weaponDefs[weaponType]?.bossWeakness) {
      multiplier = 1.5;
      // 弱点ヒット演出
      this.sprite.setTint(0xFFFF00);
      this.scene.time.delayedCall(100, () => {
        this.sprite.setTint(this.phase === 1 ? 0x8B4513 : 0xFF4500);
      });
      console.log('Boss weakness hit!');
    }
    
    const finalDamage = Math.floor(amount * multiplier);
    super.takeDamage(finalDamage, sourceX);
    
    // HP変更をUIに通知
    this.scene.events.emit('bossHpChange', {
      current: this.hp,
      max: this.maxHp,
      phase: this.phase
    });
  }

  destroy() {
    // ボス撃破演出
    this.scene.cameras.main.shake(500, 0.02);
    this.scene.events.emit('bossDefeated');
    super.destroy();
  }
}