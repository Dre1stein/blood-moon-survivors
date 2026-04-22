import { ACHIEVEMENTS, AchievementId, AchievementState, createDefaultAchievementState } from '../data/AchievementData';
import { CharacterId } from '../data/CharacterData';
import { EquipmentInventory, EquipmentItem } from '../data/EquipmentData';
import { GAME_MAP_MAP, MapId } from '../data/MapData';
import { isRuneType, OwnedRune, RUNE_MAP, RuneLoadout, RuneType } from '../data/RuneData';
import { getSkillLevel, isSkillId, SkillId, SkillTreeState, SKILL_MAP } from '../data/SkillTreeData';
import { AchievementSystem } from './AchievementSystem';
import { EquipmentSlot } from '../types';

const SAVE_KEY = 'blood-moon-survivors';

export interface SaveData {
  coins: number;
  bloodstones: number;
  achievements: AchievementState;
  unlockedCharacters: CharacterId[];
  selectedCharacter: CharacterId;
  unlockedMaps: MapId[];
  selectedMap: MapId;
  skillTree: SkillTreeState;
  equipmentInventory: EquipmentInventory;
  runes: OwnedRune[];
  runeLoadout: RuneLoadout;
}

const DEFAULT_EQUIPMENT_INVENTORY: EquipmentInventory = {
  owned: [],
  equipped: {},
};

const DEFAULT_SAVE_DATA: SaveData = {
  coins: 0,
  bloodstones: 0,
  achievements: createDefaultAchievementState(),
  unlockedCharacters: ['hunter'],
  selectedCharacter: 'hunter',
  unlockedMaps: ['cursed-village'],
  selectedMap: 'cursed-village',
  skillTree: {},
  equipmentInventory: DEFAULT_EQUIPMENT_INVENTORY,
  runes: [],
  runeLoadout: [null, null, null],
};

const CHARACTER_IDS: CharacterId[] = ['hunter', 'mage', 'ranger', 'paladin', 'werewolf'];
const MAP_IDS: MapId[] = ['cursed-village', 'shadow-forest', 'abandoned-castle', 'blood-moon-wasteland'];
const EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];
const EQUIPMENT_RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
const EQUIPMENT_STAT_NAMES = ['damage', 'maxHp', 'hpRegen', 'critChance'] as const;

function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && CHARACTER_IDS.includes(value as CharacterId);
}

function isMapId(value: unknown): value is MapId {
  return typeof value === 'string' && MAP_IDS.includes(value as MapId);
}

function isEquipmentSlot(value: unknown): value is EquipmentSlot {
  return typeof value === 'string' && EQUIPMENT_SLOTS.includes(value as EquipmentSlot);
}

function isEquipmentItem(value: unknown): value is EquipmentItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<EquipmentItem>;

  return isEquipmentSlot(item.slot)
    && typeof item.rarity === 'string'
    && EQUIPMENT_RARITIES.includes(item.rarity)
    && typeof item.statName === 'string'
    && EQUIPMENT_STAT_NAMES.includes(item.statName)
    && typeof item.value === 'number'
    && Number.isFinite(item.value)
    && typeof item.itemName === 'string'
    && item.itemName.length > 0
    && typeof item.color === 'number'
    && Number.isFinite(item.color);
}

function isOwnedRune(value: unknown): value is OwnedRune {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const rune = value as Partial<OwnedRune>;

  return isRuneType(rune.type)
    && typeof rune.level === 'number'
    && Number.isInteger(rune.level)
    && rune.level >= 1
    && rune.level <= 5;
}

function isRuneLoadoutSlot(value: unknown): value is RuneType | null {
  return value === null || isRuneType(value);
}

