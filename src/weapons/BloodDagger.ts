import Phaser from 'phaser';
import { WEAPON_CONFIG, WORLD } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { FacingDirection } from '../types';
import { Weapon } from './Weapon';

const _tempVec = new Phaser.Math.Vector2();

type BloodDaggerProjectile = Phaser.Physics.Arcade.Sprite & {
  piercedEnemies: Set<Enemy>;
  remainingPierce: number;
};

export class BloodDagger extends Weapon {
  private projectiles?: Phaser.Physics.Arcade.Group;
  private overlapRegistered = false;
  private baseDamage = WEAPON_CONFIG.BLOOD_DAGGER.DAMAGE;
  private pierce = WEAPON_CONFIG.BLOOD_DAGGER.PIERCE;

  constructor() {
    super('BloodDagger');
  }

  getCooldown(): number {
    return Math.max(250, WEAPON_CONFIG.BLOOD_DAGGER.COOLDOWN - (this.level - 1) * 50);
  }

  override update(delta: number): void {
    super.update(delta);

    if (!this.projectiles) {
      return;
    }

    this.projectiles.children.each((child) => {
      const projectile = child as BloodDaggerProjectile;

      if (!projectile.active) {
        this.projectiles?.remove(projectile, false, false);
        return true;
      }

      if (projectile.x < -32 || projectile.x > WORLD.WIDTH + 32 || projectile.y < -32 || projectile.y > WORLD.HEIGHT + 32) {
        projectile.destroy();
      }

      return true;
    });
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    this.ensureGroup(scene, enemies);

    const direction = this.resolveDirection(player, enemies);

    if (direction.lengthSq() <= 0) {
      return;
    }

    direction.normalize();

    const projectile = new Phaser.Physics.Arcade.Sprite(scene, player.x, player.y, 'blood-dagger') as BloodDaggerProjectile;
    scene.add.existing(projectile);
    scene.physics.add.existing(projectile);

    projectile.setOrigin(0.5);
    projectile.setRotation(direction.angle());
    projectile.setData('damage', player.calculateDamage(this.baseDamage, 'melee'));
    projectile.piercedEnemies = new Set<Enemy>();
    projectile.remainingPierce = this.pierce;

    const body = projectile.body;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setAllowGravity(false);
      body.setVelocity(direction.x * WEAPON_CONFIG.BLOOD_DAGGER.SPEED, direction.y * WEAPON_CONFIG.BLOOD_DAGGER.SPEED);
      body.setCircle(WEAPON_CONFIG.BLOOD_DAGGER.SIZE * 0.5);
    }

    this.projectiles?.add(projectile);
    scene.time.delayedCall(WEAPON_CONFIG.BLOOD_DAGGER.LIFETIME, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });
    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.BLOOD_DAGGER.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.5;

    if (this.level === 3 || this.level === 5) {
      this.pierce += 1;
    }
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
      const projectile = projectileBody as BloodDaggerProjectile;
      const enemy = overlappedEnemy as Enemy;

      if (!projectile.active || !enemy.active || !enemy.isAlive || projectile.piercedEnemies.has(enemy)) {
        return;
      }

      projectile.piercedEnemies.add(enemy);
      enemy.takeDamage((projectile.getData('damage') as number | undefined) ?? this.baseDamage);
      projectile.remainingPierce -= 1;

      if (projectile.remainingPierce <= 0) {
        projectile.destroy();
      }
    });

    this.overlapRegistered = true;
  }

  private resolveDirection(player: Player, enemies: Phaser.Physics.Arcade.Group): Phaser.Math.Vector2 {
    if (player.facing !== FacingDirection.Idle) {
      switch (player.facing) {
        case FacingDirection.Left:
          return _tempVec.set(-1, 0);
        case FacingDirection.Right:
          return _tempVec.set(1, 0);
        case FacingDirection.Up:
          return _tempVec.set(0, -1);
        case FacingDirection.Down:
          return _tempVec.set(0, 1);
      }
    }

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

    if (!nearestEnemy) {
      return _tempVec.set(0, 0);
    }

    return _tempVec.set(nearestEnemy.x - player.x, nearestEnemy.y - player.y);
  }
}
