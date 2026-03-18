import { GameScene } from '../../src/scenes/GameScene.js';

describe('GameScene - カメラスクロール制御', () => {
  let scene;
  let mockCamera;
  let mockPlayer;

  beforeEach(() => {
    // Phaserのモック設定
    mockCamera = {
      setBounds: jest.fn(),
      startFollow: jest.fn(),
      stopFollow: jest.fn(),
      setScroll: jest.fn(),
      setLerp: jest.fn(),
      scrollX: 500
    };

    mockPlayer = {
      sprite: {
        x: 200,
        y: 440
      }
    };

    // GameSceneのモック設定
    scene = new GameScene();
    scene.cameras = { main: mockCamera };
    scene.add = {
      rectangle: jest.fn().mockReturnValue(mockPlayer.sprite)
    };
    scene.physics = {
      add: {
        existing: jest.fn()
      }
    };
    scene.events = {
      emit: jest.fn()
    };
    scene.player = mockPlayer;

    // 初期状態を設定
    scene.scrollLocked = false;
    scene.lockedScrollX = 0;
  });

  describe('lockScroll()', () => {
    test('初回ロック時に正常に動作する', () => {
      // カメラの現在位置を設定
      mockCamera.scrollX = 750;

      scene.lockScroll();

      expect(scene.scrollLocked).toBe(true);
      expect(scene.lockedScrollX).toBe(750);
      expect(mockCamera.stopFollow).toHaveBeenCalled();
      expect(mockCamera.setScroll).toHaveBeenCalledWith(750, 0);
      expect(scene.events.emit).toHaveBeenCalledWith('scrollLocked', { scrollX: 750 });
    });

    test('既にロック済みの場合は何もしない', () => {
      // 事前にロック状態にする
      scene.scrollLocked = true;
      scene.lockedScrollX = 600;

      scene.lockScroll();

      // 状態が変更されないことを確認
      expect(scene.lockedScrollX).toBe(600);
      expect(mockCamera.stopFollow).not.toHaveBeenCalled();
      expect(scene.events.emit).not.toHaveBeenCalled();
    });

    test('ゼロ位置でのロックも正常に動作する', () => {
      mockCamera.scrollX = 0;

      scene.lockScroll();

      expect(scene.scrollLocked).toBe(true);
      expect(scene.lockedScrollX).toBe(0);
      expect(mockCamera.setScroll).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('unlockScroll()', () => {
    test('ロック状態からのアンロックが正常に動作する', () => {
      // 事前にロック状態にする
      scene.scrollLocked = true;
      scene.lockedScrollX = 800;

      scene.unlockScroll();

      expect(scene.scrollLocked).toBe(false);
      expect(scene.lockedScrollX).toBe(0);
      expect(mockCamera.startFollow).toHaveBeenCalledWith(mockPlayer.sprite, true, 0.1, 0);
      expect(mockCamera.setLerp).toHaveBeenCalledWith(0.1, 0);
      expect(scene.events.emit).toHaveBeenCalledWith('scrollUnlocked');
    });

    test('既にアンロック済みの場合は何もしない', () => {
      // 初期状態（アンロック済み）
      scene.scrollLocked = false;

      scene.unlockScroll();

      expect(mockCamera.startFollow).not.toHaveBeenCalled();
      expect(scene.events.emit).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    test('スクロールロック中はカメラ位置が固定される', () => {
      scene.scrollLocked = true;
      scene.lockedScrollX = 1000;

      scene.update(16, 16);

      expect(mockCamera.setScroll).toHaveBeenCalledWith(1000, 0);
    });

    test('スクロールアンロック中はカメラ位置を固定しない', () => {
      scene.scrollLocked = false;

      scene.update(16, 16);

      expect(mockCamera.setScroll).not.toHaveBeenCalled();
    });
  });

  describe('isScrollLocked()', () => {
    test('ロック状態を正しく返す', () => {
      scene.scrollLocked = true;
      expect(scene.isScrollLocked()).toBe(true);

      scene.scrollLocked = false;
      expect(scene.isScrollLocked()).toBe(false);
    });
  });

  describe('getLockedScrollX()', () => {
    test('ロック中は固定位置を返す', () => {
      scene.scrollLocked = true;
      scene.lockedScrollX = 1200;

      expect(scene.getLockedScrollX()).toBe(1200);
    });

    test('アンロック中は0を返す', () => {
      scene.scrollLocked = false;
      scene.lockedScrollX = 1200; // 内部値は残っていても

      expect(scene.getLockedScrollX()).toBe(0);
    });
  });

  describe('onWaveStart() / onWaveClear()', () => {
    test('onWaveStart()でスクロールがロックされる', () => {
      mockCamera.scrollX = 600;

      scene.onWaveStart();

      expect(scene.scrollLocked).toBe(true);
      expect(scene.lockedScrollX).toBe(600);
    });

    test('onWaveClear()でスクロールがアンロックされる', () => {
      scene.scrollLocked = true;
      scene.lockedScrollX = 600;

      scene.onWaveClear();

      expect(scene.scrollLocked).toBe(false);
      expect(scene.lockedScrollX).toBe(0);
    });
  });

  describe('ロック・アンロックのシーケンステスト', () => {
    test('複数回のロック・アンロックが正常に動作する', () => {
      // 1回目のロック
      mockCamera.scrollX = 400;
      scene.lockScroll();
      expect(scene.isScrollLocked()).toBe(true);
      expect(scene.getLockedScrollX()).toBe(400);

      // アンロック
      scene.unlockScroll();
      expect(scene.isScrollLocked()).toBe(false);

      // 2回目のロック（異なる位置）
      mockCamera.scrollX = 800;
      scene.lockScroll();
      expect(scene.isScrollLocked()).toBe(true);
      expect(scene.getLockedScrollX()).toBe(800);
    });

    test('update()がロック状態に応じて正しく動作する', () => {
      // ロック前
      scene.update(16, 16);
      expect(mockCamera.setScroll).not.toHaveBeenCalled();

      // ロック
      mockCamera.scrollX = 500;
      scene.lockScroll();
      
      // ロック中のupdate
      scene.update(16, 16);
      expect(mockCamera.setScroll).toHaveBeenCalledWith(500, 0);

      // アンロック
      scene.unlockScroll();
      mockCamera.setScroll.mockClear();

      // アンロック後のupdate
      scene.update(16, 16);
      expect(mockCamera.setScroll).not.toHaveBeenCalled();
    });
  });
});