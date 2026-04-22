import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

export class ThunderHammer extends Weapon {
  private hammers?: Phaser.GameObjects.Group;
  private baseDamage = WEAPON_CONFIG.THUNDER_HAMMER.DAMAGE;

  constructor() {
    super('ThunderHammer');
  }

  getCooldown(): number {
    return Math.max(1500, WEAPON_CONFIG.THUNDER_HAMMER.COOLDOWN - (this.level - 1) * 150);
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    this.ensureGroup(scene);

    const targets = this.pickTargets(enemies);

    if (targets.length === 0) {
      return;
    }

    for (const target of targets) {
      const hammer = scene.add.sprite(target.x, target.y - 90, 'thunder-hammer');
      hammer.setScale(2);
      this.hammers?.add(hammer);

      scene.tweens.add({
        targets: hammer,
        y: target.y,
        scaleX: 1,
        scaleY: 1,
        duration: WEAPON_CONFIG.THUNDER_HAMMER.LIFETIME,
        ease: Phaser.Math.Easing.Cubic.In,
        onComplete: () => {
          this.strike(scene, player, target, enemies);
          hammer.destroy();
        },
      });
    }

    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.THUNDER_HAMMER.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.75;
  }

  override destroy(): void {
    this.hammers?.clear(true, true);
    this.hammers = undefined;
  }

  private ensureGroup(scene: Phaser.Scene): void {
    if (!this.hammers) {
      this.hammers = scene.add.group();
    }
  }

  private pickTargets(enemies: Phaser.Physics.Arcade.Group): Enemy[] {
    const aliveEnemies: Enemy[] = [];

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (enemy.active && enemy.isAlive) {
        aliveEnemies.push(enemy);
      }

      return true;
    });

    Phaser.Utils.Array.Shuffle(aliveEnemies);
    return aliveEnemies.slice(0, this.getTargetCount());
  }

  private getTargetCount(): number {
    if (this.level >= 5) {
      return 3;
    }

    if (this.level >= 3) {
      return 2;
    }

    return 1;
  }

  private strike(scene: Phaser.Scene, player: Player, target: Enemy, enemies: Phaser.Physics.Arcade.Group): void {
    if (target.active && target.isAlive) {
      target.takeDamage(player.calculateDamage(this.baseDamage, 'ranged'));
    }

    const aoeRadius = 42;
    const radiusSq = aoeRadius * aoeRadius;

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive || enemy === target) {
        return true;
      }

      const dx = enemy.x - target.x;
      const dy = enemy.y - target.y;

      if (dx * dx + dy * dy <= radiusSq) {
        enemy.takeDamage(player.calculateDamage(Math.max(1, this.baseDamage - 1), 'ranged'));
      }

      return true;
    });

    const impact = scene.add.circle(target.x, target.y, aoeRadius, WEAPON_CONFIG.THUNDER_HAMMER.COLOR, 0.2);
    impact.setStrokeStyle(4, WEAPON_CONFIG.THUNDER_HAMMER.COLOR, 1);
    scene.tweens.add({
      targets: impact,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 180,
      onStart: () => {
        impact.setScale(0.5);
      },
      onComplete: () => {
        impact.destroy();
      },
    });
  }
}
