import Phaser from 'phaser';
import { WEAPON_CONFIG, WORLD } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { FacingDirection } from '../types';
import { Weapon } from './Weapon';

const _tempVec = new Phaser.Math.Vector2();

type SlashProjectile = Phaser.Physics.Arcade.Sprite & {
  piercedEnemies: Set<Enemy>;
  remainingPierce: number;
};

export class BloodMoonSlash extends Weapon {
  private projectiles?: Phaser.Physics.Arcade.Group;
  private overlapRegistered = false;
  private baseDamage = WEAPON_CONFIG.BLOOD_MOON_SLASH.DAMAGE;
  private pierce = WEAPON_CONFIG.BLOOD_MOON_SLASH.PIERCE;

  constructor() {
    super('BloodMoonSlash');
  }

  getCooldown(): number {
    return Math.max(160, WEAPON_CONFIG.BLOOD_MOON_SLASH.COOLDOWN - (this.level - 1) * 30);
  }

  override update(delta: number): void {
    super.update(delta);

    if (!this.projectiles) {
      return;
    }

    this.projectiles.children.each((child) => {
      const projectile = child as SlashProjectile;

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

    const baseDirection = this.resolveDirection(player, enemies);

    if (baseDirection.lengthSq() <= 0) {
      return;
    }

    baseDirection.normalize();
    const spreadAngles = [-0.15, 0.15];

    for (const spread of spreadAngles) {
      const projectile = new Phaser.Physics.Arcade.Sprite(scene, player.x, player.y, 'blood-dagger') as SlashProjectile;
      scene.add.existing(projectile);
      scene.physics.add.existing(projectile);

      projectile.setOrigin(0.5);
      projectile.setTint(WEAPON_CONFIG.BLOOD_MOON_SLASH.COLOR);
      projectile.piercedEnemies = new Set<Enemy>();
      projectile.remainingPierce = this.pierce;
      projectile.setRotation(baseDirection.angle() + spread);
      projectile.setData('damage', player.calculateDamage(this.baseDamage, 'melee'));

      const body = projectile.body;

      if (body instanceof Phaser.Physics.Arcade.Body) {
        const velocity = _tempVec.set(baseDirection.x, baseDirection.y).rotate(spread).scale(WEAPON_CONFIG.BLOOD_MOON_SLASH.SPEED);
        body.setAllowGravity(false);
        body.setVelocity(velocity.x, velocity.y);
        body.setCircle(WEAPON_CONFIG.BLOOD_MOON_SLASH.SIZE * 0.5);
      }

      this.projectiles?.add(projectile);
      scene.time.delayedCall(WEAPON_CONFIG.BLOOD_MOON_SLASH.LIFETIME, () => {
        if (projectile.active) {
          projectile.destroy();
        }
      });
    }

    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.BLOOD_MOON_SLASH.MAX_LEVEL) {
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
      const projectile = projectileBody as SlashProjectile;
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
