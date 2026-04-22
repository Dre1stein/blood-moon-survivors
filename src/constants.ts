export const PLAYER_CONFIG = {
  SPEED: 200,
  WIDTH: 24,
  HEIGHT: 32,
  COLOR: 0xcccccc,
} as const;

export const WORLD = {
  WIDTH: 800,
  HEIGHT: 600,
  BG_COLOR: 0x1a0a0a,
} as const;

export const ENEMY_CONFIG = {
  SPEED: 80,
  WIDTH: 20,
  HEIGHT: 20,
  COLOR: 0xaa2222,
  SPAWN_INTERVAL: 2000,
  MAX_ENEMIES: 50,
  DAMAGE: 8,
  SCORE_VALUE: 10,
  XP_VALUE: 10,
} as const;

export const ELITE_CONFIG = {
  SPAWN_INTERVAL: 30000,
  HP: 10,
  SPEED: 60,
  SIZE: 28,
  COLOR: 0xff4444,
  DAMAGE: 20,
  SCORE_VALUE: 50,
  XP_VALUE: 50,
  BORDER: '#ff0000',
} as const;

export const BOSS_CONFIG = {
  SPAWN_INTERVAL: 60000,
  TYPES: [
    { name: 'Blood Count', hp: 50, speed: 40, size: 40, color: 0x880000, damage: 25, score: 200, xp: 100, border: '#ff0000' },
    { name: 'Dark Witch', hp: 40, speed: 50, size: 36, color: 0x660066, damage: 30, score: 300, xp: 150, border: '#cc00cc' },
    { name: 'Blood Moon Lord', hp: 100, speed: 30, size: 48, color: 0x440000, damage: 40, score: 500, xp: 300, border: '#ff4444' },
  ],
} as const;

export const PLAYER_HP = {
  MAX: 100,
  INVINCIBILITY_MS: 1000,
  HIT_FLASH_COLOR: 0xff0000,
} as const;

export const HUD_CONFIG = {
  BAR_WIDTH: 200,
  BAR_HEIGHT: 16,
  BAR_PADDING: 4,
  HP_BAR_COLOR: 0xcc3333,
  HP_BAR_BG: 0x331111,
  XP_BAR_COLOR: 0x4488ff,
  XP_BAR_BG: 0x112244,
  POSITION_X: 16,
  POSITION_Y: 16,
  TEXT_COLOR: '#ffffff',
  LEVEL_COLOR: '#ffdd44',
  FONT_SIZE: '16px',
} as const;

export const XP_CONFIG = {
  GEM_SIZE: 10,
  GEM_COLOR: 0x4488ff,
  GEM_BORDER: '#2266cc',
  BASE_XP: 10,
  PICKUP_RANGE: 60,
  PICKUP_SPEED: 300,
  XP_TABLE: [
    0,
    10,
    25,
    45,
    70,
    100,
    140,
    190,
    250,
    320,
    420,
    540,
    690,
    870,
    1090,
    1350,
    1660,
    2030,
    2470,
    2990,
    3600,
  ],
  XP_SCALE_AFTER_TABLE: 150,
} as const;

export const LEVEL_CONFIG = {
  STAT_CHOICES: 3,
} as const;

export const WEAPON_CONFIG = {
  SILVER_BULLET: {
    COOLDOWN: 800,
    SPEED: 400,
    DAMAGE: 2,
    SIZE: 6,
    COLOR: 0xcccccc,
    LIFETIME: 2000,
    MAX_LEVEL: 5,
  },
  HOLY_CROSS: {
    COOLDOWN: 1500,
    COUNT: 1,
    DAMAGE: 2,
    SIZE: 14,
    COLOR: 0xffdd44,
    ORBIT_RADIUS: 60,
    ORBIT_SPEED: 3,
    MAX_LEVEL: 5,
  },
  HOLY_AURA: {
    COOLDOWN: 1500,
    DAMAGE: 1,
    RADIUS: 80,
    COLOR: 0x44aaff,
    DURATION: 500,
    MAX_LEVEL: 5,
  },
  HOLY_WATER: {
    COOLDOWN: 2000,
    SPEED: 250,
    DAMAGE: 2,
    SIZE: 10,
    COLOR: 0x44aaff,
    AOE_RADIUS: 50,
    LIFETIME: 1500,
    MAX_LEVEL: 5,
  },
  BLOOD_DAGGER: {
    COOLDOWN: 600,
    SPEED: 500,
    DAMAGE: 1,
    SIZE: 8,
    COLOR: 0xcc2222,
    PIERCE: 2,
    LIFETIME: 1000,
    MAX_LEVEL: 5,
  },
  THUNDER_HAMMER: {
    COOLDOWN: 3000,
    DAMAGE: 3,
    SIZE: 16,
    COLOR: 0xffff44,
    LIFETIME: 800,
    MAX_LEVEL: 5,
  },
  ICE_BARRIER: {
    COOLDOWN: 2000,
    DAMAGE: 1,
    RADIUS: 100,
    COLOR: 0x88ccff,
    FREEZE_MS: 1500,
    DURATION: 600,
    MAX_LEVEL: 5,
  },
  DEATH_GAZE: {
    COOLDOWN: 1200,
    DAMAGE: 1,
    LENGTH: 200,
    WIDTH: 12,
    COLOR: 0xaa44ff,
    DURATION: 400,
    MAX_LEVEL: 5,
  },
  SILVER_JUDGMENT: {
    COOLDOWN: 420,
    SPEED: 440,
    DAMAGE: 3,
    SIZE: 8,
    COLOR: 0xffaa00,
    LIFETIME: 2200,
    MAX_LEVEL: 5,
  },
  ANGEL_RING: {
    COOLDOWN: 2200,
    COUNT: 3,
    DAMAGE: 2,
    SIZE: 16,
    COLOR: 0xffee88,
    ORBIT_RADIUS: 92,
    ORBIT_SPEED: 4,
    BURST_RADIUS: 120,
    MAX_LEVEL: 5,
  },
  HOLY_FIRE_BAPTISM: {
    COOLDOWN: 1300,
    DAMAGE: 3,
    SIZE: 12,
    COLOR: 0xff6600,
    AOE_RADIUS: 72,
    LIFETIME: 1600,
    MAX_LEVEL: 5,
  },
  FOUNTAIN_OF_LIFE: {
    COOLDOWN: 1100,
    DAMAGE: 2,
    RADIUS: 110,
    COLOR: 0x44ff88,
    DURATION: 650,
    MAX_LEVEL: 5,
  },
  BLOOD_MOON_SLASH: {
    COOLDOWN: 420,
    SPEED: 560,
    DAMAGE: 1.5,
    SIZE: 10,
    COLOR: 0xff0044,
    PIERCE: 4,
    LIFETIME: 1200,
    MAX_LEVEL: 5,
  },
  WRATH_OF_THOR: {
    COOLDOWN: 2200,
    DAMAGE: 5,
    SIZE: 18,
    COLOR: 0xffff00,
    LIFETIME: 700,
    MAX_LEVEL: 5,
  },
} as const;

