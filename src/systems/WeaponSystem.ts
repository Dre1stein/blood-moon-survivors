import type Phaser from 'phaser';
import type { Player } from '../entities/Player';
import { Weapon } from '../weapons/Weapon';

export class WeaponSystem {
  private weapons: Weapon[] = [];
  private static readonly MAX_WEAPONS = 6;

  addWeapon(weapon: Weapon): boolean {
    if (this.weapons.length >= WeaponSystem.MAX_WEAPONS || this.hasWeapon(weapon.name)) {
      return false;
    }

    this.weapons.push(weapon);
    return true;
  }

  update(delta: number, scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group): void {
    for (const weapon of this.weapons) {
      weapon.update(delta, scene, player, enemies);

      if (weapon.isReady) {
        weapon.fire(scene, player, enemies);
      }
    }
  }

  getWeapons(): Weapon[] {
    return this.weapons;
  }

  getWeapon(name: string): Weapon | undefined {
    return this.weapons.find((weapon) => weapon.name === name);
  }

  hasWeapon(name: string): boolean {
    return this.getWeapon(name) !== undefined;
  }

  removeWeapon(name: string): Weapon | undefined {
    const index = this.weapons.findIndex((weapon) => weapon.name === name);

    if (index < 0) {
      return undefined;
    }

    const [removedWeapon] = this.weapons.splice(index, 1);
    removedWeapon.destroy();
    return removedWeapon;
  }

  getWeaponCount(): number {
    return this.weapons.length;
  }

  reset(): void {
    for (const weapon of this.weapons) {
      weapon.destroy();
    }

    this.weapons = [];
  }
}
