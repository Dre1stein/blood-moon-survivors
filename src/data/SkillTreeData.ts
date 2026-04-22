export type SkillId =
  | 'survival-hp' | 'survival-regen' | 'survival-invincibility'
  | 'attack-damage' | 'attack-crit-rate' | 'attack-crit-damage'
  | 'efficiency-xp' | 'efficiency-pickup' | 'efficiency-speed';

export type BranchId = 'survival' | 'attack' | 'efficiency';

export interface SkillNode {
  id: SkillId;
  branch: BranchId;
  name: string;
  description: string;
  maxLevel: 3;
  costPerLevel: number[];
  values: number[];
}

export interface SkillTreeState {
  [skillId: string]: number;
}

export const BRANCH_INFO: Record<BranchId, { name: string; color: number; emoji: string }> = {
  survival: { name: 'Survival', color: 0x44cc44, emoji: '❤️' },
  attack: { name: 'Attack', color: 0xcc4444, emoji: '⚔️' },
  efficiency: { name: 'Efficiency', color: 0x4488ff, emoji: '⚡' },
};

export const SKILL_NODES: SkillNode[] = [
  { id: 'survival-hp', branch: 'survival', name: 'HP Max', description: 'HP +{v}%', maxLevel: 3, costPerLevel: [10, 20, 40], values: [10, 20, 30] },
  { id: 'survival-regen', branch: 'survival', name: 'HP Regen', description: 'Regen +{v}/s', maxLevel: 3, costPerLevel: [10, 20, 40], values: [0.5, 1, 2] },
  { id: 'survival-invincibility', branch: 'survival', name: 'Shield', description: 'Invincible +{v}s', maxLevel: 3, costPerLevel: [15, 30, 50], values: [1, 2, 3] },
  { id: 'attack-damage', branch: 'attack', name: 'Damage Up', description: 'All Damage +{v}%', maxLevel: 3, costPerLevel: [10, 20, 40], values: [5, 10, 15] },
  { id: 'attack-crit-rate', branch: 'attack', name: 'Crit Rate', description: 'Crit +{v}%', maxLevel: 3, costPerLevel: [10, 20, 40], values: [3, 6, 10] },
  { id: 'attack-crit-damage', branch: 'attack', name: 'Crit Damage', description: 'Crit Dmg +{v}%', maxLevel: 3, costPerLevel: [15, 30, 50], values: [25, 50, 75] },
  { id: 'efficiency-xp', branch: 'efficiency', name: 'XP Boost', description: 'XP Gain +{v}%', maxLevel: 3, costPerLevel: [10, 20, 40], values: [10, 20, 30] },
  { id: 'efficiency-pickup', branch: 'efficiency', name: 'Pickup+', description: 'Pickup +{v}%', maxLevel: 3, costPerLevel: [10, 20, 40], values: [15, 30, 50] },
  { id: 'efficiency-speed', branch: 'efficiency', name: 'Speed Up', description: 'Speed +{v}%', maxLevel: 3, costPerLevel: [10, 20, 40], values: [5, 10, 15] },
];

export const SKILL_MAP = Object.fromEntries(SKILL_NODES.map((skill) => [skill.id, skill])) as Record<SkillId, SkillNode>;

export function isSkillId(value: unknown): value is SkillId {
  return typeof value === 'string' && value in SKILL_MAP;
}

export function getSkillLevel(state: SkillTreeState, skillId: SkillId): number {
  const level = state[skillId];
  return typeof level === 'number' && Number.isFinite(level) ? Math.max(0, Math.min(3, Math.floor(level))) : 0;
}

export function getSkillValue(skillId: SkillId, level: number): number {
  if (level <= 0) {
    return 0;
  }

  return SKILL_MAP[skillId].values[level - 1] ?? 0;
}
