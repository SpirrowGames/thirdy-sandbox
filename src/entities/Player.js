export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.groundY = y;
    
    // 基本ステータス
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 200;
    this.alive = true;
    
    // 仮のスプライト（矩形）
    this.sprite = scene.add.rectangle(x, y, 48, 64, 0x3498db);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(48, 64);
    
    console.log(`プレイヤー初期化: (${x}, ${y})`);
  }

  update(time, delta) {
    if (!this.alive) return;
    
    // 基本的な移動処理（詳細実装は後のタスクで）
    this.handleMovement();
    
    // 位置の更新
    this.x = this.sprite.x;
    this.y = this.sprite.y;
  }

  handleMovement() {
    const cursors = this.scene.cursors;
    const speed = this.speed;
    
    // X軸移動
    if (cursors.left.isDown) {
      this.sprite.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
      this.sprite.body.setVelocityX(speed);
    } else {
      this.sprite.body.setVelocityX(0);
    }
    
    // Y軸移動（奥行き）
    if (cursors.up.isDown) {
      this.sprite.body.setVelocityY(-speed * 0.5);
    } else if (cursors.down.isDown) {
      this.sprite.body.setVelocityY(speed * 0.5);
    } else {
      this.sprite.body.setVelocityY(0);
    }
    
    // Y座標の制限
    this.groundY = Phaser.Math.Clamp(
      this.sprite.y,
      this.scene.GROUND_Y_MIN,
      this.scene.GROUND_Y_MAX
    );
    this.sprite.y = this.groundY;
  }

  pickupWeapon(weaponData) {
    console.log(`武器拾得: ${weaponData.name}`);
    // 武器処理の詳細実装は後のタスクで
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    
    // UIに通知
    this.scene.events.emit('playerHpChange', {
      current: this.hp,
      max: this.maxHp
    });
    
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    console.log('プレイヤー死亡');
    // 死亡処理の詳細実装は後のタスクで
  }
}