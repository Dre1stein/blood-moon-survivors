import { EquipmentRarity, EquipmentSlot, EquipmentStatName } from '../types';

export interface EquipmentItem {
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  statName: EquipmentStatName;
  value: number;
  itemName: string;
  color: number;
}

export type EquipmentInventory = {
  owned: EquipmentItem[];
  equipped: Partial<Record<EquipmentSlot, number>>;
};

export function isSameItem(a: EquipmentItem, b: EquipmentItem): boolean {
  return a.slot === b.slot && a.rarity === b.rarity && a.itemName === b.itemName && a.value === b.value && a.statName === b.statName;
}
