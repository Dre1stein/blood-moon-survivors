import Phaser from 'phaser';
import { WORLD } from '../constants';

const BASE_RADIUS = 52;
const THUMB_RADIUS = 22;
const DEAD_ZONE = 0.15;
const POS_X = 90;
const POS_Y = WORLD.HEIGHT - 90;

export class VirtualJoystick {
  private readonly scene: Phaser.Scene;
  private readonly base: Phaser.GameObjects.Container;
  private readonly thumb: Phaser.GameObjects.Arc;
  private active = false;
  private pointerId: number | null = null;
  private dirX = 0;
  private dirY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const baseCircle = scene.add.circle(0, 0, BASE_RADIUS, 0xffffff, 0.08)
      .setStrokeStyle(2, 0xffffff, 0.25);

    const baseCrossH = scene.add.rectangle(0, 0, BASE_RADIUS * 1.4, 2, 0xffffff, 0.12);
    const baseCrossV = scene.add.rectangle(0, 0, 2, BASE_RADIUS * 1.4, 0xffffff, 0.12);

    this.thumb = scene.add.circle(0, 0, THUMB_RADIUS, 0xffffff, 0.3)
      .setStrokeStyle(2, 0xffffff, 0.5);

    this.base = scene.add.container(POS_X, POS_Y, [baseCircle, baseCrossH, baseCrossV])
      .setDepth(150)
      .setScrollFactor(0)
      .setSize(BASE_RADIUS * 2, BASE_RADIUS * 2)
      .setInteractive(new Phaser.Geom.Circle(0, 0, BASE_RADIUS + 10), Phaser.Geom.Circle.Contains);

    this.thumb.setDepth(151).setScrollFactor(0);

    scene.add.existing(this.thumb);

    this.base.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.activate(pointer);
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.active && pointer.id === this.pointerId) {
        this.updateDirection(pointer);
      }
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.active && pointer.id === this.pointerId) {
        this.deactivate();
      }
    });
  }

  private activate(pointer: Phaser.Input.Pointer): void {
    this.active = true;
    this.pointerId = pointer.id;
    this.updateDirection(pointer);
    this.thumb.setFillStyle(0xffffff, 0.45);
    this.thumb.setStrokeStyle(2, 0xffcc44, 0.7);
  }

  private deactivate(): void {
    this.active = false;
    this.pointerId = null;
    this.dirX = 0;
    this.dirY = 0;
    this.thumb.setPosition(POS_X, POS_Y);
    this.thumb.setFillStyle(0xffffff, 0.3);
    this.thumb.setStrokeStyle(2, 0xffffff, 0.5);
  }

  private updateDirection(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - POS_X;
    const dy = pointer.y - POS_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      this.dirX = 0;
      this.dirY = 0;
      this.thumb.setPosition(POS_X, POS_Y);
      return;
    }

    const clampedDist = Math.min(dist, BASE_RADIUS);
    const nx = dx / dist;
    const ny = dy / dist;

    this.thumb.setPosition(POS_X + nx * clampedDist, POS_Y + ny * clampedDist);

    const magnitude = clampedDist / BASE_RADIUS;
    if (magnitude < DEAD_ZONE) {
      this.dirX = 0;
      this.dirY = 0;
    } else {
      const adjusted = (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE);
      this.dirX = nx * adjusted;
      this.dirY = ny * adjusted;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  getDirection(): { x: number; y: number } {
    return { x: this.dirX, y: this.dirY };
  }

  setVisible(visible: boolean): void {
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
  }

  destroy(): void {
    this.base.destroy();
    this.thumb.destroy();
  }
}
