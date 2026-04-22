import Phaser from 'phaser';
import { DROP_CONFIG, XP_CONFIG } from '../constants';
import { Player } from './Player';

export class HealthGem extends Phaser.Physics.Arcade.Sprite {
  isCollected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'health-gem');

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

        player.heal(DROP_CONFIG.HEALTH_GEM.HEAL_AMOUNT);
        this.scene.events.emit('health-collected');
        this.recycle();
      },
    });
  }

  recycle(): void {
    this.isCollected = false;
    this.setActive(false);
    this.setVisible(false);
    const body = this.body;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }
  }

  spawn(x: number, y: number): void {
    this.isCollected = false;
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

  static fromScene(scene: Phaser.Scene, x: number, y: number): HealthGem {
    return new HealthGem(scene, x, y);
  }
}
