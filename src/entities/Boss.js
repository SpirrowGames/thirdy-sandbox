import { Enemy } from './Enemy.js';
import { WEAPON_DEFS } from '../data/weapons.js';

export class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // ボス基本ステータス
    this.maxHp = 200;
    this.hp = 200;
    this.speed = 60;
    this.attackRange = 120;
    this.attackDamage = 20;
    this.attackCooldown = 2000; // ms
    
    // フェーズ管理
    this.phase = 1;
    this.phaseTransitioning = false;
    this.phaseTransitionTimer = 0;
    this.PHASE_TRANSITION_DURATION = 1500; // ms
    
    // フェーズ2専用攻撃のクールダウン
    this.steamBlastCooldown = 0;
    this.STEAM_BLAST_COOLDOWN = 3000; // ms
    this.rushCooldown = 0;
    this.RUSH_COOLDOWN = 4000; // ms
    
    // ボス専用プロパティ
    this.isInvulnerable = false;
    this.lastAttackTime = 0;
    
    // スプライト設定（開発初期は矩形）
    this.sprite.setTint(0x800080); // 紫色でボスを識別
    this.sprite.setScale(1.5, 1.5); // 通常敵より大きく
    
    // 物理ボディサイズ調整
    this.sprite.body.setSize(64, 80);
  }

  update(time, delta) {
    if (!this.alive) return;
    
    // フェーズ遷移処理
    this.updatePhaseTransition(time, delta);
    if (this.phaseTransitioning) return;
    
    // フェーズチェック
    this.checkPhaseTransition();
    
    // クールダウン更新
    this.updateCooldowns(delta);
    
    // 基本AI処理
    super.update(time, delta);
  }

  checkPhaseTransition() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5 && !this.phaseTransitioning) {
      this.startPhaseTransition();
    }
  }

  startPhaseTransition() {
    this.phaseTransitioning = true;
    this.phaseTransitionTimer = 0;
    this.isInvulnerable = true;
    this.state = 'hurt'; // 一時的に行動停止
    
    // フェーズ遷移演出
    this.scene.cameras.main.flash(200, 255, 255, 255, false);
    
    // 点滅演出
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.3 },
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Power2'
    });
    
    // フェーズ遷移完了タイマー
    this.scene.time.delayedCall(this.PHASE_TRANSITION_DURATION, () => {
      this.completePhaseTransition();
    });
  }

  completePhaseTransition() {
    this.phase = 2;
    this.phaseTransitioning = false;
    this.isInvulnerable = false;
    this.state = 'idle';
    this.sprite.setAlpha(1);
    
    // フェーズ2開始演出
    this.scene.cameras.main.shake(300, 0.02);
    
    // HPが少し回復（オプション）
    // this.hp = Math.min(this.maxHp, this.hp + 30);
  }

  updatePhaseTransition(time, delta) {
    if (this.phaseTransitioning) {
      this.phaseTransitionTimer += delta;
    }
  }

  updateCooldowns(delta) {
    if (this.steamBlastCooldown > 0) {
      this.steamBlastCooldown -= delta;
    }
    if (this.rushCooldown > 0) {
      this.rushCooldown -= delta;
    }
  }

  selectAction(player) {
    if (this.state !== 'idle' && this.state !== 'walk') return;
    
    const distance = Math.abs(this.sprite.x - player.sprite.x);
    const depthAligned = Math.abs(this.groundY - player.groundY) < 60;
    
    if (this.phase === 1) {
      this.selectPhase1Action(player, distance, depthAligned);
    } else {
      this.selectPhase2Action(player, distance, depthAligned);
    }
  }

  selectPhase1Action(player, distance, depthAligned) {
    if (distance < this.attackRange && depthAligned && this.canAttack()) {
      this.performBasicAttack();
    } else {
      this.moveTowardsPlayer(player);
    }
  }

  selectPhase2Action(player, distance, depthAligned) {
    // フェーズ2では追加攻撃が使用可能
    if (distance < this.attackRange && depthAligned && this.canAttack()) {
      this.performBasicAttack();
    } else if (distance >= 120 && distance <= 300 && this.steamBlastCooldown <= 0) {
      this.performSteamBlast();
    } else if (distance > 300 && this.rushCooldown <= 0) {
      this.performRush(player);
    } else {
      this.moveTowardsPlayer(player);
    }
  }

  performBasicAttack() {
    this.state = 'attack';
    this.lastAttackTime = Date.now();
    
    // 攻撃アニメーション（将来的にスプライトアニメーション）
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: 1.5, to: 1.8 },
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });
    
    // 攻撃判定生成
    this.scene.time.delayedCall(200, () => {
      this.createAttackHitbox(this.attackDamage, this.attackRange, 100);
    });
    
    // 攻撃終了
    this.scene.time.delayedCall(600, () => {
      if (this.alive) this.state = 'idle';
    });
  }

  performSteamBlast() {
    this.state = 'special';
    this.steamBlastCooldown = this.STEAM_BLAST_COOLDOWN;
    
    // 蒸気噴射演出
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 1.5, to: 2.0 },
      duration: 300,
      yoyo: true,
      ease: 'Power2'
    });
    
    // 蒸気噴射攻撃判定（扇形）
    this.scene.time.delayedCall(300, () => {
      this.createSteamBlastHitbox();
    });
    
    // 攻撃終了
    this.scene.time.delayedCall(800, () => {
      if (this.alive) this.state = 'idle';
    });
  }

  performRush(player) {
    this.state = 'rush';
    this.rushCooldown = this.RUSH_COOLDOWN;
    
    // 突進方向を計算
    const direction = player.sprite.x > this.sprite.x ? 1 : -1;
    this.facingRight = direction > 0;
    
    // 突進移動
    this.sprite.body.setVelocityX(direction * 400);
    
    // 突進攻撃判定
    this.createRushHitbox();
    
    // 突進終了
    this.scene.time.delayedCall(600, () => {
      this.sprite.body.setVelocityX(0);
      if (this.alive) this.state = 'idle';
    });
  }

  createSteamBlastHitbox() {
    const range = 250;
    const angle = Math.PI / 3; // 120度
    const direction = this.facingRight ? 1 : -1;
    
    // 簡易的な扇形判定（複数の矩形で近似）
    for (let i = 0; i < 5; i++) {
      const offsetAngle = (i - 2) * (angle / 4);
      const offsetX = Math.cos(offsetAngle) * range * 0.5 * direction;
      const offsetY = Math.sin(offsetAngle) * range * 0.3;
      
      this.scene.time.delayedCall(i * 50, () => {
        this.createAttackHitbox(15, range * 0.8, 150, offsetX, offsetY);
      });
    }
  }

  createRushHitbox() {
    // 突進中の連続判定
    const hitboxInterval = this.scene.time.addEvent({
      delay: 100,
      repeat: 5,
      callback: () => {
        if (this.state === 'rush' && this.alive) {
          this.createAttackHitbox(12, 80, 100);
        }
      }
    });
  }

  takeDamage(amount, weaponType = null, sourceX = 0) {
    if (this.isInvulnerable || this.phaseTransitioning) return false;
    
    // 武器弱点システム
    let finalDamage = amount;
    if (weaponType && WEAPON_DEFS[weaponType]?.bossWeakness) {
      finalDamage = Math.floor(amount * 1.5);
      // 弱点ヒット演出
      this.sprite.setTint(0xffff00); // 黄色フラッシュ
      this.scene.time.delayedCall(100, () => {
        this.sprite.setTint(0x800080); // 元の色に戻す
      });
    }
    
    const wasAlive = this.hp > 0;
    this.hp = Math.max(0, this.hp - finalDamage);
    
    // HPバー更新イベント
    this.scene.events.emit('bossHpChange', { 
      current: this.hp, 
      max: this.maxHp 
    });
    
    if (this.hp <= 0 && wasAlive) {
      this.die();
      return true;
    }
    
    // ノックバック（ボスは軽微）
    if (sourceX !== 0 && this.state !== 'rush') {
      const direction = this.sprite.x > sourceX ? 1 : -1;
      this.sprite.body.setVelocityX(direction * 100);
      this.scene.time.delayedCall(200, () => {
        if (this.alive) this.sprite.body.setVelocityX(0);
      });
    }
    
    return false;
  }

  die() {
    super.die();
    
    // ボス撃破演出
    this.scene.cameras.main.shake(500, 0.03);
    this.scene.cameras.main.flash(300, 255, 255, 255, false);
    
    // 爆発演出（簡易）
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        // パーティクル効果をここに追加（将来拡張）
      });
    }
    
    // ステージクリア処理
    this.scene.time.delayedCall(1000, () => {
      this.scene.onStageClear();
    });
  }

  canAttack() {
    return Date.now() - this.lastAttackTime > this.attackCooldown;
  }

  // デバッグ用メソッド
  getDebugInfo() {
    return {
      ...super.getDebugInfo(),
      phase: this.phase,
      phaseTransitioning: this.phaseTransitioning,
      steamBlastCooldown: this.steamBlastCooldown,
      rushCooldown: this.rushCooldown
    };
  }
}