export class SaveSystem {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);

      if (raw) {
        return this.normalize(JSON.parse(raw) as Partial<SaveData>);
      }
    } catch {
      // ignore storage errors
    }

    return this.normalize(DEFAULT_SAVE_DATA);
  }

  static save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }

  static addCoins(amount: number): SaveData {
    const data = this.load();
    data.coins += amount;
    this.save(data);
    return data;
  }

  static addBloodstones(amount: number): SaveData {
    const data = this.load();
    data.bloodstones += Math.max(0, Math.floor(amount));
    this.save(data);
    return data;
  }

  static unlockCharacter(id: CharacterId): SaveData {
    const data = this.load();

    if (!data.unlockedCharacters.includes(id)) {
      data.unlockedCharacters.push(id);
    }

    this.applyContextAchievements(data);

    this.save(data);
    return data;
  }

  static selectCharacter(id: CharacterId): void {
    const data = this.load();
    data.selectedCharacter = id;
    this.save(data);
  }

  static unlockMap(id: MapId): SaveData | null {
    const data = this.load();
    const map = GAME_MAP_MAP[id];

    if (!map) {
      return null;
    }

    if (data.unlockedMaps.includes(id)) {
      return data;
    }

    if (data.coins < map.cost) {
      return null;
    }

    data.coins -= map.cost;
    data.unlockedMaps.push(id);
    this.save(data);
    return data;
  }

  static selectMap(id: MapId): void {
    const data = this.load();

    if (!data.unlockedMaps.includes(id)) {
      return;
    }

    data.selectedMap = id;
    this.save(data);
  }

  static spendCoins(amount: number): SaveData | null {
    const data = this.load();

    if (data.coins < amount) {
      return null;
    }

    data.coins -= amount;
    this.save(data);
    return data;
  }

  static upgradeSkill(skillId: SkillId): SaveData | null {
    const data = this.load();
    const currentLevel = getSkillLevel(data.skillTree, skillId);
    const skill = isSkillId(skillId) ? skillId : null;

    if (!skill || currentLevel >= 3) {
      return null;
    }

    const cost = SKILL_MAP[skillId].costPerLevel[currentLevel];

    if (cost === undefined || data.bloodstones < cost) {
      return null;
    }

    data.bloodstones -= cost;
    data.skillTree[skillId] = currentLevel + 1;
    this.applyContextAchievements(data);
    this.save(data);
    return data;
  }

  static getAchievements(): AchievementState {
    const achievements = this.load().achievements;

    return {
      unlocked: [...achievements.unlocked],
      stats: { ...achievements.stats },
    };
  }

  static unlockAchievement(id: AchievementId): SaveData {
    const data = this.load();
    const achievementSystem = new AchievementSystem(data.achievements);
    achievementSystem.unlock(id);
    data.achievements = achievementSystem.getState();
    this.save(data);
    return data;
  }

  static updateAchievementStats(partial: Partial<AchievementState['stats']>): SaveData {
    const data = this.load();
    const achievementSystem = new AchievementSystem(data.achievements);
    achievementSystem.updateStats(partial);
    data.achievements = achievementSystem.getState();
    this.save(data);
    return data;
  }

  static getSkillTree(): SkillTreeState {
    return { ...this.load().skillTree };
  }

  static addEquipmentItem(item: EquipmentItem): SaveData {
    const data = this.load();
    data.equipmentInventory.owned.push(item);

    if (item.rarity === 'LEGENDARY') {
      const achievementSystem = new AchievementSystem(data.achievements);
      achievementSystem.updateStats({ legendaryEquipmentFound: 1 });
      data.achievements = achievementSystem.getState();
    }

    this.applyContextAchievements(data);
    this.save(data);
    return data;
  }

  static purchaseRune(type: RuneType): SaveData | null {
    const data = this.load();
    const cost = RUNE_MAP[type].costs[0];

    if (cost === undefined || data.coins < cost) {
      return null;
    }

    data.coins -= cost;
    data.runes.push({ type, level: 1 });
    this.applyContextAchievements(data);
    this.save(data);
    return data;
  }

  static mergeRunes(type: RuneType, level: number): SaveData | null {
    if (!Number.isInteger(level) || level < 1 || level >= 5) {
      return null;
    }

    const data = this.load();
    const matchingIndices = data.runes
      .map((rune, index) => (rune.type === type && rune.level === level ? index : -1))
      .filter((index) => index >= 0);

    if (matchingIndices.length < 3) {
      return null;
    }

    const indicesToRemove = new Set(matchingIndices.slice(0, 3));
    data.runes = data.runes.filter((_, index) => !indicesToRemove.has(index));
    data.runes.push({ type, level: level + 1 });
    this.applyContextAchievements(data);
    this.save(data);
    return data;
  }

  static equipRune(slotIndex: 0 | 1 | 2, runeIndex: number): SaveData {
    const data = this.load();

    if (runeIndex < 0 || runeIndex >= data.runes.length) {
      return data;
    }

    const rune = data.runes[runeIndex];

    if (!rune) {
      return data;
    }

    data.runeLoadout[slotIndex] = rune.type;
    this.save(data);
    return data;
  }

  static unequipRune(slotIndex: 0 | 1 | 2): SaveData {
    const data = this.load();
    data.runeLoadout[slotIndex] = null;
    this.save(data);
    return data;
  }

  static getRuneLoadout(): { type: RuneType; level: number }[] {
    const data = this.load();
    const remainingRunes = [...data.runes].sort((left, right) => right.level - left.level);

    return data.runeLoadout.flatMap((type) => {
      if (!type) {
        return [];
      }

      const index = remainingRunes.findIndex((rune) => rune.type === type);

      if (index < 0) {
        return [];
      }

      const [rune] = remainingRunes.splice(index, 1);
      return rune ? [rune] : [];
    });
  }

  static equipItem(slot: EquipmentSlot, index: number): SaveData {
    const data = this.load();

    if (index < 0 || index >= data.equipmentInventory.owned.length) {
      return data;
    }

    const item = data.equipmentInventory.owned[index];

    if (!item || item.slot !== slot) {
      return data;
    }

    data.equipmentInventory.equipped[slot] = index;
    this.save(data);
    return data;
  }

  static unequipItem(slot: EquipmentSlot): SaveData {
    const data = this.load();
    delete data.equipmentInventory.equipped[slot];
    this.save(data);
    return data;
  }

  static getEquippedItems(): EquipmentItem[] {
    const data = this.load();

    return EQUIPMENT_SLOTS.flatMap((slot) => {
      const index = data.equipmentInventory.equipped[slot];

      if (typeof index !== 'number') {
        return [];
      }

      const item = data.equipmentInventory.owned[index];
      return item?.slot === slot ? [item] : [];
    });
  }

  private static normalize(data: Partial<SaveData>): SaveData {
    const unlockedCharacters = Array.isArray(data.unlockedCharacters)
      ? data.unlockedCharacters.filter((characterId): characterId is CharacterId => isCharacterId(characterId))
      : [];

    if (!unlockedCharacters.includes('hunter')) {
      unlockedCharacters.unshift('hunter');
    }

    const selectedCharacter = isCharacterId(data.selectedCharacter) && unlockedCharacters.includes(data.selectedCharacter)
      ? data.selectedCharacter
      : 'hunter';
    const unlockedMaps = Array.isArray(data.unlockedMaps)
      ? data.unlockedMaps.filter((mapId): mapId is MapId => isMapId(mapId))
      : [];

    if (!unlockedMaps.includes('cursed-village')) {
      unlockedMaps.unshift('cursed-village');
    }

    const selectedMap = isMapId(data.selectedMap) && unlockedMaps.includes(data.selectedMap)
      ? data.selectedMap
      : 'cursed-village';

    const skillTree: SkillTreeState = {};

    Object.entries(data.skillTree ?? {}).forEach(([skillId, level]) => {
      if (!isSkillId(skillId)) {
        return;
      }

      const normalizedLevel = getSkillLevel({ [skillId]: level }, skillId);

      if (normalizedLevel > 0) {
        skillTree[skillId] = normalizedLevel;
      }
    });

    const owned = Array.isArray(data.equipmentInventory?.owned)
      ? data.equipmentInventory.owned.filter((item): item is EquipmentItem => isEquipmentItem(item))
      : [];
    const equipped: Partial<Record<EquipmentSlot, number>> = {};

    Object.entries(data.equipmentInventory?.equipped ?? {}).forEach(([slot, index]) => {
      if (!isEquipmentSlot(slot) || typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= owned.length) {
        return;
      }

      if (owned[index]?.slot !== slot) {
        return;
      }

      equipped[slot] = index;
    });

    const runes = Array.isArray(data.runes)
      ? data.runes.filter((rune): rune is OwnedRune => isOwnedRune(rune))
      : [];
    const normalizedLoadout = Array.isArray(data.runeLoadout) ? data.runeLoadout.slice(0, 3) : [];
    const runeLoadout: RuneLoadout = [null, null, null];

    normalizedLoadout.forEach((slot, index) => {
      if (index > 2 || !isRuneLoadoutSlot(slot)) {
        return;
      }

      runeLoadout[index] = slot;
    });

    return {
      coins: typeof data.coins === 'number' && Number.isFinite(data.coins) ? Math.max(0, Math.floor(data.coins)) : 0,
      bloodstones: typeof data.bloodstones === 'number' && Number.isFinite(data.bloodstones) ? Math.max(0, Math.floor(data.bloodstones)) : 0,
      achievements: this.normalizeAchievements(data.achievements),
      unlockedCharacters,
      selectedCharacter,
      unlockedMaps,
      selectedMap,
      skillTree,
      equipmentInventory: {
        owned,
        equipped,
      },
      runes,
      runeLoadout,
    };
  }

  private static normalizeAchievements(data: Partial<AchievementState> | undefined): AchievementState {
    const defaults = createDefaultAchievementState();
    const unlocked = Array.isArray(data?.unlocked)
      ? data.unlocked.filter((id): id is AchievementId => typeof id === 'string' && ACHIEVEMENTS.some((achievement) => achievement.id === id))
      : [];
    const stats: Partial<AchievementState['stats']> = data?.stats ?? {};

    return {
      unlocked: [...new Set(unlocked)],
      stats: {
        totalKills: this.normalizeAchievementNumber(stats.totalKills, defaults.stats.totalKills),
        totalCoins: this.normalizeAchievementNumber(stats.totalCoins, defaults.stats.totalCoins),
        totalBloodstones: this.normalizeAchievementNumber(stats.totalBloodstones, defaults.stats.totalBloodstones),
        totalBossKills: this.normalizeAchievementNumber(stats.totalBossKills, defaults.stats.totalBossKills),
        runsCompleted: this.normalizeAchievementNumber(stats.runsCompleted, defaults.stats.runsCompleted),
        evolutionsTriggered: this.normalizeAchievementNumber(stats.evolutionsTriggered, defaults.stats.evolutionsTriggered),
        maxLevelReached: this.normalizeAchievementNumber(stats.maxLevelReached, defaults.stats.maxLevelReached),
        legendaryEquipmentFound: this.normalizeAchievementNumber(stats.legendaryEquipmentFound, defaults.stats.legendaryEquipmentFound),
      },
    };
  }

  private static normalizeAchievementNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
  }

  private static applyContextAchievements(data: SaveData): void {
    const achievementSystem = new AchievementSystem(data.achievements);
    achievementSystem.checkContextAchievements({
      unlockedCharacters: data.unlockedCharacters,
      runes: data.runes,
      skillTree: data.skillTree,
    });
    data.achievements = achievementSystem.getState();
  }
}
