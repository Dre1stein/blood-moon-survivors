import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

export class IceBarrier extends Weapon {
  private waves?: Phaser.GameObjects.Group;
  private baseDamage = WEAPON_CONFIG.ICE_BARRIER.DAMAGE;
  private radius = WEAPON_CONFIG.ICE_BARRIER.RADIUS;
  private freezeMs = WEAPON_CONFIG.ICE_BARRIER.FREEZE_MS;

  constructor() {
    super('IceBarrier');
  }

  getCooldown(): number {
    return Math.max(700, WEAPON_CONFIG.ICE_BARRIER.COOLDOWN - (this.level - 1) * 120);
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    this.ensureGroup(scene);
    const radiusSq = this.radius * this.radius;

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive) {
        return true;
      }

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;

      if (dx * dx + dy * dy <= radiusSq) {
        enemy.takeDamage(player.calculateDamage(this.baseDamage, 'melee'));
        this.freezeEnemy(scene, enemy);
      }

      return true;
    });

    const ring = scene.add.circle(player.x, player.y, this.radius, WEAPON_CONFIG.ICE_BARRIER.COLOR, 0);
    ring.setStrokeStyle(3, WEAPON_CONFIG.ICE_BARRIER.COLOR, 0.95);
    this.waves?.add(ring);
    scene.tweens.add({
      targets: ring,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: WEAPON_CONFIG.ICE_BARRIER.DURATION,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onStart: () => {
        ring.setScale(0.2);
        ring.setAlpha(0.9);
      },
      onComplete: () => {
        ring.destroy();
      },
    });

    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.ICE_BARRIER.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.5;
    this.radius += 10;
    this.freezeMs += 250;
  }

  override destroy(): void {
    this.waves?.clear(true, true);
    this.waves = undefined;
  }

  private ensureGroup(scene: Phaser.Scene): void {
    if (!this.waves) {
      this.waves = scene.add.group();
    }
  }

  private freezeEnemy(scene: Phaser.Scene, enemy: Enemy): void {
    enemy.setData('frozen', true);
    enemy.setData('freezeUntil', scene.time.now + this.freezeMs);
    enemy.speed = enemy.baseSpeed * 0.5;
    enemy.setTintFill(WEAPON_CONFIG.ICE_BARRIER.COLOR);

    scene.time.delayedCall(this.freezeMs, () => {
      if (!enemy.active || !enemy.isAlive) {
        return;
      }

      const freezeUntil = enemy.getData('freezeUntil') as number | undefined;

      if ((freezeUntil ?? 0) > scene.time.now) {
        return;
      }

      enemy.setData('frozen', false);
      enemy.speed = enemy.baseSpeed;
      enemy.clearTint();
    });
  }
}
