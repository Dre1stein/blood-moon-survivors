import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { FacingDirection } from '../types';
import { Weapon } from './Weapon';

const _tempVec = new Phaser.Math.Vector2();

export class DeathGaze extends Weapon {
  private beams?: Phaser.GameObjects.Group;
  private baseDamage = WEAPON_CONFIG.DEATH_GAZE.DAMAGE;
  private length = WEAPON_CONFIG.DEATH_GAZE.LENGTH;

  constructor() {
    super('DeathGaze');
  }

  getCooldown(): number {
    return Math.max(400, WEAPON_CONFIG.DEATH_GAZE.COOLDOWN - (this.level - 1) * 80);
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    this.ensureGroup(scene);

    const direction = this.resolveDirection(player, enemies);

    if (direction.lengthSq() <= 0) {
      return;
    }

    direction.normalize();
    const angle = direction.angle();
    const beamX = player.x + direction.x * (this.length * 0.5);
    const beamY = player.y + direction.y * (this.length * 0.5);
    const beam = scene.add.rectangle(beamX, beamY, this.length, WEAPON_CONFIG.DEATH_GAZE.WIDTH, WEAPON_CONFIG.DEATH_GAZE.COLOR, 0.55);
    beam.setRotation(angle);
    this.beams?.add(beam);

    this.damageAlongBeam(player, enemies, player.x, player.y, player.x + direction.x * this.length, player.y + direction.y * this.length);

    scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: WEAPON_CONFIG.DEATH_GAZE.DURATION,
      onComplete: () => {
        beam.destroy();
      },
    });

    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.DEATH_GAZE.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.5;
    this.length += 30;
  }

  override destroy(): void {
    this.beams?.clear(true, true);
    this.beams = undefined;
  }

  private ensureGroup(scene: Phaser.Scene): void {
    if (!this.beams) {
      this.beams = scene.add.group();
    }
  }

  private resolveDirection(player: Player, enemies: Phaser.Physics.Arcade.Group): Phaser.Math.Vector2 {
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

    if (nearestEnemy) {
      return _tempVec.set(nearestEnemy.x - player.x, nearestEnemy.y - player.y);
    }

    switch (player.facing) {
      case FacingDirection.Left:
        return _tempVec.set(-1, 0);
      case FacingDirection.Right:
        return _tempVec.set(1, 0);
      case FacingDirection.Up:
        return _tempVec.set(0, -1);
      case FacingDirection.Down:
        return _tempVec.set(0, 1);
      case FacingDirection.Idle:
        return _tempVec.set(0, 0);
    }
  }

  private damageAlongBeam(
    player: Player,
    enemies: Phaser.Physics.Arcade.Group,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    const lineDx = endX - startX;
    const lineDy = endY - startY;
    const lineLengthSq = lineDx * lineDx + lineDy * lineDy;
    const hitRadius = WEAPON_CONFIG.DEATH_GAZE.WIDTH * 0.5 + 10;

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive || lineLengthSq <= 0) {
        return true;
      }

      const t = Phaser.Math.Clamp(((enemy.x - startX) * lineDx + (enemy.y - startY) * lineDy) / lineLengthSq, 0, 1);
      const closestX = startX + lineDx * t;
      const closestY = startY + lineDy * t;
      const dx = enemy.x - closestX;
      const dy = enemy.y - closestY;

      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        enemy.takeDamage(player.calculateDamage(this.baseDamage, 'ranged'));
      }

      return true;
    });
  }
}
