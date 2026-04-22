import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

export class HolyFireBaptism extends Weapon {
  private baseDamage = WEAPON_CONFIG.HOLY_FIRE_BAPTISM.DAMAGE;
  private radius = WEAPON_CONFIG.HOLY_FIRE_BAPTISM.AOE_RADIUS;

  constructor() {
    super('HolyFireBaptism');
  }

  getCooldown(): number {
    return Math.max(550, WEAPON_CONFIG.HOLY_FIRE_BAPTISM.COOLDOWN - (this.level - 1) * 100);
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

    const blast = scene.add.circle(player.x, player.y, this.radius, WEAPON_CONFIG.HOLY_FIRE_BAPTISM.COLOR, 0.15);
    blast.setStrokeStyle(4, WEAPON_CONFIG.HOLY_FIRE_BAPTISM.COLOR, 0.95);
    scene.tweens.add({
      targets: blast,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: WEAPON_CONFIG.HOLY_FIRE_BAPTISM.LIFETIME * 0.2,
      onStart: () => blast.setScale(0.35),
      onComplete: () => blast.destroy(),
    });

    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.HOLY_FIRE_BAPTISM.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.7;
    this.radius += 8;
  }
}
