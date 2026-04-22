import Phaser from 'phaser';
import { WEAPON_CONFIG, WORLD } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

const _tempVec = new Phaser.Math.Vector2();

type HolyWaterProjectile = Phaser.Physics.Arcade.Sprite & {
  exploded?: boolean;
};

export class HolyWater extends Weapon {
  private projectiles?: Phaser.Physics.Arcade.Group;
  private overlapRegistered = false;
  private baseDamage = WEAPON_CONFIG.HOLY_WATER.DAMAGE;
  private aoeRadius = WEAPON_CONFIG.HOLY_WATER.AOE_RADIUS;

  constructor() {
    super('HolyWater');
  }

  getCooldown(): number {
    return Math.max(500, WEAPON_CONFIG.HOLY_WATER.COOLDOWN - (this.level - 1) * 150);
  }

  override update(delta: number): void {
    super.update(delta);

    if (!this.projectiles) {
      return;
    }

    this.projectiles.children.each((child) => {
      const projectile = child as HolyWaterProjectile;

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
    const target = this.findNearestEnemy(player, enemies);

    if (!target) {
      return;
    }

    this.ensureGroup(scene, enemies, player);

    const projectile = new Phaser.Physics.Arcade.Sprite(scene, player.x, player.y, 'holy-water') as HolyWaterProjectile;
    scene.add.existing(projectile);
    scene.physics.add.existing(projectile);

    projectile.setOrigin(0.5);

    const body = projectile.body;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      const direction = _tempVec.set(target.x - player.x, target.y - player.y);

      if (direction.lengthSq() <= 0) {
        projectile.destroy();
        return;
      }

      direction.normalize().scale(WEAPON_CONFIG.HOLY_WATER.SPEED);
      body.setAllowGravity(false);
      body.setVelocity(direction.x, direction.y - 80);
      body.setCircle(WEAPON_CONFIG.HOLY_WATER.SIZE * 0.5);
    }

    this.projectiles?.add(projectile);
    scene.time.delayedCall(WEAPON_CONFIG.HOLY_WATER.LIFETIME, () => {
      this.explode(scene, projectile, player, enemies);
    });
    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.HOLY_WATER.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.75;
    this.aoeRadius += 10;
    this.cooldownTimer = 0;
  }

  override destroy(): void {
    this.projectiles?.clear(true, true);
    this.projectiles = undefined;
    this.overlapRegistered = false;
  }

  private ensureGroup(scene: Phaser.Scene, enemies: Phaser.Physics.Arcade.Group, player: Player): void {
    if (!this.projectiles) {
      this.projectiles = scene.physics.add.group({ allowGravity: false });
    }

    if (this.overlapRegistered) {
      return;
    }

    scene.physics.add.overlap(this.projectiles, enemies, (projectileBody, overlappedEnemy) => {
      const projectile = projectileBody as HolyWaterProjectile;
      const enemy = overlappedEnemy as Enemy;

      if (!projectile.active || !enemy.active || !enemy.isAlive) {
        return;
      }

      this.explode(scene, projectile, player, enemies, enemy.x, enemy.y);
    });

    this.overlapRegistered = true;
  }

  private explode(
    scene: Phaser.Scene,
    projectile: HolyWaterProjectile,
    player: Player,
    enemies: Phaser.Physics.Arcade.Group,
    x = projectile.x,
    y = projectile.y
  ): void {
    if (!projectile.active || projectile.exploded) {
      return;
    }

    projectile.exploded = true;
    const radiusSq = this.aoeRadius * this.aoeRadius;

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive) {
        return true;
      }

      const dx = enemy.x - x;
      const dy = enemy.y - y;

      if (dx * dx + dy * dy <= radiusSq) {
        enemy.takeDamage(player.calculateDamage(this.baseDamage, 'ranged'));
      }

      return true;
    });

    const blast = scene.add.circle(x, y, this.aoeRadius, WEAPON_CONFIG.HOLY_WATER.COLOR, 0.15);
    blast.setStrokeStyle(3, WEAPON_CONFIG.HOLY_WATER.COLOR, 0.9);
    scene.tweens.add({
      targets: blast,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0,
      duration: 220,
      onStart: () => {
        blast.setScale(0.3);
      },
      onComplete: () => {
        blast.destroy();
      },
    });

    projectile.destroy();
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
