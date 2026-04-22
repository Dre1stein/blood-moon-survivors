import Phaser from 'phaser';
import { XP_CONFIG } from '../constants';
import { Player } from './Player';

export class XPGem extends Phaser.Physics.Arcade.Sprite {
  xpValue: number;
  isCollected = false;
  targetPlayer?: Player;

  constructor(scene: Phaser.Scene, x: number, y: number, xpValue: number) {
    super(scene, x, y, 'xp-gem');

    this.xpValue = xpValue;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
  }

  collect(player: Player): void {
    const body = this.body;

    if (this.isCollected || !this.active) {
      return;
    }

    this.isCollected = true;
    this.targetPlayer = player;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    this.scene.tweens.add({
      targets: this,
      x: player.x,
      y: player.y,
      duration: Math.max(200, Math.round((Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) / XP_CONFIG.PICKUP_SPEED) * 1000)),
      ease: Phaser.Math.Easing.Quadratic.In,
      onComplete: () => {
        if (!this.scene || !this.active) {
          return;
        }

        this.scene.events.emit('xp-collected', this.xpValue);
        this.recycle();
      },
    });
  }

  recycle(): void {
    this.isCollected = false;
    this.targetPlayer = undefined;
    this.setActive(false);
    this.setVisible(false);
    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }
  }

  spawn(x: number, y: number, value: number): void {
    this.xpValue = value;
    this.isCollected = false;
    this.targetPlayer = undefined;
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.enable = true;
      body.setVelocity(0, 0);
    }
  }

  static fromScene(scene: Phaser.Scene, x: number, y: number, xpValue: number): XPGem {
    return new XPGem(scene, x, y, xpValue);
  }
}
