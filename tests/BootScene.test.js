import { BootScene } from '../src/scenes/BootScene.js';

/**
 * BootScene のユニットテスト
 */
describe('BootScene', () => {
  let scene;
  let mockPhaser;

  beforeEach(() => {
    // Phaserのモック作成
    mockPhaser = {
      Scene: class {
        constructor(config) {
          this.key = config.key;
        }
      },
      add: {
        rectangle: jest.fn().mockReturnValue({ setOrigin: jest.fn() }),
        text: jest.fn().mockReturnValue({ setOrigin: jest.fn() })
      },
      load: {
        image: jest.fn(),
        audio: jest.fn(),
        on: jest.fn()
      },
      time: {
        delayedCall: jest.fn()
      },
      scene: {
        start: jest.fn()
      }
    };

    // BootScene インスタンス作成
    scene = new BootScene();
    
    // モックメソッドを注入
    Object.assign(scene, mockPhaser);
  });

  describe('constructor', () => {
    test('正しいキーでシーンが作成される', () => {
      expect(scene.key).toBe('BootScene');
    });
  });

  describe('preload', () => {
    test('必須アセットが正しく読み込まれる', () => {
      scene.createLoadingUI = jest.fn();
      scene.loadGameAssets = jest.fn();
      scene.setupLoadingProgress = jest.fn();

      scene.preload();

      expect(scene.load.image).toHaveBeenCalledWith('white-pixel', expect.any(String));
      expect(scene.load.audio).toHaveBeenCalledWith('hit-sound', expect.any(Array));
      expect(scene.load.audio).toHaveBeenCalledWith('bgm', expect.any(Array));
    });

    test('UI作成メソッドが呼ばれる', () => {
      scene.createLoadingUI = jest.fn();
      scene.loadGameAssets = jest.fn();
      scene.setupLoadingProgress = jest.fn();

      scene.preload();

      expect(scene.createLoadingUI).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    test('初期化後にシーン遷移が実行される', () => {
      scene.initializeGameData = jest.fn();

      scene.create();

      expect(scene.initializeGameData).toHaveBeenCalled();
      expect(scene.time.delayedCall).toHaveBeenCalledWith(500, expect.any(Function));
    });
  });

  describe('createLoadingUI', () => {
    test('ロード画面の要素が正しく作成される', () => {
      scene.createLoadingUI();

      // 背景矩形の作成確認
      expect(scene.add.rectangle).toHaveBeenCalledWith(480, 270, 960, 540, 0x1a1a1a);
      
      // タイトルテキストの作成確認
      expect(scene.add.text).toHaveBeenCalledWith(
        480, 170, 'STEAM FIGHTER', 
        expect.objectContaining({
          fontSize: '48px',
          color: '#ffffff'
        })
      );
    });
  });

  describe('loadEssentialAssets', () => {
    test('MVP用の必須アセットが読み込まれる', () => {
      scene.loadEssentialAssets();

      expect(scene.load.image).toHaveBeenCalledWith('white-pixel', expect.stringContaining('data:image/png'));
      expect(scene.load.audio).toHaveBeenCalledWith('hit-sound', expect.any(Array));
      expect(scene.load.audio).toHaveBeenCalledWith('bgm', expect.any(Array));
    });
  });

  describe('setupLoadingProgress', () => {
    test('ロード進捗イベントが正しく設定される', () => {
      scene.setupLoadingProgress();

      expect(scene.load.on).toHaveBeenCalledWith('progress', expect.any(Function));
      expect(scene.load.on).toHaveBeenCalledWith('fileprogress', expect.any(Function));
      expect(scene.load.on).toHaveBeenCalledWith('complete', expect.any(Function));
      expect(scene.load.on).toHaveBeenCalledWith('loaderror', expect.any(Function));
    });
  });

  describe('initializeGameData', () => {
    test('初期化処理が正常に実行される', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      scene.initializeGameData();

      expect(consoleSpy).toHaveBeenCalledWith('Game data initialized');
      
      consoleSpy.mockRestore();
    });
  });
});