import { EQUIPMENT_CONFIG } from '../constants';
import { Player } from '../entities/Player';
import { EquipmentRarity, EquipmentSlot, EquipmentStatName } from '../types';

type EquippedItem = {
  itemName: string;
  statName: EquipmentStatName;
  value: number;
  rarity: EquipmentRarity;
  color: number;
};

export class EquipmentSystem {
  private readonly player: Player;
  private readonly equipped = new Map<EquipmentSlot, EquippedItem>();

  constructor(player: Player) {
    this.player = player;
  }

  equip(slot: EquipmentSlot, statName: EquipmentStatName, value: number, itemName: string, rarity: EquipmentRarity, color: number): void {
    const existing = this.equipped.get(slot);

    if (existing) {
      this.player.applyEquipmentBonus(existing.statName, -existing.value);
    }

    this.equipped.set(slot, { itemName, statName, value, rarity, color });
    this.player.applyEquipmentBonus(statName, value);
  }

  getEquipped(): Map<string, { itemName: string; statName: EquipmentStatName; value: number }> {
    const result = new Map<string, { itemName: string; statName: EquipmentStatName; value: number }>();

    this.equipped.forEach((value, key) => {
      result.set(key, { itemName: value.itemName, statName: value.statName, value: value.value });
    });

    return result;
  }

  getItem(slot: EquipmentSlot): EquippedItem | undefined {
    return this.equipped.get(slot);
  }

  getRarityRank(rarity: EquipmentRarity): number {
    return Object.keys(EQUIPMENT_CONFIG.RARITY).indexOf(rarity);
  }

  reset(): void {
    this.equipped.forEach((item) => {
      this.player.applyEquipmentBonus(item.statName, -item.value);
    });
    this.equipped.clear();
  }
}
