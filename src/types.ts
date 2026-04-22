export enum FacingDirection {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  Idle = 'idle',
}

export enum StatType {
  MaxHp = 'maxHp',
  Speed = 'speed',
  PickupRange = 'pickupRange',
  Damage = 'damage',
}

export const STAT_LABELS: Record<StatType, string> = {
  [StatType.MaxHp]: 'Max HP +10',
  [StatType.Speed]: 'Speed +15',
  [StatType.PickupRange]: 'Pickup Range +15',
  [StatType.Damage]: 'Damage +15%',
} as const;

export enum PassiveType {
  MoveSpeed = 'moveSpeed',
  HpRegen = 'hpRegen',
  DamageBonus = 'damageBonus',
  CritChance = 'critChance',
}

export const PASSIVE_LABELS: Record<PassiveType, string> = {
  [PassiveType.MoveSpeed]: 'Speed +10%',
  [PassiveType.HpRegen]: 'HP Regen +1/s',
  [PassiveType.DamageBonus]: 'Damage +10%',
  [PassiveType.CritChance]: 'Crit +5%',
} as const;

export type LevelUpChoice =
  | { kind: 'stat'; label: string; stat: StatType }
  | { kind: 'passive'; label: string; passive: PassiveType }
  | { kind: 'weaponUnlock'; label: string; weaponName: string }
  | { kind: 'weaponUpgrade'; label: string; weaponName: string }
  | { kind: 'evolution'; label: string; evolvedName: string; baseName: string };

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export type EquipmentRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type EquipmentStatName = 'damage' | 'maxHp' | 'hpRegen' | 'critChance';
