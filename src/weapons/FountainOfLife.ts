import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

export class FountainOfLife extends Weapon {
  private baseDamage = WEAPON_CONFIG.FOUNTAIN_OF_LIFE.DAMAGE;
  private radius = WEAPON_CONFIG.FOUNTAIN_OF_LIFE.RADIUS;

  constructor() {
    super('FountainOfLife');
  }

  getCooldown(): number {
    return Math.max(350, WEAPON_CONFIG.FOUNTAIN_OF_LIFE.COOLDOWN - (this.level - 1) * 100);
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    const radiusSq = this.radius * this.radius;

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive) {
        return true;
      }

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;

      if (dx * dx + dy * dy <= radiusSq) {
        enemy.takeDamage(player.calculateDamage(this.baseDamage, 'melee'));
      }

      return true;
    });

    player.heal(2 + this.level);

    const pulse = scene.add.circle(player.x, player.y, this.radius, WEAPON_CONFIG.FOUNTAIN_OF_LIFE.COLOR, 0);
    pulse.setStrokeStyle(3, WEAPON_CONFIG.FOUNTAIN_OF_LIFE.COLOR, 0.9);
    scene.tweens.add({
      targets: pulse,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: WEAPON_CONFIG.FOUNTAIN_OF_LIFE.DURATION,
      onStart: () => {
        pulse.setScale(0.2);
        pulse.setAlpha(0.8);
      },
      onComplete: () => pulse.destroy(),
    });

    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.FOUNTAIN_OF_LIFE.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.5;
    this.radius += 10;
  }
}
