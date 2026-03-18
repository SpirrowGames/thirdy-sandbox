/**
 * ボスフェーズ移行演出を管理するシステム
 * 1.5秒の演出シーケンス（停止→点滅→フラッシュ→BGM切替→再開）を実行
 */
export class PhaseTransitionSystem {
  constructor(scene) {
    this.scene = scene;
    this.isTransitioning = false;
  }

  /**
   * フェーズ2移行演出を開始
   * @param {Boss} boss - 演出対象のボス
   * @param {Function} onComplete - 演出完了時のコールバック
   */
  startPhase2Transition(boss, onComplete = () => {}) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    // 1. 全エンティティの更新を停止
    this.pauseAllEntities();
    
    // 演出シーケンスを実行
    this.executeTransitionSequence(boss, () => {
      this.isTransitioning = false;
      onComplete();
    });
  }

  /**
   * 全エンティティの更新を一時停止
   */
  pauseAllEntities() {
    // プレイヤーの更新停止
    if (this.scene.player) {
      this.scene.player.pauseUpdates = true;
    }

    // 敵グループの更新停止
    if (this.scene.enemies) {
      this.scene.enemies.children.entries.forEach(enemy => {
        enemy.pauseUpdates = true;
      });
    }

    // SpawnSystemの更新停止
    if (this.scene.spawnSystem) {
      this.scene.spawnSystem.pauseUpdates = true;
    }
  }

  /**
   * 全エンティティの更新を再開
   */
  resumeAllEntities() {
    // プレイヤーの更新再開
    if (this.scene.player) {
      this.scene.player.pauseUpdates = false;
    }

    // 敵グループの更新再開
    if (this.scene.enemies) {
      this.scene.enemies.children.entries.forEach(enemy => {
        enemy.pauseUpdates = false;
      });
    }

    // SpawnSystemの更新再開
    if (this.scene.spawnSystem) {
      this.scene.spawnSystem.pauseUpdates = false;
    }
  }

  /**
   * 演出シーケンスを実行
   * @param {Boss} boss - 演出対象のボス
   * @param {Function} onComplete - 完了コールバック
   */
  executeTransitionSequence(boss, onComplete) {
    const timeline = this.scene.tweens.createTimeline();

    // フェーズ1: 0.3秒待機
    timeline.add({
      targets: {},
      duration: 300,
      onComplete: () => {
        // 点滅演出開始
        this.startBossBlinkAnimation(boss);
      }
    });

    // フェーズ2: 0.8秒間ボス点滅
    timeline.add({
      targets: {},
      duration: 800,
      onComplete: () => {
        // 画面フラッシュ
        this.executeScreenFlash();
        // BGM切替
        this.switchToBossPhase2Music();
      }
    });

    // フェーズ3: 0.4秒でフラッシュ完了・再開準備
    timeline.add({
      targets: {},
      duration: 400,
      onComplete: () => {
        // 全エンティティ更新再開
        this.resumeAllEntities();
        // ボス点滅停止
        this.stopBossBlinkAnimation(boss);
        onComplete();
      }
    });

    timeline.play();
  }

  /**
   * ボス点滅アニメーション開始
   * @param {Boss} boss - 点滅対象のボス
   */
  startBossBlinkAnimation(boss) {
    if (!boss.sprite) return;

    // 4回点滅（0.2秒間隔）
    this.blinkTween = this.scene.tweens.add({
      targets: boss.sprite,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 7, // 4回点滅 = 8回のalpha変化
      ease: 'Power2'
    });
  }

  /**
   * ボス点滅アニメーション停止
   * @param {Boss} boss - 対象のボス
   */
  stopBossBlinkAnimation(boss) {
    if (this.blinkTween) {
      this.blinkTween.stop();
      this.blinkTween = null;
    }

    if (boss.sprite) {
      boss.sprite.setAlpha(1); // 透明度を完全に戻す
    }
  }

  /**
   * 画面フラッシュ演出
   */
  executeScreenFlash() {
    const camera = this.scene.cameras.main;
    
    // 白いフラッシュエフェクト
    camera.flash(200, 255, 255, 255, false, (camera, progress) => {
      if (progress === 1) {
        // フラッシュ完了時の処理
        this.scene.events.emit('phase2TransitionFlashComplete');
      }
    });
  }

  /**
   * フェーズ2用BGMに切替
   */
  switchToBossPhase2Music() {
    try {
      // 現在のBGMをフェードアウト
      if (this.scene.currentBgm && this.scene.currentBgm.isPlaying) {
        this.scene.tweens.add({
          targets: this.scene.currentBgm,
          volume: 0,
          duration: 300,
          onComplete: () => {
            this.scene.currentBgm.stop();
            // フェーズ2BGM開始
            this.playPhase2Music();
          }
        });
      } else {
        // BGMが再生されていない場合は直接フェーズ2BGMを開始
        this.playPhase2Music();
      }
    } catch (error) {
      console.warn('BGM切替でエラーが発生しました:', error);
      // エラーが発生してもゲームは継続
    }
  }

  /**
   * フェーズ2BGM再生
   */
  playPhase2Music() {
    try {
      // フェーズ2BGMが存在する場合のみ再生
      if (this.scene.cache.audio.exists('boss_phase2_bgm')) {
        this.scene.currentBgm = this.scene.sound.add('boss_phase2_bgm', {
          loop: true,
          volume: 0
        });
        
        this.scene.currentBgm.play();
        
        // フェードイン
        this.scene.tweens.add({
          targets: this.scene.currentBgm,
          volume: 0.7,
          duration: 500
        });
      }
    } catch (error) {
      console.warn('フェーズ2BGM再生でエラーが発生しました:', error);
    }
  }

  /**
   * 演出中かどうかを取得
   * @returns {boolean} 演出中の場合true
   */
  get isInTransition() {
    return this.isTransitioning;
  }

  /**
   * システムを破棄
   */
  destroy() {
    if (this.blinkTween) {
      this.blinkTween.stop();
      this.blinkTween = null;
    }
    this.isTransitioning = false;
  }
}