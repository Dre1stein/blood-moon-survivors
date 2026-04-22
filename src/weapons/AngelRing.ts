import Phaser from 'phaser';
import { WEAPON_CONFIG } from '../constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Weapon } from './Weapon';

type RingCross = Phaser.Physics.Arcade.Sprite & {
  orbitAngle: number;
  hitCooldowns: Map<Enemy, number>;
};

export class AngelRing extends Weapon {
  private crosses?: Phaser.Physics.Arcade.Group;
  private overlapRegistered = false;
  private player?: Player;
  private baseDamage = WEAPON_CONFIG.ANGEL_RING.DAMAGE;
  private orbitSpeed = WEAPON_CONFIG.ANGEL_RING.ORBIT_SPEED;
  private orbitRadius = WEAPON_CONFIG.ANGEL_RING.ORBIT_RADIUS;
  private crossCount = WEAPON_CONFIG.ANGEL_RING.COUNT;

  constructor() {
    super('AngelRing');
  }

  getCooldown(): number {
    return Math.max(1200, WEAPON_CONFIG.ANGEL_RING.COOLDOWN - (this.level - 1) * 120);
  }

  override update(delta: number): void {
    super.update(delta);

    const player = this.player;

    if (!player || !this.crosses) {
      return;
    }

    const deltaSeconds = delta / 1000;

    this.crosses.children.each((child, index) => {
      const cross = child as RingCross;

      if (!cross.active) {
        this.crosses?.remove(cross, false, false);
        return true;
      }

      cross.orbitAngle += this.orbitSpeed * deltaSeconds;
      cross.setPosition(player.x + Math.cos(cross.orbitAngle) * this.orbitRadius, player.y + Math.sin(cross.orbitAngle) * this.orbitRadius);
      cross.setRotation(cross.orbitAngle + index);
      return true;
    });
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    this.player = player;
    this.ensureGroup(scene, enemies);

    const activeCount = this.crosses?.countActive(true) ?? 0;
    const missingCount = Math.max(0, this.crossCount - activeCount);

    for (let index = 0; index < missingCount; index += 1) {
      const orbitIndex = activeCount + index;
      const cross = new Phaser.Physics.Arcade.Sprite(scene, player.x, player.y, 'holy-cross') as RingCross;
      scene.add.existing(cross);
      scene.physics.add.existing(cross);

      cross.setOrigin(0.5);
      cross.setTint(WEAPON_CONFIG.ANGEL_RING.COLOR);
      cross.orbitAngle = (Math.PI * 2 * orbitIndex) / this.crossCount;
      cross.hitCooldowns = new Map<Enemy, number>();

      const body = cross.body;

      if (body instanceof Phaser.Physics.Arcade.Body) {
        body.setAllowGravity(false);
        body.moves = false;
        body.setCircle(WEAPON_CONFIG.ANGEL_RING.SIZE * 0.5);
      }

      this.crosses?.add(cross);
    }

    this.burst(scene, player, enemies);
    this.resetCooldown(player.cooldownMultiplier);
  }

  override upgrade(): void {
    if (this.level >= WEAPON_CONFIG.ANGEL_RING.MAX_LEVEL) {
      return;
    }

    this.level += 1;
    this.baseDamage += 0.5;
    this.orbitRadius += 6;
    this.orbitSpeed += 0.2;
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
      const cross = crossBody as RingCross;
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

      cross.hitCooldowns.set(enemy, now + 220);
      scene.time.delayedCall(260, () => {
        cross.hitCooldowns.delete(enemy);
      });
    });

    this.overlapRegistered = true;
  }

  private burst(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    const radiusSq = WEAPON_CONFIG.ANGEL_RING.BURST_RADIUS * WEAPON_CONFIG.ANGEL_RING.BURST_RADIUS;
    const burstDamage = player.calculateDamage(this.baseDamage * 0.8, 'melee');

    enemies.children.each((child) => {
      const enemy = child as Enemy;

      if (!enemy.active || !enemy.isAlive) {
        return true;
      }

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;

      if (dx * dx + dy * dy <= radiusSq) {
        enemy.takeDamage(burstDamage);
      }

      return true;
    });

    const wave = scene.add.circle(player.x, player.y, WEAPON_CONFIG.ANGEL_RING.BURST_RADIUS, WEAPON_CONFIG.ANGEL_RING.COLOR, 0);
    wave.setStrokeStyle(3, WEAPON_CONFIG.ANGEL_RING.COLOR, 0.9);
    scene.tweens.add({
      targets: wave,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 260,
      onStart: () => {
        wave.setScale(0.3);
        wave.setAlpha(0.9);
      },
      onComplete: () => wave.destroy(),
    });
  }
}
