import { PassiveType } from '../types';

const MAX_PASSIVE_LEVEL = 3;

export class PassiveSystem {
  private readonly passives = new Map<PassiveType, number>();

  addPassive(type: PassiveType): boolean {
    const currentLevel = this.getPassiveLevel(type);

    if (currentLevel >= MAX_PASSIVE_LEVEL) {
      return false;
    }

    this.passives.set(type, currentLevel + 1);
    return currentLevel === 0;
  }

  getPassiveLevel(type: PassiveType): number {
    return this.passives.get(type) ?? 0;
  }

  getMoveSpeedMultiplier(): number {
    return 1 + this.getPassiveLevel(PassiveType.MoveSpeed) * 0.1;
  }

  getHpRegenPerSecond(): number {
    return this.getPassiveLevel(PassiveType.HpRegen);
  }

  getDamageMultiplier(): number {
    return 1 + this.getPassiveLevel(PassiveType.DamageBonus) * 0.1;
  }

  getCritChance(): number {
    return this.getPassiveLevel(PassiveType.CritChance) * 0.05;
  }

  reset(): void {
    this.passives.clear();
  }
}
