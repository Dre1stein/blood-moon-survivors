import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

export class WrathOfThor extends Weapon {
  private hammers?: Phaser.GameObjects.Group;
  private baseDamage = WEAPON_CONFIG.WRATH_OF_THOR.DAMAGE;

  constructor() {
    super('WrathOfThor');
  }

  getCooldown(): number {
    return Math.max(1100, WEAPON_CONFIG.WRATH_OF_THOR.COOLDOWN - (this.level - 1) * 120);
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    this.ensureGroup(scene);
    const targets = this.pickTargets(enemies);

    if (targets.length === 0) {
      return;
    }

    for (const target of targets) {
      const hammer = scene.add.sprite(target.x, target.y - 100, 'thunder-hammer');
      hammer.setTint(WEAPON_CONFIG.WRATH_OF_THOR.COLOR);
      hammer.setScale(2.2);
      this.hammers?.add(hammer);

      scene.tweens.add({
        targets: hammer,
        y: target.y,
        scaleX: 1,
        scaleY: 1,
        duration: WEAPON_CONFIG.WRATH_OF_THOR.LIFETIME,
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
    if (this.level >= WEAPON_CONFIG.WRATH_OF_THOR.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.9;
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
    return aliveEnemies.slice(0, 3);
  }

  private strike(scene: Phaser.Scene, player: Player, target: Enemy, enemies: Phaser.Physics.Arcade.Group): void {
    if (target.active && target.isAlive) {
      target.takeDamage(player.calculateDamage(this.baseDamage, 'ranged'));
    }

    const aoeRadius = 60;
    const radiusSq = aoeRadius * aoeRadius;

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive || enemy === target) {
        return true;
      }

      const dx = enemy.x - target.x;
      const dy = enemy.y - target.y;

      if (dx * dx + dy * dy <= radiusSq) {
        enemy.takeDamage(player.calculateDamage(this.baseDamage * 0.7, 'ranged'));
      }

      return true;
    });

    const impact = scene.add.circle(target.x, target.y, aoeRadius, WEAPON_CONFIG.WRATH_OF_THOR.COLOR, 0.18);
    impact.setStrokeStyle(4, WEAPON_CONFIG.WRATH_OF_THOR.COLOR, 1);
    scene.tweens.add({
      targets: impact,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 220,
      onStart: () => impact.setScale(0.45),
      onComplete: () => impact.destroy(),
    });
  }
}
