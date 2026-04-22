export type CharacterId = 'hunter' | 'mage' | 'ranger' | 'paladin' | 'werewolf';

export interface CharacterData {
  id: CharacterId;
  name: string;
  emoji: string;
  description: string;
  color: number;
  cost: number;
  bonuses: {
    speedMultiplier?: number;
    damageMultiplier?: number;
    maxHpBonus?: number;
    cooldownMultiplier?: number;
    pickupRangeMultiplier?: number;
    meleeDamageMultiplier?: number;
    rangedDamageMultiplier?: number;
    armor?: number;
  };
}

export const CHARACTERS: CharacterData[] = [
  {
    id: 'hunter',
    name: 'Hunter',
    emoji: '🏹',
    description: 'Balanced fighter.\nNo special bonuses.',
    color: 0xcccccc,
    cost: 0,
    bonuses: {},
  },
  {
    id: 'mage',
    name: 'Mage',
    emoji: '🧙',
    description: 'Cooldown -15%\nDamage +10%',
    color: 0x8844cc,
    cost: 200,
    bonuses: {
      cooldownMultiplier: 0.85,
      damageMultiplier: 1.1,
    },
  },
  {
    id: 'ranger',
    name: 'Ranger',
    emoji: '🏹',
    description: 'Speed +20%\nPickup Range +15%',
    color: 0x44aa44,
    cost: 500,
    bonuses: {
      speedMultiplier: 1.2,
      pickupRangeMultiplier: 1.15,
    },
  },
  {
    id: 'paladin',
    name: 'Paladin',
    emoji: '🛡️',
    description: 'HP +30\nArmor +10',
    color: 0xcccc44,
    cost: 400,
    bonuses: {
      maxHpBonus: 30,
      armor: 10,
    },
  },
  {
    id: 'werewolf',
    name: 'Werewolf',
    emoji: '🐺',
    description: 'Melee Damage +40%\nRanged Damage -10%',
    color: 0x886644,
    cost: 500,
    bonuses: {
      meleeDamageMultiplier: 1.4,
      rangedDamageMultiplier: 0.9,
    },
  },
];

export const CHARACTER_MAP: Record<CharacterId, CharacterData> = CHARACTERS.reduce(
  (map, character) => {
    map[character.id] = character;
    return map;
  },
  {} as Record<CharacterId, CharacterData>
);
