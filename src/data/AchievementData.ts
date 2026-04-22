import { CHARACTERS, CharacterId } from './CharacterData';
import { OwnedRune } from './RuneData';
import { BranchId, getSkillLevel, SKILL_NODES, SkillTreeState } from './SkillTreeData';

export type AchievementId =
  | 'first-awakening'
  | 'blood-hunter'
  | 'survival-master'
  | 'evolution-path'
  | 'coin-collector'
  | 'bloodstone-hoarder'
  | 'boss-slayer'
  | 'max-level'
  | 'all-characters'
  | 'legendary-gear'
  | 'rune-master'
  | 'skill-maxed';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
  emoji: string;
  reward: number;
  target?: number;
}

export interface AchievementState {
  unlocked: AchievementId[];
  stats: {
    totalKills: number;
    totalCoins: number;
    totalBloodstones: number;
    totalBossKills: number;
    runsCompleted: number;
    evolutionsTriggered: number;
    maxLevelReached: number;
    legendaryEquipmentFound: number;
  };
}

export interface AchievementProgressContext {
  unlockedCharacters?: CharacterId[];
  runes?: OwnedRune[];
  skillTree?: SkillTreeState;
}

export interface AchievementProgress {
  value: number;
  target?: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-awakening', name: '初次觉醒', description: '完成第一局。', emoji: '🌅', reward: 50, target: 1 },
  { id: 'blood-hunter', name: '血月猎人', description: '累计击杀 10000 只怪物。', emoji: '🩸', reward: 500, target: 10000 },
  { id: 'survival-master', name: '生存大师', description: '单局生存 30 分钟。', emoji: '⏳', reward: 200 },
  { id: 'evolution-path', name: '进化之路', description: '触发一次武器进化。', emoji: '✨', reward: 120, target: 1 },
  { id: 'coin-collector', name: '金币收藏家', description: '累计收集 500 枚金币。', emoji: '🪙', reward: 120, target: 500 },
  { id: 'bloodstone-hoarder', name: '血晶囤积者', description: '累计收集 200 颗血晶。', emoji: '💎', reward: 150, target: 200 },
  { id: 'boss-slayer', name: 'Boss 终结者', description: '累计击杀 10 个 Boss。', emoji: '👑', reward: 220, target: 10 },
  { id: 'max-level', name: '巅峰等级', description: '达到 30 级。', emoji: '📈', reward: 180, target: 30 },
  { id: 'all-characters', name: '群星集结', description: `解锁全部 ${CHARACTERS.length} 名角色。`, emoji: '🧛', reward: 250, target: CHARACTERS.length },
  { id: 'legendary-gear', name: '传奇装备', description: '获得一件传奇装备。', emoji: '🧰', reward: 160, target: 1 },
  { id: 'rune-master', name: '符文大师', description: '拥有任意 1 枚 5 级符文。', emoji: '🔮', reward: 200, target: 5 },
  { id: 'skill-maxed', name: '天赋极致', description: '将任意一个技能树分支的 3 个技能全部升满。', emoji: '🌳', reward: 220, target: 3 },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement])) as Record<AchievementId, AchievementDef>;

export function createDefaultAchievementState(): AchievementState {
  return {
    unlocked: [],
    stats: {
      totalKills: 0,
      totalCoins: 0,
      totalBloodstones: 0,
      totalBossKills: 0,
      runsCompleted: 0,
      evolutionsTriggered: 0,
      maxLevelReached: 0,
      legendaryEquipmentFound: 0,
    },
  };
}

export function getAchievementProgress(
  id: AchievementId,
  state: AchievementState,
  context: AchievementProgressContext = {}
): AchievementProgress {
  const target = ACHIEVEMENT_MAP[id].target;

  switch (id) {
    case 'first-awakening':
      return { value: state.stats.runsCompleted, target };
    case 'blood-hunter':
      return { value: state.stats.totalKills, target };
    case 'survival-master':
      return { value: state.unlocked.includes(id) ? 1 : 0 };
    case 'evolution-path':
      return { value: state.stats.evolutionsTriggered, target };
    case 'coin-collector':
      return { value: state.stats.totalCoins, target };
    case 'bloodstone-hoarder':
      return { value: state.stats.totalBloodstones, target };
    case 'boss-slayer':
      return { value: state.stats.totalBossKills, target };
    case 'max-level':
      return { value: state.stats.maxLevelReached, target };
    case 'all-characters':
      return { value: context.unlockedCharacters?.length ?? 0, target };
    case 'legendary-gear':
      return { value: state.stats.legendaryEquipmentFound, target };
    case 'rune-master':
      return {
        value: context.runes?.reduce((maxLevel, rune) => Math.max(maxLevel, rune.level), 0) ?? 0,
        target,
      };
    case 'skill-maxed':
      return { value: getMaxedBranchProgress(context.skillTree ?? {}), target };
  }
}

function getMaxedBranchProgress(skillTree: SkillTreeState): number {
  const branches: BranchId[] = ['survival', 'attack', 'efficiency'];

  return branches.reduce((best, branch) => {
    const count = SKILL_NODES
      .filter((node) => node.branch === branch)
      .reduce((total, node) => total + (getSkillLevel(skillTree, node.id) >= 3 ? 1 : 0), 0);

    return Math.max(best, count);
  }, 0);
}
