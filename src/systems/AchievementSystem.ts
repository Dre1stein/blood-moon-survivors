import {
  ACHIEVEMENTS,
  AchievementId,
  AchievementProgressContext,
  AchievementState,
  createDefaultAchievementState,
  getAchievementProgress,
} from '../data/AchievementData';

type AchievementStats = AchievementState['stats'];

export class AchievementSystem {
  private state: AchievementState;

  constructor(initialState?: AchievementState) {
    this.state = AchievementSystem.cloneState(initialState ?? createDefaultAchievementState());
  }

  getState(): AchievementState {
    return AchievementSystem.cloneState(this.state);
  }

  unlock(id: AchievementId): boolean {
    if (this.state.unlocked.includes(id)) {
      return false;
    }

    this.state.unlocked.push(id);
    return true;
  }

  updateStats(partial: Partial<AchievementStats>): AchievementId[] {
    Object.entries(partial).forEach(([key, value]) => {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return;
      }

      if (key === 'maxLevelReached') {
        this.state.stats.maxLevelReached = Math.max(this.state.stats.maxLevelReached, Math.floor(value));
        return;
      }

      const statKey = key as keyof AchievementStats;
      this.state.stats[statKey] += Math.floor(value);
    });

    const newlyUnlocked = AchievementSystem.checkAchievements(this.state);
    newlyUnlocked.forEach((id) => {
      this.state.unlocked.push(id);
    });
    return newlyUnlocked;
  }

  checkContextAchievements(context: AchievementProgressContext): AchievementId[] {
    const newlyUnlocked = ACHIEVEMENTS
      .filter((achievement) => !this.state.unlocked.includes(achievement.id))
      .filter((achievement) => !AchievementSystem.isStatAchievement(achievement.id))
      .filter((achievement) => {
        const progress = getAchievementProgress(achievement.id, this.state, context);
        return typeof progress.target === 'number' && progress.value >= progress.target;
      })
      .map((achievement) => achievement.id);

    newlyUnlocked.forEach((id) => {
      this.state.unlocked.push(id);
    });
    return newlyUnlocked;
  }

  static checkAchievements(state: AchievementState): AchievementId[] {
    return ACHIEVEMENTS
      .filter((achievement) => !state.unlocked.includes(achievement.id))
      .filter((achievement) => AchievementSystem.isStatAchievement(achievement.id))
      .filter((achievement) => {
        const progress = getAchievementProgress(achievement.id, state);
        return typeof progress.target === 'number' && progress.value >= progress.target;
      })
      .map((achievement) => achievement.id);
  }

  private static isStatAchievement(id: AchievementId): boolean {
    return !['survival-master', 'all-characters', 'rune-master', 'skill-maxed'].includes(id);
  }

  private static cloneState(state: AchievementState): AchievementState {
    return {
      unlocked: [...state.unlocked],
      stats: { ...state.stats },
    };
  }
}
