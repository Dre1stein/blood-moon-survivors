import type Phaser from 'phaser';
import type { Player } from '../entities/Player';

export abstract class Weapon {
  readonly name: string;
  level = 1;
  cooldownTimer = 0;

  protected constructor(name: string) {
    this.name = name;
  }

  abstract getCooldown(): number;

  get isReady(): boolean {
    return this.cooldownTimer <= 0;
  }

  update(delta: number, _scene?: Phaser.Scene, _player?: Player, _enemies?: Phaser.Physics.Arcade.Group): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
    }
  }

  resetCooldown(cooldownMultiplier = 1): void {
    this.cooldownTimer = this.getCooldown() * cooldownMultiplier;
  }

  abstract fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void;

  upgrade(): void {
    this.level += 1;
  }

  destroy(): void {}
}
