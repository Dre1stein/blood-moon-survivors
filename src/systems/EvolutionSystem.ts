import { EVOLUTION_CONFIG } from '../constants';
import { PassiveType } from '../types';
import { PassiveSystem } from './PassiveSystem';
import { WeaponSystem } from './WeaponSystem';
import { createWeaponByName } from '../weapons/definitions';

export type EvolutionRecipe = (typeof EVOLUTION_CONFIG.RECIPES)[number];

export class EvolutionSystem {
  getAvailableRecipeNames(weaponSystem: WeaponSystem, passiveSystem: PassiveSystem): string[] {
    return EVOLUTION_CONFIG.RECIPES.filter((recipe) => this.canEvolve(recipe, weaponSystem, passiveSystem)).map((recipe) => recipe.weapon);
  }

  getRecipeForBase(baseName: string): EvolutionRecipe | undefined {
    return EVOLUTION_CONFIG.RECIPES.find((recipe) => recipe.weapon === baseName);
  }

  checkEvolutions(weaponSystem: WeaponSystem, passiveSystem: PassiveSystem): string | null {
    const recipe = EVOLUTION_CONFIG.RECIPES.find((entry) => this.canEvolve(entry, weaponSystem, passiveSystem));

    if (!recipe) {
      return null;
    }

    return this.evolve(recipe.weapon, weaponSystem, passiveSystem);
  }

  evolve(baseName: string, weaponSystem: WeaponSystem, passiveSystem: PassiveSystem): string | null {
    const recipe = this.getRecipeForBase(baseName);

    if (!recipe || !this.canEvolve(recipe, weaponSystem, passiveSystem)) {
      return null;
    }

    const evolvedWeapon = createWeaponByName(recipe.evolved);

    if (!evolvedWeapon) {
      return null;
    }

    weaponSystem.removeWeapon(recipe.weapon);

    if (!weaponSystem.addWeapon(evolvedWeapon)) {
      return null;
    }

    return recipe.evolved;
  }

  private canEvolve(recipe: EvolutionRecipe, weaponSystem: WeaponSystem, passiveSystem: PassiveSystem): boolean {
    const weapon = weaponSystem.getWeapon(recipe.weapon);

    if (!weapon || weapon.level < 5 || weaponSystem.hasWeapon(recipe.evolved)) {
      return false;
    }

    return passiveSystem.getPassiveLevel(recipe.passive as PassiveType) >= 3;
  }
}
