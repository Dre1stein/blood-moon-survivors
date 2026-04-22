export type RuneType = 'fire' | 'ice' | 'thunder' | 'life' | 'dark';

export interface RuneInfo {
  type: RuneType;
  emoji: string;
  name: string;
  color: number;
  description: string;
  values: number[];
  costs: number[];
}

export interface OwnedRune {
  type: RuneType;
  level: number;
}

export type RuneLoadout = [RuneType | null, RuneType | null, RuneType | null];

export const RUNE_MAP: Record<RuneType, RuneInfo> = {
  fire: {
    type: 'fire',
    emoji: '🔥',
    name: 'Fire',
    color: 0xff7a33,
    description: 'Damage +{v}%',
    values: [5, 8, 12, 16, 20],
    costs: [30, 60, 100, 160, 250],
  },
  ice: {
    type: 'ice',
    emoji: '❄️',
    name: 'Ice',
    color: 0x7ac8ff,
    description: 'Armor +{v}',
    values: [1, 2, 3, 5, 8],
    costs: [25, 50, 80, 130, 200],
  },
  thunder: {
    type: 'thunder',
    emoji: '⚡',
    name: 'Thunder',
    color: 0xffdd44,
    description: 'Speed +{v}%',
    values: [5, 8, 12, 16, 20],
    costs: [30, 60, 100, 160, 250],
  },
  life: {
    type: 'life',
    emoji: '💚',
    name: 'Life',
    color: 0x55dd88,
    description: 'HP Regen +{v}/s',
    values: [0.5, 1, 1.5, 2, 3],
    costs: [25, 50, 80, 130, 200],
  },
  dark: {
    type: 'dark',
    emoji: '🌑',
    name: 'Dark',
    color: 0xaa66ff,
    description: 'Crit +{v}%',
    values: [3, 5, 8, 12, 15],
    costs: [35, 70, 120, 180, 280],
  },
};

export const RUNE_TYPES: RuneType[] = ['fire', 'ice', 'thunder', 'life', 'dark'];

export function getRuneBonusValue(type: RuneType, level: number): number {
  if (level <= 0) {
    return 0;
  }

  return RUNE_MAP[type].values[level - 1] ?? 0;
}

export function isRuneType(value: unknown): value is RuneType {
  return typeof value === 'string' && value in RUNE_MAP;
}