export const DROP_CONFIG = {
  HEALTH_GEM: {
    SIZE: 8,
    COLOR: 0x44ff44,
    HEAL_AMOUNT: 15,
    DROP_CHANCE: 0.15,
  },
  COIN: {
    SIZE: 8,
    COLOR: 0xffcc00,
    VALUE: 5,
    DROP_CHANCE: 0.3,
  },
  BLOODSTONE: {
    SIZE: 10,
    COLOR: 0xcc44cc,
    DROP_CHANCE: 0.12,
    VALUE: 3,
    ELITE_DROP_CHANCE: 0.5,
    BOSS_DROP_CHANCE: 1.0,
  },
} as const;

export const EQUIPMENT_CONFIG = {
  DROP_CHANCE: 0.05,
  ELITE_DROP_CHANCE: 0.25,
  BOSS_DROP_CHANCE: 1.0,
  SLOTS: ['weapon', 'armor', 'accessory'] as const,
  RARITY: {
    COMMON: { color: 0xcccccc, label: 'Common', multiplier: 1 },
    UNCOMMON: { color: 0x44cc44, label: 'Uncommon', multiplier: 1.5 },
    RARE: { color: 0x4488ff, label: 'Rare', multiplier: 2 },
    EPIC: { color: 0xaa44ff, label: 'Epic', multiplier: 3 },
    LEGENDARY: { color: 0xffaa00, label: 'Legendary', multiplier: 5 },
  },
  TYPES: {
    weapon: [
      { name: 'Hunter\'s Crossbow', stat: 'damage', value: 0.15 },
      { name: 'Cursed Blade', stat: 'damage', value: 0.25 },
    ],
    armor: [
      { name: 'Moonlight Cloak', stat: 'maxHp', value: 20 },
      { name: 'Shadow Vest', stat: 'maxHp', value: 40 },
    ],
    accessory: [
      { name: 'Blood Ruby', stat: 'hpRegen', value: 1 },
      { name: 'Lucky Charm', stat: 'critChance', value: 0.05 },
    ],
  },
} as const;

export const EVOLUTION_CONFIG = {
  RECIPES: [
    { weapon: 'SilverBullet', passive: 'critChance', evolved: 'SilverJudgment', label: 'Silver Judgment', color: 0xffaa00 },
    { weapon: 'HolyCross', passive: 'moveSpeed', evolved: 'AngelRing', label: 'Angel Ring', color: 0xffee88 },
    { weapon: 'HolyWater', passive: 'damageBonus', evolved: 'HolyFireBaptism', label: 'Holy Fire Baptism', color: 0xff6600 },
    { weapon: 'HolyAura', passive: 'hpRegen', evolved: 'FountainOfLife', label: 'Fountain of Life', color: 0x44ff88 },
    { weapon: 'BloodDagger', passive: 'critChance', evolved: 'BloodMoonSlash', label: 'Blood Moon Slash', color: 0xff0044 },
    { weapon: 'ThunderHammer', passive: 'damageBonus', evolved: 'WrathOfThor', label: 'Wrath of Thor', color: 0xffff00 },
  ],
} as const;

export const TIMER_CONFIG = {
  SURVIVAL_MINUTES: 30,
} as const;
