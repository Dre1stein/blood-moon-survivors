import Phaser from 'phaser';
import { XP_CONFIG } from '../constants';
import { EquipmentRarity, EquipmentSlot, EquipmentStatName } from '../types';
import { Player } from './Player';

export class EquipmentBox extends Phaser.Physics.Arcade.Sprite {
  readonly slot: EquipmentSlot;
  readonly rarity: EquipmentRarity;
  readonly statName: EquipmentStatName;
  readonly value: number;
  readonly itemName: string;
  readonly color: number;
  isCollected = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    slot: EquipmentSlot,
    rarity: EquipmentRarity,
    statName: EquipmentStatName,
    value: number,
    itemName: string,
    color: number
  ) {
    super(scene, x, y, 'equipment-box');

    this.slot = slot;
    this.rarity = rarity;
    this.statName = statName;
    this.value = value;
    this.itemName = itemName;
    this.color = color;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setTint(color);
  }

  collect(player: Player): void {
    const body = this.body;

    if (this.isCollected || !this.active) {
      return;
    }

    this.isCollected = true;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    this.scene.tweens.add({
      targets: this,
      x: player.x,
      y: player.y,
      duration: Math.max(200, Math.round((Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) / XP_CONFIG.PICKUP_SPEED) * 1000)),
      ease: Phaser.Math.Easing.Quadratic.In,
      onComplete: () => {
        if (!this.scene || !this.active) {
          return;
        }

        this.scene.events.emit('equipment-collected', this);
        this.destroy();
      },
    });
  }

  static fromScene(
    scene: Phaser.Scene,
    x: number,
    y: number,
    slot: EquipmentSlot,
    rarity: EquipmentRarity,
    statName: EquipmentStatName,
    value: number,
    itemName: string,
    color: number
  ): EquipmentBox {
    return new EquipmentBox(scene, x, y, slot, rarity, statName, value, itemName, color);
  }
}
