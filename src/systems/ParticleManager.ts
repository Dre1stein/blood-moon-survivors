import Phaser from 'phaser';

export class ParticleManager {
  constructor(private readonly scene: Phaser.Scene) {}

  hitEffect(x: number, y: number, color: number): void {
    const flash = this.scene.add.circle(x, y, 8, color, 0.5);
    this.scene.tweens.add({
      targets: flash,
      radius: 18,
      alpha: 0,
      duration: 160,
      onComplete: () => flash.destroy(),
    });
  }

  deathEffect(x: number, y: number): void {
    this.spawnBurst(x, y, 0xff6666, 6, 18, 26, 220);
  }

  bossDeathEffect(x: number, y: number): void {
    this.spawnBurst(x, y, 0xff2222, 10, 30, 44, 320);
  }

  levelUpEffect(x: number, y: number): void {
    const ring = this.scene.add.circle(x, y, 22, 0xffdd44, 0);
    ring.setStrokeStyle(4, 0xffdd44, 1);
    this.scene.tweens.add({
      targets: ring,
      radius: 92,
      alpha: 0,
      duration: 450,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => ring.destroy(),
    });
  }

  healEffect(x: number, y: number): void {
    for (let index = 0; index < 4; index += 1) {
      const sparkle = this.scene.add.rectangle(x, y, 4, 8, 0x44ff88);
      this.scene.tweens.add({
        targets: sparkle,
        x: x + Phaser.Math.Between(-10, 10),
        y: y - Phaser.Math.Between(18, 34),
        alpha: 0,
        angle: Phaser.Math.Between(-25, 25),
        duration: 280,
        delay: index * 25,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  xpCollectEffect(x: number, y: number): void {
    const flash = this.scene.add.rectangle(x, y, 10, 10, 0x4488ff, 0.6);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 140,
      onComplete: () => flash.destroy(),
    });
  }

  private spawnBurst(x: number, y: number, color: number, count: number, minDistance: number, maxDistance: number, duration: number): void {
    for (let index = 0; index < count; index += 1) {
      const particle = this.scene.add.rectangle(x, y, 4, 4, color, 0.85);
      const angle = (Math.PI * 2 * index) / count;
      const distance = Phaser.Math.Between(minDistance, maxDistance);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration,
        ease: Phaser.Math.Easing.Cubic.Out,
        onComplete: () => particle.destroy(),
      });
    }
  }
}
