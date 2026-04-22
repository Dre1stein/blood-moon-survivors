import Phaser from 'phaser';
import { XP_CONFIG } from '../constants';

export class LevelSystem {
  level = 1;
  currentXp = 0;
  xpToNextLevel = 0;
  isPaused = false;
  xpMultiplier = 1;

  constructor() {
    this.reset();
  }

  getXpToLevel(level: number): number {
    const tableValue = XP_CONFIG.XP_TABLE[level - 1];

    if (tableValue !== undefined) {
      return tableValue;
    }

    const lastTableLevel = XP_CONFIG.XP_TABLE.length;
    const lastTableValue = XP_CONFIG.XP_TABLE[lastTableLevel - 1];
    return lastTableValue + (level - lastTableLevel) * XP_CONFIG.XP_SCALE_AFTER_TABLE;
  }

  addXp(amount: number): boolean {
    this.currentXp += Math.max(0, Math.round(amount * this.xpMultiplier));

    if (this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.level += 1;
      this.xpToNextLevel = this.getXpToLevel(this.level + 1);
      return true;
    }

    return false;
  }

  getLevelProgress(): number {
    if (this.xpToNextLevel <= 0) {
      return 0;
    }

    return Phaser.Math.Clamp(this.currentXp / this.xpToNextLevel, 0, 1);
  }

  reset(): void {
    this.level = 1;
    this.currentXp = 0;
    this.xpToNextLevel = this.getXpToLevel(this.level + 1);
    this.isPaused = false;
    this.xpMultiplier = 1;
  }
}
