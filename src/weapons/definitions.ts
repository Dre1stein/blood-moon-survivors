import { EVOLUTION_CONFIG, WEAPON_CONFIG } from '../constants';
import { BloodMoonSlash } from './BloodMoonSlash';
import { BloodDagger } from './BloodDagger';
import { DeathGaze } from './DeathGaze';
import { FountainOfLife } from './FountainOfLife';
import { HolyAura } from './HolyAura';
import { HolyCross } from './HolyCross';
import { HolyFireBaptism } from './HolyFireBaptism';
import { HolyWater } from './HolyWater';
import { IceBarrier } from './IceBarrier';
import { SilverBullet } from './SilverBullet';
import { SilverJudgment } from './SilverJudgment';
import { ThunderHammer } from './ThunderHammer';
import { Weapon } from './Weapon';
import { AngelRing } from './AngelRing';
import { WrathOfThor } from './WrathOfThor';

export type WeaponDefinition = {
  name: string;
  label: string;
  color: number;
  maxLevel: number;
  create: () => Weapon;
  evolvedFrom?: string;
};

export const WEAPON_DEFINITIONS: WeaponDefinition[] = [
  { name: 'SilverBullet', label: 'Silver Bullet', color: WEAPON_CONFIG.SILVER_BULLET.COLOR, maxLevel: WEAPON_CONFIG.SILVER_BULLET.MAX_LEVEL, create: () => new SilverBullet() },
  { name: 'HolyWater', label: 'Holy Water', color: WEAPON_CONFIG.HOLY_WATER.COLOR, maxLevel: WEAPON_CONFIG.HOLY_WATER.MAX_LEVEL, create: () => new HolyWater() },
  { name: 'HolyCross', label: 'Holy Cross', color: WEAPON_CONFIG.HOLY_CROSS.COLOR, maxLevel: WEAPON_CONFIG.HOLY_CROSS.MAX_LEVEL, create: () => new HolyCross() },
  { name: 'HolyAura', label: 'Holy Aura', color: WEAPON_CONFIG.HOLY_AURA.COLOR, maxLevel: WEAPON_CONFIG.HOLY_AURA.MAX_LEVEL, create: () => new HolyAura() },
  { name: 'BloodDagger', label: 'Blood Dagger', color: WEAPON_CONFIG.BLOOD_DAGGER.COLOR, maxLevel: WEAPON_CONFIG.BLOOD_DAGGER.MAX_LEVEL, create: () => new BloodDagger() },
  { name: 'ThunderHammer', label: 'Thunder Hammer', color: WEAPON_CONFIG.THUNDER_HAMMER.COLOR, maxLevel: WEAPON_CONFIG.THUNDER_HAMMER.MAX_LEVEL, create: () => new ThunderHammer() },
  { name: 'IceBarrier', label: 'Ice Barrier', color: WEAPON_CONFIG.ICE_BARRIER.COLOR, maxLevel: WEAPON_CONFIG.ICE_BARRIER.MAX_LEVEL, create: () => new IceBarrier() },
  { name: 'DeathGaze', label: 'Death Gaze', color: WEAPON_CONFIG.DEATH_GAZE.COLOR, maxLevel: WEAPON_CONFIG.DEATH_GAZE.MAX_LEVEL, create: () => new DeathGaze() },
  { name: 'SilverJudgment', label: 'Silver Judgment', color: WEAPON_CONFIG.SILVER_JUDGMENT.COLOR, maxLevel: WEAPON_CONFIG.SILVER_JUDGMENT.MAX_LEVEL, create: () => new SilverJudgment(), evolvedFrom: 'SilverBullet' },
  { name: 'AngelRing', label: 'Angel Ring', color: WEAPON_CONFIG.ANGEL_RING.COLOR, maxLevel: WEAPON_CONFIG.ANGEL_RING.MAX_LEVEL, create: () => new AngelRing(), evolvedFrom: 'HolyCross' },
  { name: 'HolyFireBaptism', label: 'Holy Fire Baptism', color: WEAPON_CONFIG.HOLY_FIRE_BAPTISM.COLOR, maxLevel: WEAPON_CONFIG.HOLY_FIRE_BAPTISM.MAX_LEVEL, create: () => new HolyFireBaptism(), evolvedFrom: 'HolyWater' },
  { name: 'FountainOfLife', label: 'Fountain of Life', color: WEAPON_CONFIG.FOUNTAIN_OF_LIFE.COLOR, maxLevel: WEAPON_CONFIG.FOUNTAIN_OF_LIFE.MAX_LEVEL, create: () => new FountainOfLife(), evolvedFrom: 'HolyAura' },
  { name: 'BloodMoonSlash', label: 'Blood Moon Slash', color: WEAPON_CONFIG.BLOOD_MOON_SLASH.COLOR, maxLevel: WEAPON_CONFIG.BLOOD_MOON_SLASH.MAX_LEVEL, create: () => new BloodMoonSlash(), evolvedFrom: 'BloodDagger' },
  { name: 'WrathOfThor', label: 'Wrath of Thor', color: WEAPON_CONFIG.WRATH_OF_THOR.COLOR, maxLevel: WEAPON_CONFIG.WRATH_OF_THOR.MAX_LEVEL, create: () => new WrathOfThor(), evolvedFrom: 'ThunderHammer' },
];

export const BASE_WEAPON_DEFINITIONS = WEAPON_DEFINITIONS.filter((definition) => !definition.evolvedFrom);

export const EVOLVED_WEAPON_NAMES = new Set(EVOLUTION_CONFIG.RECIPES.map((recipe) => recipe.evolved));

export function getWeaponDefinition(name: string): WeaponDefinition | undefined {
  return WEAPON_DEFINITIONS.find((definition) => definition.name === name);
}

export function createWeaponByName(name: string): Weapon | undefined {
  return getWeaponDefinition(name)?.create();
}
