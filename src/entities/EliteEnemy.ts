import Phaser from 'phaser';
import { ELITE_CONFIG } from '../constants';
import { Enemy } from './Enemy';

export class EliteEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.baseSpeed = ELITE_CONFIG.SPEED;
    this.speed = ELITE_CONFIG.SPEED;
    this.hp = ELITE_CONFIG.HP;
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

    this.setTint(0xffffff);
    this.scene.events.emit('elite-killed', { x: this.x, y: this.y, scoreValue: ELITE_CONFIG.SCORE_VALUE });
    this.scene.events.emit('enemy-drop-xp', { x: this.x, y: this.y, value: ELITE_CONFIG.XP_VALUE });
    this.scene.time.delayedCall(100, () => {
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
        this.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.kill();
    }
  }

  static fromScene(scene: Phaser.Scene, x: number, y: number): EliteEnemy {
    return new EliteEnemy(scene, x, y, 'elite-enemy');
  }
}
