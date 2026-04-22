import Phaser from 'phaser';
import { WEAPON_CONFIG, WORLD } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

const _tempVec = new Phaser.Math.Vector2();
const _trackingVec = new Phaser.Math.Vector2();

type HomingProjectile = Phaser.Physics.Arcade.Sprite & {
  damage: number;
};

export class SilverJudgment extends Weapon {
  private projectiles?: Phaser.Physics.Arcade.Group;
  private overlapRegistered = false;
  private baseDamage = WEAPON_CONFIG.SILVER_JUDGMENT.DAMAGE;

  constructor() {
    super('SilverJudgment');
  }

  getCooldown(): number {
    return Math.max(180, WEAPON_CONFIG.SILVER_JUDGMENT.COOLDOWN - (this.level - 1) * 35);
  }

  override update(delta: number, _scene?: Phaser.Scene, _player?: Player, enemies?: Phaser.Physics.Arcade.Group): void {
    super.update(delta);

    if (!this.projectiles) {
      return;
    }

    this.projectiles.children.each((child) => {
      const projectile = child as HomingProjectile;

      if (!projectile.active) {
        this.projectiles?.remove(projectile, false, false);
        return true;
      }

      if (projectile.x < -24 || projectile.x > WORLD.WIDTH + 24 || projectile.y < -24 || projectile.y > WORLD.HEIGHT + 24) {
        projectile.destroy();
        return true;
      }

      if (enemies) {
        this.trackTowardsNearestEnemy(projectile, enemies, delta);
      }

      return true;
    });
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    const target = this.findNearestEnemy(player.x, player.y, enemies);

    if (!target) {
      return;
    }

    this.ensureGroup(scene, enemies);

    const projectile = new Phaser.Physics.Arcade.Sprite(scene, player.x, player.y, 'bullet-silver') as HomingProjectile;
    scene.add.existing(projectile);
    scene.physics.add.existing(projectile);

    projectile.setOrigin(0.5);
    projectile.setTint(WEAPON_CONFIG.SILVER_JUDGMENT.COLOR);
    projectile.damage = player.calculateDamage(this.baseDamage, 'ranged');

    const body = projectile.body;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      const direction = _tempVec.set(target.x - player.x, target.y - player.y);

      if (direction.lengthSq() <= 0) {
        projectile.destroy();
        return;
      }

      direction.normalize().scale(WEAPON_CONFIG.SILVER_JUDGMENT.SPEED);
      body.setAllowGravity(false);
      body.setVelocity(direction.x, direction.y);
      body.setCircle(WEAPON_CONFIG.SILVER_JUDGMENT.SIZE * 0.5);
    }

    this.projectiles?.add(projectile);
    scene.time.delayedCall(WEAPON_CONFIG.SILVER_JUDGMENT.LIFETIME, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });
    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.SILVER_JUDGMENT.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.6;
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

    scene.physics.add.overlap(this.projectiles, enemies, (projectileBody, overlappedEnemy) => {
      const projectile = projectileBody as HomingProjectile;
      const enemy = overlappedEnemy as Enemy;

      if (!projectile.active || !enemy.active || !enemy.isAlive) {
        return;
      }

      if (projectile.damage > 0) {
        enemy.takeDamage(projectile.damage);
      }

      projectile.destroy();
    });

    this.overlapRegistered = true;
  }

  private trackTowardsNearestEnemy(projectile: HomingProjectile, enemies: Phaser.Physics.Arcade.Group, delta: number): void {
    const body = projectile.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    const target = this.findNearestEnemy(projectile.x, projectile.y, enemies);

    if (!target) {
      return;
    }

    const desiredVelocity = _trackingVec.set(target.x - projectile.x, target.y - projectile.y);

    if (desiredVelocity.lengthSq() <= 0) {
      return;
    }

    desiredVelocity.normalize().scale(WEAPON_CONFIG.SILVER_JUDGMENT.SPEED);
    const lerp = Math.min(1, delta / 280);
    body.velocity.x = Phaser.Math.Linear(body.velocity.x, desiredVelocity.x, lerp);
    body.velocity.y = Phaser.Math.Linear(body.velocity.y, desiredVelocity.y, lerp);
  }

  private findNearestEnemy(x: number, y: number, enemies: Phaser.Physics.Arcade.Group): Enemy | undefined {
    let nearestEnemy: Enemy | undefined;
    let nearestDistanceSq = Number.POSITIVE_INFINITY;

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive) {
        return true;
      }

      const dx = enemy.x - x;
      const dy = enemy.y - y;
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
