export type MapId = 'cursed-village' | 'shadow-forest' | 'abandoned-castle' | 'blood-moon-wasteland';

export interface GameMap {
  id: MapId;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  bgColors: number[];
  groundColor: number;
  groundPattern: 'plain' | 'dots' | 'grid' | 'crosses';
  enemySpeedMultiplier: number;
  enemyHpMultiplier: number;
  enemySpawnRateMultiplier: number;
  eliteIntervalMultiplier: number;
  bossIntervalMultiplier: number;
  xpMultiplier: number;
  coinMultiplier: number;
  bloodstoneMultiplier: number;
}

export const GAME_MAPS: GameMap[] = [
  {
    id: 'cursed-village',
    name: 'Cursed Village',
    emoji: '🏘️',
    description: 'The cursed village where it all began. Standard difficulty.',
    cost: 0,
    bgColors: [0x1a0a0a, 0x1a0a0a],
    groundColor: 0x2a1a1a,
    groundPattern: 'dots',
    enemySpeedMultiplier: 1.0,
    enemyHpMultiplier: 1.0,
    enemySpawnRateMultiplier: 1.0,
    eliteIntervalMultiplier: 1.0,
    bossIntervalMultiplier: 1.0,
    xpMultiplier: 1.0,
    coinMultiplier: 1.0,
    bloodstoneMultiplier: 1.0,
  },
  {
    id: 'shadow-forest',
    name: 'Shadow Forest',
    emoji: '🌲',
    description: 'Dark woods with more enemies. Increased rewards.',
    cost: 200,
    bgColors: [0x0a1a0a, 0x061206],
    groundColor: 0x1a2a1a,
    groundPattern: 'crosses',
    enemySpeedMultiplier: 1.15,
    enemyHpMultiplier: 1.2,
    enemySpawnRateMultiplier: 1.15,
    eliteIntervalMultiplier: 0.85,
    bossIntervalMultiplier: 1.0,
    xpMultiplier: 1.2,
    coinMultiplier: 1.5,
    bloodstoneMultiplier: 1.2,
  },
  {
    id: 'abandoned-castle',
    name: 'Abandoned Castle',
    emoji: '🏰',
    description: 'Ruined halls crawling with elites. High danger, high reward.',
    cost: 500,
    bgColors: [0x12111a, 0x0a0a12],
    groundColor: 0x1a1a2a,
    groundPattern: 'grid',
    enemySpeedMultiplier: 1.1,
    enemyHpMultiplier: 1.5,
    enemySpawnRateMultiplier: 1.1,
    eliteIntervalMultiplier: 0.8,
    bossIntervalMultiplier: 0.8,
    xpMultiplier: 1.5,
    coinMultiplier: 1.5,
    bloodstoneMultiplier: 1.5,
  },
  {
    id: 'blood-moon-wasteland',
    name: 'Blood Moon Wasteland',
    emoji: '🌙',
    description: 'Endless desolation. Maximum danger. Maximum rewards.',
    cost: 1000,
    bgColors: [0x1a0a1a, 0x120612],
    groundColor: 0x2a1a2a,
    groundPattern: 'plain',
    enemySpeedMultiplier: 1.3,
    enemyHpMultiplier: 2.0,
    enemySpawnRateMultiplier: 1.5,
    eliteIntervalMultiplier: 0.5,
    bossIntervalMultiplier: 0.6,
    xpMultiplier: 2.0,
    coinMultiplier: 2.0,
    bloodstoneMultiplier: 2.0,
  },
];

export const GAME_MAP_MAP: Record<MapId, GameMap> = Object.fromEntries(GAME_MAPS.map((map) => [map.id, map])) as Record<MapId, GameMap>;
