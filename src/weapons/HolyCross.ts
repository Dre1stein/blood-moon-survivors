import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

type CrossSprite = Phaser.Physics.Arcade.Sprite & {
  orbitAngle: number;
  hitCooldowns: Map<Enemy, number>;
};

export class HolyCross extends Weapon {
  private crosses?: Phaser.Physics.Arcade.Group;
  private overlapRegistered = false;
  private player?: Player;
  private baseDamage = WEAPON_CONFIG.HOLY_CROSS.DAMAGE;
  private orbitSpeed = WEAPON_CONFIG.HOLY_CROSS.ORBIT_SPEED;
  private orbitRadius = WEAPON_CONFIG.HOLY_CROSS.ORBIT_RADIUS;
  private crossCount = WEAPON_CONFIG.HOLY_CROSS.COUNT;

  constructor() {
    super('HolyCross');
  }

  getCooldown(): number {
    return WEAPON_CONFIG.HOLY_CROSS.COOLDOWN;
  }

  override update(delta: number): void {
    super.update(delta);

    const player = this.player;

    if (!player || !this.crosses) {
      return;
    }

    const deltaSeconds = delta / 1000;

    this.crosses.children.each((child, index) => {
      const cross = child as CrossSprite;

      if (!cross.active) {
        this.crosses?.remove(cross, false, false);
        return true;
      }

      cross.orbitAngle += this.orbitSpeed * deltaSeconds;
      cross.setPosition(
        player.x + Math.cos(cross.orbitAngle) * this.orbitRadius,
        player.y + Math.sin(cross.orbitAngle) * this.orbitRadius
      );
      cross.setRotation(cross.orbitAngle + index);

      return true;
    });
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    this.player = player;
    this.ensureGroup(scene, enemies);

    const activeCount = this.crosses?.countActive(true) ?? 0;
    const missingCount = Math.max(0, this.crossCount - activeCount);

    if (missingCount <= 0) {
      this.resetCooldown();
      return;
    }

    const startIndex = activeCount;

    for (let index = 0; index < missingCount; index += 1) {
      const orbitIndex = startIndex + index;
      const cross = new Phaser.Physics.Arcade.Sprite(scene, player.x, player.y, 'holy-cross') as CrossSprite;
      scene.add.existing(cross);
      scene.physics.add.existing(cross);

      cross.setOrigin(0.5);
      cross.orbitAngle = (Math.PI * 2 * orbitIndex) / this.crossCount;
      cross.hitCooldowns = new Map<Enemy, number>();

      const body = cross.body;

      if (body instanceof Phaser.Physics.Arcade.Body) {
        body.setAllowGravity(false);
        body.moves = false;
        body.setCircle(WEAPON_CONFIG.HOLY_CROSS.SIZE * 0.5);
      }

      cross.setPosition(
        player.x + Math.cos(cross.orbitAngle) * this.orbitRadius,
        player.y + Math.sin(cross.orbitAngle) * this.orbitRadius
      );

      this.crosses?.add(cross);
    }

    this.resetCooldown();
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.HOLY_CROSS.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += WEAPON_CONFIG.HOLY_CROSS.DAMAGE;
    this.orbitSpeed += 0.3;
    this.crossCount += 1;
    this.orbitRadius += 6;
    this.cooldownTimer = 0;
  }

  override destroy(): void {
    this.crosses?.clear(true, true);
    this.crosses = undefined;
    this.player = undefined;
    this.overlapRegistered = false;
  }

  private ensureGroup(scene: Phaser.Scene, enemies: Phaser.Physics.Arcade.Group): void {
    if (!this.crosses) {
      this.crosses = scene.physics.add.group({ allowGravity: false });
    }

    if (this.overlapRegistered) {
      return;
    }

    scene.physics.add.overlap(this.crosses, enemies, (crossBody, overlappedEnemy) => {
      const cross = crossBody as CrossSprite;
      const enemy = overlappedEnemy as Enemy;

      if (!cross.active || !enemy.active || !enemy.isAlive) {
        return;
      }

      const now = scene.time.now;
      const nextAllowedHit = cross.hitCooldowns.get(enemy) ?? 0;

      if (now < nextAllowedHit) {
        return;
      }

        const damage = this.player?.calculateDamage(this.baseDamage, 'melee') ?? 0;

        if (damage > 0) {
          enemy.takeDamage(damage);
        }

      cross.hitCooldowns.set(enemy, now + 250);
      scene.time.delayedCall(300, () => {
        cross.hitCooldowns.delete(enemy);
      });
    });

    this.overlapRegistered = true;
  }
}
