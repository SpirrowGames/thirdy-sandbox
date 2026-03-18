export class WeaponPickupSystem {
  constructor(scene) {
    this.scene = scene;
    this.weaponGroup = scene.physics.add.group();
    this.setupCollisions();
  }

  setupCollisions() {
    // プレイヤーと武器の衝突判定
    this.scene.physics.add.overlap(
      this.scene.player.hitbox,
      this.weaponGroup,
      this.handlePickup.bind(this),
      null,
      this.scene
    );
  }

  handlePickup(playerHitbox, weaponSprite) {
    const player = this.scene.player;
    const weapon = weaponSprite.weaponData;

    // 奥行き判定
    if (!this.isDepthAligned(player, weapon)) {
      return;
    }

    // 既に武器を持っている場合は交換
    if (player.heldWeapon) {
      this.dropWeapon(player, player.x, player.groundY);
    }

    // 武器を拾得
    player.pickupWeapon(weapon);
    
    // 武器オブジェクトを削除
    weaponSprite.destroy();

    // UIに通知
    this.scene.events.emit('weaponChange', {
      name: weapon.name,
      durability: weapon.durability,
      max: weapon.maxDurability
    });

    // SE再生
    this.scene.sound.play('pickup_weapon', { volume: 0.3 });
  }

  isDepthAligned(player, weapon) {
    const DEPTH_THRESHOLD = 40;
    return Math.abs(player.groundY - weapon.groundY) < DEPTH_THRESHOLD;
  }

  spawnWeapon(type, x, groundY) {
    const weapon = new Weapon(type);
    weapon.groundY = groundY;

    // 見た目のスプライト作成
    const sprite = this.scene.add.rectangle(x, groundY - 10, 32, 16, 0xffaa00);
    sprite.setStroke(2, 0xff6600);
    
    // 物理ボディ追加
    this.scene.physics.add.existing(sprite);
    sprite.body.setSize(32, 16);
    sprite.body.setImmovable(true);

    // 武器データを関連付け
    sprite.weaponData = weapon;

    // グループに追加
    this.weaponGroup.add(sprite);

    // 光るエフェクト
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    return sprite;
  }

  dropWeapon(player, x, groundY) {
    if (!player.heldWeapon) return;

    // 武器を地面に落とす
    const droppedSprite = this.spawnWeapon(player.heldWeapon.type, x, groundY);
    
    // 落とした武器の耐久度を引き継ぎ
    droppedSprite.weaponData.durability = player.heldWeapon.durability;

    // プレイヤーから武器を削除
    player.dropWeapon();

    // UIに通知
    this.scene.events.emit('weaponChange', { weapon: null });
  }

  // 武器破壊時の処理
  onWeaponBroken(player) {
    // 破壊エフェクト
    this.scene.add.particles(player.x, player.groundY - 20, 'spark', {
      speed: { min: 50, max: 100 },
      lifespan: 300,
      quantity: 8,
      tint: 0xff4444
    });

    // SE再生
    this.scene.sound.play('weapon_break', { volume: 0.4 });

    // UIに通知
    this.scene.events.emit('weaponChange', { weapon: null });
  }

  update() {
    // 武器グループの更新処理（必要に応じて）
    this.weaponGroup.children.entries.forEach(weaponSprite => {
      // 画面外チェックなど
      if (weaponSprite.x < this.scene.cameras.main.scrollX - 100) {
        weaponSprite.destroy();
      }
    });
  }
}