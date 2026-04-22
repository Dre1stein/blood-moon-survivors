import Phaser from 'phaser';
import { ENEMY_CONFIG, WORLD } from '../constants';

const _tempVec = new Phaser.Math.Vector2();

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  speed: number = Number(ENEMY_CONFIG.SPEED);
  baseSpeed: number = Number(ENEMY_CONFIG.SPEED);
  hp: number = 1;
  isAlive = true;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
  }

  update(playerX: number, playerY: number): void {
    const body = this.body;

    if (!this.isAlive || !(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    const direction = _tempVec.set(playerX - this.x, playerY - this.y);

    if (direction.lengthSq() > 0) {
      direction.normalize().scale(this.speed);
      body.setVelocity(direction.x, direction.y);
    } else {
      body.setVelocity(0, 0);
    }

    this.clampToWorld();
  }

  kill(): void {
    const body = this.body;

    if (!this.isAlive) {
      return;
    }

    this.isAlive = false;
    this.hp = 0;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    this.setTint(0xff4444);
    this.scene.events.emit('enemy-killed', { x: this.x, y: this.y, scoreValue: ENEMY_CONFIG.SCORE_VALUE });
    this.scene.events.emit('enemy-drop-xp', { x: this.x, y: this.y, value: ENEMY_CONFIG.XP_VALUE });
    this.scene.time.delayedCall(50, () => {
      if (this.active && this.scene) {
        this.destroy();
      }
    });
  }

  static fromScene(scene: Phaser.Scene, x: number, y: number): Enemy {
    return new Enemy(scene, x, y, 'enemy');
  }

  takeDamage(amount: number): void {
    if (!this.isAlive || amount <= 0) {
      return;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.scene.events.emit('damage-dealt', amount);

    if (this.hp <= 0) {
      this.kill();
    }
  }

  private clampToWorld(): void {
    const halfWidth = this.displayWidth * 0.5;
    const halfHeight = this.displayHeight * 0.5;

    this.x = Phaser.Math.Clamp(this.x, halfWidth, WORLD.WIDTH - halfWidth);
    this.y = Phaser.Math.Clamp(this.y, halfHeight, WORLD.HEIGHT - halfHeight);
  }
}
