import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

export class HolyAura extends Weapon {
  private baseDamage = WEAPON_CONFIG.HOLY_AURA.DAMAGE;
  private radius = WEAPON_CONFIG.HOLY_AURA.RADIUS;

  constructor() {
    super('HolyAura');
  }

  getCooldown(): number {
    return Math.max(300, WEAPON_CONFIG.HOLY_AURA.COOLDOWN - (this.level - 1) * 200);
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    const radiusSq = this.radius * this.radius;
    const damage = player.calculateDamage(this.baseDamage, 'melee');

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive) {
        return true;
      }

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;

      if (dx * dx + dy * dy <= radiusSq && damage > 0) {
        enemy.takeDamage(damage);
      }

      return true;
    });

    const pulse = scene.add.circle(player.x, player.y, this.radius, WEAPON_CONFIG.HOLY_AURA.COLOR, 0);
    pulse.setStrokeStyle(3, WEAPON_CONFIG.HOLY_AURA.COLOR, 0.9);

    scene.tweens.add({
      targets: pulse,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: WEAPON_CONFIG.HOLY_AURA.DURATION,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onStart: () => {
        pulse.setScale(0);
        pulse.setAlpha(0.85);
      },
      onComplete: () => {
        pulse.destroy();
      },
    });

    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.HOLY_AURA.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += WEAPON_CONFIG.HOLY_AURA.DAMAGE;
    this.radius += 12;
  }
}
