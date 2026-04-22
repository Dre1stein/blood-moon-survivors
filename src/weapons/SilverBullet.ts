import Phaser from 'phaser';
import { WEAPON_CONFIG, WORLD } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

const _tempVec = new Phaser.Math.Vector2();

export class SilverBullet extends Weapon {
  private projectiles?: Phaser.Physics.Arcade.Group;
  private overlapRegistered = false;
  private baseDamage = WEAPON_CONFIG.SILVER_BULLET.DAMAGE;

  constructor() {
    super('SilverBullet');
  }

  getCooldown(): number {
    return Math.max(200, WEAPON_CONFIG.SILVER_BULLET.COOLDOWN - (this.level - 1) * 100);
  }

  override update(delta: number): void {
    super.update(delta);

    if (!this.projectiles) {
      return;
    }

    this.projectiles.children.each((child) => {
      const projectile = child as Phaser.Physics.Arcade.Sprite;

      if (!projectile.active) {
        this.projectiles?.remove(projectile, false, false);
        return true;
      }

      if (
        projectile.x < 0 ||
        projectile.x > WORLD.WIDTH ||
        projectile.y < 0 ||
        projectile.y > WORLD.HEIGHT
      ) {
        projectile.destroy();
      }

      return true;
    });
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    const target = this.findNearestEnemy(player, enemies);

    if (!target) {
      return;
    }

    this.ensureGroup(scene, enemies);

    const projectile = new Phaser.Physics.Arcade.Sprite(scene, player.x, player.y, 'bullet-silver');
    scene.add.existing(projectile);
    scene.physics.add.existing(projectile);

    projectile.setOrigin(0.5);
    projectile.setData('damage', player.calculateDamage(this.baseDamage, 'ranged'));

    const body = projectile.body;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      const direction = _tempVec.set(target.x - player.x, target.y - player.y);

      if (direction.lengthSq() <= 0) {
        projectile.destroy();
        return;
      }

      direction.normalize().scale(WEAPON_CONFIG.SILVER_BULLET.SPEED);
      body.setAllowGravity(false);
      body.setVelocity(direction.x, direction.y);
      body.setCircle(WEAPON_CONFIG.SILVER_BULLET.SIZE * 0.5);
    }

    this.projectiles?.add(projectile);
    scene.time.delayedCall(WEAPON_CONFIG.SILVER_BULLET.LIFETIME, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });
    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.SILVER_BULLET.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += WEAPON_CONFIG.SILVER_BULLET.DAMAGE;
  }

  override destroy(): void {
    this.projectiles?.clear(true, true);
    this.projectiles = undefined;
    this.overlapRegistered = false;
  }

  private ensureGroup(scene: Phaser.Scene, enemies: Phaser.Physics.Arcade.Group): void {
    if (!this.projectiles) {
      this.projectiles = scene.physics.add.group({ allowGravity: false });
    }

    if (this.overlapRegistered) {
      return;
    }

    scene.physics.add.overlap(this.projectiles, enemies, (_projectile, overlappedEnemy) => {
      const projectile = _projectile as Phaser.Physics.Arcade.Sprite;
      const enemy = overlappedEnemy as Enemy;

      if (!projectile.active || !enemy.active || !enemy.isAlive) {
        return;
      }

      const damage = projectile.getData('damage') as number | undefined;

      if ((damage ?? 0) > 0) {
        enemy.takeDamage(damage ?? 0);
      }

      projectile.destroy();
    });

    this.overlapRegistered = true;
  }

  private findNearestEnemy(player: Player, enemies: Phaser.Physics.Arcade.Group): Enemy | undefined {
    let nearestEnemy: Enemy | undefined;
    let nearestDistanceSq = Number.POSITIVE_INFINITY;

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive) {
        return true;
      }

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq < nearestDistanceSq) {
        nearestDistanceSq = distanceSq;
        nearestEnemy = enemy;
      }

      return true;
    });

    return nearestEnemy;
  }
}
