/**
 * BGMとSEを管理するオーディオシステム
 * フェードイン/アウト、クロスフェード機能を提供
 */
export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.currentBGM = null;
    this.bgmVolume = 0.7;
    this.seVolume = 0.8;
    this.sounds = new Map(); // サウンドインスタンスのキャッシュ
  }

  /**
   * BGMを再生（フェードイン付き）
   * @param {string} key - サウンドキー
   * @param {number} volume - 音量（0.0-1.0）
   * @param {number} fadeTime - フェード時間（ms）
   * @param {boolean} loop - ループ再生
   */
  playBGM(key, volume = this.bgmVolume, fadeTime = 1000, loop = true) {
    return new Promise((resolve) => {
      try {
        // 既存BGMをフェードアウト
        if (this.currentBGM && this.currentBGM.isPlaying) {
          this.fadeOut(this.currentBGM, fadeTime / 2).then(() => {
            this.currentBGM.stop();
            this.startNewBGM(key, volume, fadeTime, loop, resolve);
          });
        } else {
          this.startNewBGM(key, volume, fadeTime, loop, resolve);
        }
      } catch (error) {
        console.error('BGM play error:', error);
        resolve();
      }
    });
  }

  /**
   * 新しいBGMを開始
   */
  startNewBGM(key, volume, fadeTime, loop, resolve) {
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`Audio key "${key}" not found`);
      resolve();
      return;
    }

    const bgm = this.scene.sound.add(key, { 
      volume: 0, 
      loop: loop 
    });
    
    bgm.play();
    this.currentBGM = bgm;
    this.sounds.set(key, bgm);

    // フェードイン
    this.scene.tweens.add({
      targets: bgm,
      volume: volume,
      duration: fadeTime,
      ease: 'Power1.easeIn',
      onComplete: () => resolve(),
      onCompleteScope: this
    });
  }

  /**
   * BGMクロスフェード
   * @param {string} newKey - 新しいBGMキー
   * @param {number} fadeTime - フェード時間（ms）
   */
  crossfade(newKey, fadeTime = 2000) {
    return new Promise((resolve) => {
      const oldBGM = this.currentBGM;
      const halfTime = fadeTime / 2;

      // 新しいBGMを開始（音量0から）
      this.startNewBGM(newKey, 0, 0, true, () => {
        // 同時にフェード処理
        Promise.all([
          oldBGM ? this.fadeOut(oldBGM, halfTime) : Promise.resolve(),
          this.fadeIn(this.currentBGM, this.bgmVolume, halfTime)
        ]).then(() => {
          if (oldBGM) {
            oldBGM.stop();
          }
          resolve();
        });
      });
    });
  }

  /**
   * フェードアウト
   */
  fadeOut(sound, duration) {
    return new Promise((resolve) => {
      if (!sound || !sound.isPlaying) {
        resolve();
        return;
      }

      this.scene.tweens.add({
        targets: sound,
        volume: 0,
        duration: duration,
        ease: 'Power1.easeOut',
        onComplete: resolve,
        onCompleteScope: this
      });
    });
  }

  /**
   * フェードイン
   */
  fadeIn(sound, targetVolume, duration) {
    return new Promise((resolve) => {
      if (!sound) {
        resolve();
        return;
      }

      sound.volume = 0;
      this.scene.tweens.add({
        targets: sound,
        volume: targetVolume,
        duration: duration,
        ease: 'Power1.easeIn',
        onComplete: resolve,
        onCompleteScope: this
      });
    });
  }

  /**
   * SE再生
   * @param {string} key - サウンドキー
   * @param {number} volume - 音量
   */
  playSE(key, volume = this.seVolume) {
    try {
      if (!this.scene.cache.audio.exists(key)) {
        console.warn(`SE key "${key}" not found`);
        return null;
      }

      return this.scene.sound.play(key, { volume });
    } catch (error) {
      console.error('SE play error:', error);
      return null;
    }
  }

  /**
   * 全サウンド停止
   */
  stopAll() {
    this.scene.sound.stopAll();
    this.currentBGM = null;
    this.sounds.clear();
  }

  /**
   * リソース解放
   */
  destroy() {
    this.stopAll();
  }
}