import Phaser from 'phaser';
import { BOSS_CONFIG } from '../constants';
import { Enemy } from './Enemy';

export class Boss extends Enemy {
  readonly bossIndex: number;
  readonly bossName: string;
  readonly damage: number;
  readonly scoreValue: number;
  readonly xpValue: number;

  constructor(scene: Phaser.Scene, x: number, y: number, bossIndex: number) {
    super(scene, x, y, 'boss');

    const config = BOSS_CONFIG.TYPES[bossIndex];
    this.bossIndex = bossIndex;
    this.bossName = config.name;
    this.damage = config.damage;
    this.scoreValue = config.score;
    this.xpValue = config.xp;
    this.baseSpeed = config.speed;
    this.speed = config.speed;
    this.hp = config.hp;

    this.setDisplaySize(config.size, config.size);
    this.setTint(config.color);

    scene.tweens.add({
      targets: this,
      alpha: 0.65,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut,
    });
  }

  override kill(): void {
    const body = this.body;

    if (!this.isAlive || this.hp > 0) {
      return;
    }

    this.isAlive = false;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    this.scene.events.emit('boss-killed', {
      x: this.x,
      y: this.y,
      scoreValue: this.scoreValue,
      xpValue: this.xpValue,
      bossName: this.bossName,
    });
    this.scene.events.emit('enemy-drop-xp', { x: this.x, y: this.y, value: this.xpValue });
    this.scene.time.delayedCall(150, () => {
      if (this.active && this.scene) {
        this.destroy();
      }
    });
  }

  override takeDamage(amount: number): void {
    if (!this.isAlive || amount <= 0) {
      return;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active && this.isAlive) {
        this.setTint(BOSS_CONFIG.TYPES[this.bossIndex].color);
      }
    });

    if (this.hp <= 0) {
      this.kill();
    }
  }

  static fromScene(scene: Phaser.Scene, x: number, y: number, bossIndex = 0): Boss {
    return new Boss(scene, x, y, bossIndex);
  }
}
