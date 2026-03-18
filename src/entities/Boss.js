import { Enemy } from './Enemy.js';

export class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // ボス固有パラメータ
    this.maxHp = 200;
    this.hp = 200;
    this.phase = 1;
    this.speed = 60; // 雑魚より遅め
    
    // 攻撃パラメータ
    this.punchRange = 120;
    this.punchDamage = 25;
    this.steamRange = 250;
    this.steamDamage = 15;
    this.chargeSpeed = 180;
    this.chargeDamage = 30;
    
    // クールダウン管理
    this.steamCooldown = 0;
    this.chargeCooldown = 0;
    this.STEAM_COOLDOWN_TIME = 3000; // 3秒
    this.CHARGE_COOLDOWN_TIME = 4000; // 4秒
    
    // 攻撃状態管理
    this.currentAction = null;
    this.actionTimer = 0;
    this.isCharging = false;
    this.chargeStartX = 0;
    
    // 距離判定閾値
    this.CLOSE_RANGE = 120;
    this.MID_RANGE = 300;
    
    // フェーズ2移行フラグ
    this.phase2Triggered = false;
  }

  update(player, dt) {
    super.update(player, dt);
    
    // フェーズ2移行チェック
    this.checkPhaseTransition();
    
    // クールダウン更新
    this.updateCooldowns(dt);
    
    // 行動選択と実行
    if (this.state === 'idle' || this.state === 'walk') {
      this.selectAction(player);
    }
    
    // 現在の行動を実行
    this.executeCurrentAction(player, dt);
  }

  checkPhaseTransition() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5 && !this.phase2Triggered) {
      this.enterPhase2();
    }
  }

  enterPhase2() {
    this.phase2Triggered = true;
    this.phase = 2;
    this.state = 'phase_transition';
    this.actionTimer = 1500; // 1.5秒の演出時間
    
    // 演出開始
    this.scene.physics.world.pause();
    
    // 点滅演出
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 150,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        // 画面フラッシュ
        this.scene.cameras.main.flash(300, 255, 255, 255);
        
        // 物理再開
        this.scene.physics.world.resume();
        this.state = 'idle';
        
        // フェーズ2開始イベント
        this.scene.events.emit('bossPhase2Start');
      }
    });
  }

  updateCooldowns(dt) {
    if (this.steamCooldown > 0) {
      this.steamCooldown -= dt;
    }
    if (this.chargeCooldown > 0) {
      this.chargeCooldown -= dt;
    }
  }

  selectAction(player) {
    const distance = this.getDistanceToPlayer(player);
    const availableActions = this.getAvailableActions(distance);
    
    if (availableActions.length === 0) {
      // 利用可能な攻撃がない場合は接近
      this.currentAction = 'approach';
      this.state = 'walk';
      return;
    }
    
    // 重み付き選択
    const action = this.selectWeightedAction(availableActions, distance);
    this.startAction(action);
  }

  getDistanceToPlayer(player) {
    return Math.abs(this.x - player.x);
  }

  getAvailableActions(distance) {
    const actions = [];
    
    // 踏み込みパンチ（常に利用可能）
    if (distance <= this.CLOSE_RANGE) {
      actions.push('punch');
    }
    
    // フェーズ2の追加攻撃
    if (this.phase === 2) {
      // 蒸気噴射
      if (distance >= this.CLOSE_RANGE && distance <= this.MID_RANGE && this.steamCooldown <= 0) {
        actions.push('steam_blast');
      }
      
      // 突進攻撃
      if (distance > this.MID_RANGE && this.chargeCooldown <= 0) {
        actions.push('charge');
      }
    }
    
    return actions;
  }

  selectWeightedAction(actions, distance) {
    // 距離に応じた重み付け
    const weights = {
      punch: distance <= this.CLOSE_RANGE ? 0.7 : 0,
      steam_blast: (distance >= this.CLOSE_RANGE && distance <= this.MID_RANGE) ? 0.6 : 0,
      charge: distance > this.MID_RANGE ? 0.8 : 0
    };
    
    // 重み付きランダム選択
    const totalWeight = actions.reduce((sum, action) => sum + weights[action], 0);
    let random = Math.random() * totalWeight;
    
    for (const action of actions) {
      random -= weights[action];
      if (random <= 0) {
        return action;
      }
    }
    
    return actions[0]; // フォールバック
  }

  startAction(action) {
    this.currentAction = action;
    this.actionTimer = 0;
    
    switch (action) {
      case 'punch':
        this.state = 'attack_punch';
        this.actionTimer = 800; // パンチモーション時間
        break;
        
      case 'steam_blast':
        this.state = 'attack_steam';
        this.actionTimer = 1200; // 蒸気噴射時間
        this.steamCooldown = this.STEAM_COOLDOWN_TIME;
        break;
        
      case 'charge':
        this.state = 'attack_charge';
        this.isCharging = true;
        this.chargeStartX = this.x;
        this.actionTimer = 2000; // 最大突進時間
        this.chargeCooldown = this.CHARGE_COOLDOWN_TIME;
        break;
        
      case 'approach':
        this.state = 'walk';
        break;
    }
  }

  executeCurrentAction(player, dt) {
    this.actionTimer -= dt;
    
    switch (this.currentAction) {
      case 'punch':
        this.executePunch(player, dt);
        break;
        
      case 'steam_blast':
        this.executeSteamBlast(player, dt);
        break;
        
      case 'charge':
        this.executeCharge(player, dt);
        break;
        
      case 'approach':
        this.executeApproach(player, dt);
        break;
    }
    
    // アクション終了チェック
    if (this.actionTimer <= 0 && this.currentAction !== 'approach') {
      this.endCurrentAction();
    }
  }

  executePunch(player, dt) {
    if (this.actionTimer <= 600 && this.actionTimer > 400) {
      // パンチ発動タイミング（200msの判定ウィンドウ）
      const distance = Math.abs(this.x - player.x);
      const depthAligned = Math.abs(this.groundY - player.groundY) < 40;
      
      if (distance <= this.punchRange && depthAligned) {
        this.performPunchHit(player);
      }
    }
  }

  performPunchHit(player) {
    // ヒットボックス生成
    const direction = player.x > this.x ? 1 : -1;
    const hitboxX = this.x + direction * this.punchRange * 0.5;
    
    const hitbox = this.scene.physics.add.image(hitboxX, this.groundY, '__WHITE');
    hitbox.setSize(this.punchRange, 80);
    hitbox.setVisible(false);
    
    // 衝突判定
    this.scene.physics.add.overlap(hitbox, player.sprite, () => {
      const knockback = { x: direction * 200, y: 0 };
      player.takeDamage(this.punchDamage, knockback);
      this.scene.hitStop(100); // ヒットストップ
    });
    
    // ヒットボックス削除
    this.scene.time.delayedCall(100, () => hitbox.destroy());
  }

  executeSteamBlast(player, dt) {
    if (this.actionTimer <= 900 && this.actionTimer > 600) {
      // 蒸気噴射発動タイミング（300msの判定ウィンドウ）
      this.performSteamBlast(player);
    }
  }

  performSteamBlast(player) {
    const direction = player.x > this.x ? 1 : -1;
    
    // 扇形範囲の判定
    const playerAngle = Phaser.Math.Angle.Between(this.x, this.groundY, player.x, player.groundY);
    const facingAngle = direction > 0 ? 0 : Math.PI;
    const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(playerAngle - facingAngle));
    
    const distance = Math.abs(this.x - player.x);
    const depthDistance = Math.abs(this.groundY - player.groundY);
    
    // 扇形判定（前方120度、距離250px以内）
    if (angleDiff <= Math.PI / 3 && distance <= this.steamRange && depthDistance < 60) {
      const knockback = { x: direction * 150, y: 0 };
      player.takeDamage(this.steamDamage, knockback);
      
      // 蒸気エフェクト（将来の実装用）
      this.scene.events.emit('steamBlastEffect', {
        x: this.x,
        y: this.groundY,
        direction: direction
      });
    }
  }

  executeCharge(player, dt) {
    if (!this.isCharging) return;
    
    // 突進方向の決定
    const direction = player.x > this.chargeStartX ? 1 : -1;
    
    // 突進移動
    this.body.setVelocityX(direction * this.chargeSpeed);
    
    // 突進距離チェック（最大400px）
    const chargedDistance = Math.abs(this.x - this.chargeStartX);
    if (chargedDistance >= 400) {
      this.endCharge();
      return;
    }
    
    // プレイヤーとの衝突判定
    const distance = Math.abs(this.x - player.x);
    const depthAligned = Math.abs(this.groundY - player.groundY) < 50;
    
    if (distance <= 60 && depthAligned) {
      const knockback = { x: direction * 300, y: 0 };
      player.takeDamage(this.chargeDamage, knockback);
      this.endCharge();
      this.scene.hitStop(150);
    }
  }

  endCharge() {
    this.isCharging = false;
    this.body.setVelocityX(0);
    this.actionTimer = 500; // 硬直時間
  }

  executeApproach(player, dt) {
    // 通常の移動処理（Enemy.jsの実装を使用）
    this.moveTowardsPlayer(player);
    
    // 攻撃範囲に入ったら接近終了
    const distance = this.getDistanceToPlayer(player);
    if (distance <= this.CLOSE_RANGE) {
      this.currentAction = null;
      this.state = 'idle';
    }
  }

  endCurrentAction() {
    this.currentAction = null;
    this.state = 'idle';
    this.body.setVelocityX(0);
  }

  // Enemy.jsのtakeDamageをオーバーライド（武器弱点システム用）
  takeDamage(amount, knockback, weaponType = null) {
    // 武器弱点チェック
    let finalDamage = amount;
    if (weaponType && this.scene.WEAPON_DEFS[weaponType]?.bossWeakness) {
      finalDamage = Math.floor(amount * 1.5);
      
      // 弱点ヒット演出
      this.scene.events.emit('bossWeaknessHit', {
        x: this.x,
        y: this.groundY - 32
      });
    }
    
    super.takeDamage(finalDamage, knockback);
    
    // HP変更イベント
    this.scene.events.emit('bossHpChange', {
      current: this.hp,
      max: this.maxHp
    });
  }
}