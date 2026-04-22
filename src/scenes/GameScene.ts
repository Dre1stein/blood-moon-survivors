import Phaser from 'phaser';
import { DROP_CONFIG, ELITE_CONFIG, ENEMY_CONFIG, EQUIPMENT_CONFIG, HUD_CONFIG, LEVEL_CONFIG, TIMER_CONFIG, WORLD } from '../constants';
import { ACHIEVEMENT_MAP, AchievementId, AchievementState } from '../data/AchievementData';
import { CHARACTER_MAP, CharacterData } from '../data/CharacterData';
import { EquipmentItem } from '../data/EquipmentData';
import { GAME_MAP_MAP, GameMap, MapId } from '../data/MapData';
import { getRuneBonusValue } from '../data/RuneData';
import { getSkillLevel, getSkillValue, SkillTreeState } from '../data/SkillTreeData';
import { Bloodstone } from '../entities/Bloodstone';
import { Boss } from '../entities/Boss';
import { Coin } from '../entities/Coin';
import { EquipmentBox } from '../entities/EquipmentBox';
import { EliteEnemy } from '../entities/EliteEnemy';
import { HealthGem } from '../entities/HealthGem';
import { Player } from '../entities/Player';
import { XPGem } from '../entities/XPGem';
import { EnemySpawner } from '../systems/EnemySpawner';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { EvolutionSystem } from '../systems/EvolutionSystem';
import { LevelSystem } from '../systems/LevelSystem';
import { PassiveSystem } from '../systems/PassiveSystem';
import { ParticleManager } from '../systems/ParticleManager';
import { SaveSystem } from '../systems/SaveSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { VirtualJoystick } from '../systems/VirtualJoystick';
import { EquipmentSlot, LevelUpChoice, PASSIVE_LABELS, PassiveType, STAT_LABELS, StatType } from '../types';
import { BASE_WEAPON_DEFINITIONS, getWeaponDefinition } from '../weapons/definitions';

type EnemyDrop = {
  x: number;
  y: number;
  value: number;
};

type KillDrop = {
  x: number;
  y: number;
  scoreValue: number;
};

type BossKillDrop = KillDrop & {
  bossName: string;
};

type PickupItem = XPGem | HealthGem | Coin | Bloodstone | EquipmentBox;

export class GameScene extends Phaser.Scene {
  static readonly KEY = 'GameScene';

  private player?: Player;
  private enemySpawner?: EnemySpawner;
  private levelSystem!: LevelSystem;
  private passiveSystem!: PassiveSystem;
  private xpGems?: Phaser.Physics.Arcade.Group;
  private healthGems?: Phaser.Physics.Arcade.Group;
  private coins?: Phaser.Physics.Arcade.Group;
  private bloodstones?: Phaser.Physics.Arcade.Group;
  private equipmentBoxes?: Phaser.Physics.Arcade.Group;
  private hpBarFill?: Phaser.GameObjects.Rectangle;
  private xpBarBg?: Phaser.GameObjects.Rectangle;
  private xpBarFill?: Phaser.GameObjects.Rectangle;
  private hpText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private coinText?: Phaser.GameObjects.Text;
  private bloodstoneText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Rectangle;
  private gameOverTitle?: Phaser.GameObjects.Text;
  private gameOverScore?: Phaser.GameObjects.Text;
  private gameOverPrompt?: Phaser.GameObjects.Text;
  private levelUpOverlay?: Phaser.GameObjects.Rectangle;
  private levelUpTitle?: Phaser.GameObjects.Text;
  private levelUpChoices: Phaser.GameObjects.Container[] = [];
  private weaponIndicators: Phaser.GameObjects.Rectangle[] = [];
  private equipmentIndicators: Partial<Record<EquipmentSlot, Phaser.GameObjects.Rectangle>> = {};
  private weaponSystem!: WeaponSystem;
  private equipmentSystem?: EquipmentSystem;
  private evolutionSystem!: EvolutionSystem;
  private particleManager!: ParticleManager;
  private score = 0;
  private coinCount = 0;
  private bloodstoneCount = 0;
  private isGameOver = false;
  private isPaused = false;
  private gameTime = 0;
  private pendingLevelUps = 0;
  private selectedCharacter: CharacterData = CHARACTER_MAP.hunter;
  private currentMap: GameMap = GAME_MAP_MAP['cursed-village'];
  private achievementState: AchievementState = SaveSystem.getAchievements();
  private damageFlash?: Phaser.GameObjects.Rectangle;
  private joystick?: VirtualJoystick;

  private lastHpStr = '';
  private lastLevelStr = '';
  private lastScoreStr = '';
  private lastCoinStr = '';
  private lastBloodstoneStr = '';
  private lastTimerStr = '';

  constructor() {
    super(GameScene.KEY);
  }

  init(data?: { character?: CharacterData; mapId?: MapId }): void {
    const saveData = SaveSystem.load();
    this.selectedCharacter = data?.character ?? CHARACTER_MAP[saveData.selectedCharacter];
    this.currentMap = GAME_MAP_MAP[data?.mapId ?? saveData.selectedMap] ?? GAME_MAP_MAP['cursed-village'];
  }

  create(): void {
    this.score = 0;
    this.coinCount = 0;
    this.bloodstoneCount = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.gameTime = 0;
    this.pendingLevelUps = 0;
    this.achievementState = SaveSystem.getAchievements();
    this.lastHpStr = '';
    this.lastLevelStr = '';
    this.lastScoreStr = '';
    this.lastCoinStr = '';
    this.lastBloodstoneStr = '';
    this.lastTimerStr = '';
    this.levelSystem = new LevelSystem();
    this.levelSystem.reset();
    this.passiveSystem = new PassiveSystem();
    this.passiveSystem.reset();
    this.weaponSystem = new WeaponSystem();
    this.evolutionSystem = new EvolutionSystem();
    this.particleManager = new ParticleManager(this);

    this.cameras.main.setBackgroundColor(this.currentMap.bgColors[0] ?? WORLD.BG_COLOR);
    this.physics.world.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.createMapBackground();

    this.player = Player.fromScene(this, WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5);
    this.player.applyCharacter(this.selectedCharacter);
    this.applySkillTreeBonuses(SaveSystem.getSkillTree());
    this.xpGems = this.physics.add.group({ classType: XPGem, maxSize: 300, allowGravity: false });
    this.healthGems = this.physics.add.group({ classType: HealthGem, maxSize: 50, allowGravity: false });
    this.coins = this.physics.add.group({ classType: Coin, maxSize: 100, allowGravity: false });
    this.bloodstones = this.physics.add.group({ classType: Bloodstone, maxSize: 80, allowGravity: false });
    this.equipmentBoxes = this.physics.add.group({ allowGravity: false });
    this.enemySpawner = new EnemySpawner(this);
    this.enemySpawner.setMapConfig(this.currentMap);
    this.enemySpawner.start();
    this.weaponSystem.addWeapon(BASE_WEAPON_DEFINITIONS[0].create());
    this.equipmentSystem = new EquipmentSystem(this.player);
    this.applyPersistentEquipmentLoadout();
    this.applyRuneBonuses();

    this.physics.add.overlap(this.player, this.enemySpawner.getGroup(), this.handlePlayerHit, undefined, this);
    this.events.on('enemy-killed', this.handleEnemyKilled, this);
    this.events.on('elite-killed', this.handleEliteKilled, this);
    this.events.on('boss-killed', this.handleBossKilled, this);
    this.events.on('enemy-drop-xp', this.handleEnemyDropXp, this);
    this.events.on('xp-collected', this.handleXpCollected, this);
    this.events.on('health-collected', this.handleHealthCollected, this);
    this.events.on('coin-collected', this.handleCoinCollected, this);
    this.events.on('bloodstone-collected', this.handleBloodstoneCollected, this);
    this.events.on('equipment-collected', this.handleEquipmentCollected, this);
    this.events.once('player-died', this.handlePlayerDied, this);
    this.events.on('damage-dealt', this.handleDamageDealt, this);

    this.createHud();
    this.createGameOverOverlay();
    this.refreshWeaponIndicators();
    this.joystick = new VirtualJoystick(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  update(_time: number, delta: number): void {
    if (!this.isGameOver && !this.isPaused) {
      this.gameTime += delta;
      this.checkRunAchievements();
    }

    if (!this.isPaused) {
      this.player?.update(delta);
    }

    if (this.player && this.joystick?.isActive() && !this.isPaused) {
      const { x, y } = this.joystick.getDirection();
      const body = this.player.body;
      if (body instanceof Phaser.Physics.Arcade.Body && (x !== 0 || y !== 0)) {
        const velocity = new Phaser.Math.Vector2(x, y).normalize().scale(this.player.speed);
        body.setVelocity(velocity.x, velocity.y);
      }
    }

    if (this.player && this.enemySpawner && !this.isGameOver && !this.isPaused) {
      this.enemySpawner.update(this.player.x, this.player.y);
      this.weaponSystem.update(delta, this, this.player, this.enemySpawner.getGroup());
    }

    if (!this.isGameOver && !this.isPaused) {
      this.updateAllPickups();
    }

    this.updateHud();
  }

  private createHud(): void {
    const depth = 100;
    const hpBarX = HUD_CONFIG.POSITION_X;
    const hpBarY = HUD_CONFIG.POSITION_Y + 24;
    const xpBarY = hpBarY + HUD_CONFIG.BAR_HEIGHT + HUD_CONFIG.BAR_PADDING;

    // Add semi-transparent HUD background panel
    this.add.rectangle(HUD_CONFIG.POSITION_X - 8, HUD_CONFIG.POSITION_Y - 4, HUD_CONFIG.BAR_WIDTH + 16, 90, 0x000000, 0.45)
      .setOrigin(0, 0)
      .setDepth(depth - 1)
      .setScrollFactor(0);

    // Create damage flash overlay
    this.damageFlash = this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0xff0000, 0)
      .setDepth(150)
      .setScrollFactor(0);

    this.add
      .rectangle(hpBarX, hpBarY, HUD_CONFIG.BAR_WIDTH, HUD_CONFIG.BAR_HEIGHT, HUD_CONFIG.HP_BAR_BG)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setScrollFactor(0);

    this.hpBarFill = this.add
      .rectangle(hpBarX, hpBarY, HUD_CONFIG.BAR_WIDTH, HUD_CONFIG.BAR_HEIGHT, HUD_CONFIG.HP_BAR_COLOR)
      .setOrigin(0, 0)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.xpBarBg = this.add
      .rectangle(hpBarX, xpBarY, HUD_CONFIG.BAR_WIDTH, HUD_CONFIG.BAR_HEIGHT, HUD_CONFIG.XP_BAR_BG)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setScrollFactor(0);

    this.xpBarFill = this.add
      .rectangle(hpBarX, xpBarY, HUD_CONFIG.BAR_WIDTH, HUD_CONFIG.BAR_HEIGHT, HUD_CONFIG.XP_BAR_COLOR)
      .setOrigin(0, 0)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.hpText = this.add
      .text(HUD_CONFIG.POSITION_X, HUD_CONFIG.POSITION_Y, '', {
        color: HUD_CONFIG.TEXT_COLOR,
        fontSize: HUD_CONFIG.FONT_SIZE,
      })
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.levelText = this.add
      .text(HUD_CONFIG.POSITION_X, xpBarY + HUD_CONFIG.BAR_HEIGHT + HUD_CONFIG.BAR_PADDING, '', {
        color: HUD_CONFIG.LEVEL_COLOR,
        fontSize: HUD_CONFIG.FONT_SIZE,
      })
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(WORLD.WIDTH - HUD_CONFIG.POSITION_X, HUD_CONFIG.POSITION_Y, '', {
        color: HUD_CONFIG.TEXT_COLOR,
        fontSize: HUD_CONFIG.FONT_SIZE,
      })
      .setOrigin(1, 0)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.coinText = this.add
      .text(WORLD.WIDTH - HUD_CONFIG.POSITION_X, HUD_CONFIG.POSITION_Y + 22, '', {
        color: '#ffcc44',
        fontSize: HUD_CONFIG.FONT_SIZE,
      })
      .setOrigin(1, 0)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.bloodstoneText = this.add
      .text(WORLD.WIDTH - HUD_CONFIG.POSITION_X, HUD_CONFIG.POSITION_Y + 44, '', {
        color: '#dd66ff',
        fontSize: HUD_CONFIG.FONT_SIZE,
      })
      .setOrigin(1, 0)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.timerText = this.add
      .text(WORLD.WIDTH * 0.5, HUD_CONFIG.POSITION_Y + 4, '', {
        color: HUD_CONFIG.TEXT_COLOR,
        fontSize: HUD_CONFIG.FONT_SIZE,
      })
      .setOrigin(0.5, 0)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    (EQUIPMENT_CONFIG.SLOTS as readonly EquipmentSlot[]).forEach((slot, index) => {
      this.equipmentIndicators[slot] = this.add
        .rectangle(WORLD.WIDTH - HUD_CONFIG.POSITION_X - 12 - index * 18, WORLD.HEIGHT - 18, 12, 12, 0x1d1d1d)
        .setStrokeStyle(2, 0x666666)
        .setDepth(depth + 1)
        .setScrollFactor(0);
    });

    this.updateHud();
    this.refreshEquipmentIndicators();
  }

  private createGameOverOverlay(): void {
    const depth = 200;

    this.overlay = this.add
      .rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0x000000, 0.7)
      .setDepth(depth)
      .setScrollFactor(0)
      .setVisible(false);

    this.gameOverTitle = this.add
      .text(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5 - 48, 'GAME OVER', {
        color: '#ffffff',
        fontSize: '40px',
      })
      .setOrigin(0.5)
      .setDepth(depth + 1)
      .setScrollFactor(0)
      .setVisible(false);

this.gameOverScore = this.add
  .text(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5 - 16, '', {
    color: '#ffffff',
    fontSize: '24px',
    align: 'center',
  })
  .setOrigin(0.5)
  .setDepth(depth + 1)
  .setScrollFactor(0)
  .setVisible(false);

    this.gameOverPrompt = this.add
      .text(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5 + 40, 'Press R to Restart', {
        color: '#ffffff',
        fontSize: '18px',
      })
      .setOrigin(0.5)
      .setDepth(depth + 1)
      .setScrollFactor(0)
      .setVisible(false);
  }

private handlePlayerHit(
  playerObject:
    | Phaser.Physics.Arcade.Body
    | Phaser.Physics.Arcade.StaticBody
    | Phaser.Tilemaps.Tile
    | Phaser.Types.Physics.Arcade.GameObjectWithBody,
  enemyObject:
    | Phaser.Physics.Arcade.Body
    | Phaser.Physics.Arcade.StaticBody
    | Phaser.Tilemaps.Tile
    | Phaser.Types.Physics.Arcade.GameObjectWithBody
): void {
  if (this.isGameOver || this.isPaused) {
    return;
  }

  const player = playerObject as Player;
  const enemy = enemyObject as Boss | EliteEnemy;
  const damage = enemy instanceof Boss ? enemy.damage : enemy instanceof EliteEnemy ? ELITE_CONFIG.DAMAGE : ENEMY_CONFIG.DAMAGE;
  this.particleManager.hitEffect(player.x, player.y, 0xff4444);
  player.takeDamage(damage);

  // Add subtle screen flash on damage
  this.damageFlash?.setAlpha(0.15);
  this.tweens.add({
    targets: this.damageFlash,
    alpha: 0,
    duration: 200,
  });
}

  private handleEnemyKilled(drop: KillDrop): void {
    this.score += drop.scoreValue;
    this.trackAchievementStats({ totalKills: 1 });
    this.particleManager.deathEffect(drop.x, drop.y);
    this.rollDrops(drop.x, drop.y, 'normal');
    this.updateHud();
  }

  private handleEliteKilled(drop: KillDrop): void {
    this.score += drop.scoreValue;
    this.trackAchievementStats({ totalKills: 1 });
    this.particleManager.deathEffect(drop.x, drop.y);
    this.rollDrops(drop.x, drop.y, 'elite');
    this.updateHud();
  }

  private handleBossKilled(drop: BossKillDrop): void {
    this.score += drop.scoreValue;
    this.trackAchievementStats({ totalKills: 1, totalBossKills: 1 });
    this.particleManager.bossDeathEffect(drop.x, drop.y);
    this.rollDrops(drop.x, drop.y, 'boss');
    this.showNotification(`${drop.bossName} defeated`, '#ff6666');
    this.updateHud();
  }

  private handleEnemyDropXp(drop: EnemyDrop): void {
    if (!this.xpGems) {
      return;
    }

    const gem = this.xpGems.get(drop.x, drop.y);
    if (gem instanceof XPGem) {
      gem.spawn(drop.x, drop.y, drop.value);
    } else {
      this.xpGems.add(XPGem.fromScene(this, drop.x, drop.y, drop.value));
    }
  }

  private handleDamageDealt(amount: number): void {
    if (!this.player || this.player.hp <= 0) {
      return;
    }

    const lifesteal = this.player.getLifeStealPercent();

    if (lifesteal > 0) {
      this.player.heal(amount * lifesteal);
    }
  }

  private handleXpCollected(value: number): void {
    if (this.player) {
      this.particleManager.xpCollectEffect(this.player.x, this.player.y);
    }

    const xpMultiplier = this.currentMap.xpMultiplier * (this.player?.getXpMultiplier() ?? 1);
    const leveledUp = this.levelSystem.addXp(value * xpMultiplier);
    this.trackAchievementStats({ maxLevelReached: this.levelSystem.level });

    if (!leveledUp) {
      this.updateHud();
      return;
    }

    if (this.isPaused) {
      this.pendingLevelUps += 1;
      return;
    }

    if (this.player) {
      this.particleManager.levelUpEffect(this.player.x, this.player.y);
    }

    this.showLevelUp();
  }

  private handleHealthCollected(): void {
    if (this.player) {
      this.particleManager.healEffect(this.player.x, this.player.y);
    }

    this.updateHud();
  }

  private handleCoinCollected(value: number): void {
    const adjustedValue = Math.max(1, Math.round(value * this.currentMap.coinMultiplier));
    this.coinCount += adjustedValue;
    this.score += adjustedValue;
    this.updateHud();
  }

  private handleBloodstoneCollected(value: number): void {
    this.bloodstoneCount += Math.max(1, Math.round(value * this.currentMap.bloodstoneMultiplier));
    this.updateHud();
  }

  private createMapBackground(): void {
    const [topColor, bottomColor] = this.currentMap.bgColors.length >= 2
      ? [this.currentMap.bgColors[0] ?? WORLD.BG_COLOR, this.currentMap.bgColors[1] ?? WORLD.BG_COLOR]
      : [this.currentMap.bgColors[0] ?? WORLD.BG_COLOR, this.currentMap.bgColors[0] ?? WORLD.BG_COLOR];
    const patternColor = this.adjustColor(this.currentMap.groundColor, 26);
    const borderColor = this.adjustColor(this.currentMap.groundColor, 42);

    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.25, WORLD.WIDTH, WORLD.HEIGHT * 0.5, topColor);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.75, WORLD.WIDTH, WORLD.HEIGHT * 0.5, bottomColor);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, this.currentMap.groundColor, 0.38);
    this.createGroundPattern(patternColor);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT)
      .setStrokeStyle(2, borderColor, 1);
  }

  private createGroundPattern(patternColor: number): void {
    switch (this.currentMap.groundPattern) {
      case 'dots':
        for (let index = 0; index < 42; index += 1) {
          this.add.image(Phaser.Math.Between(12, WORLD.WIDTH - 12), Phaser.Math.Between(12, WORLD.HEIGHT - 12), 'ground-dot')
            .setTint(patternColor)
            .setAlpha(0.22);
        }
        break;
      case 'crosses':
        for (let index = 0; index < 36; index += 1) {
          this.add.image(Phaser.Math.Between(18, WORLD.WIDTH - 18), Phaser.Math.Between(18, WORLD.HEIGHT - 18), 'ground-cross')
            .setTint(patternColor)
            .setAlpha(0.18)
            .setRotation(Phaser.Math.FloatBetween(-0.25, 0.25));
        }
        break;
      case 'grid': {
        const grid = this.add.graphics();
        grid.lineStyle(1, patternColor, 0.22);

        for (let x = 0; x <= WORLD.WIDTH; x += 48) {
          grid.lineBetween(x, 0, x, WORLD.HEIGHT);
        }

        for (let y = 0; y <= WORLD.HEIGHT; y += 48) {
          grid.lineBetween(0, y, WORLD.WIDTH, y);
        }
        break;
      }
      case 'plain':
        break;
    }
  }

  private adjustColor(color: number, amount: number): number {
    const rgb = Phaser.Display.Color.IntegerToRGB(color);
    return Phaser.Display.Color.GetColor(
      Phaser.Math.Clamp(rgb.r + amount, 0, 255),
      Phaser.Math.Clamp(rgb.g + amount, 0, 255),
      Phaser.Math.Clamp(rgb.b + amount, 0, 255)
    );
  }

  private handleEquipmentCollected(box: EquipmentBox): void {
    const equipmentSystem = this.equipmentSystem;
    const previousUnlocked = [...this.achievementState.unlocked];

    if (!equipmentSystem) {
      return;
    }

    const collectedItem: EquipmentItem = {
      slot: box.slot,
      rarity: box.rarity,
      statName: box.statName,
      value: box.value,
      itemName: box.itemName,
      color: box.color,
    };

    SaveSystem.addEquipmentItem(collectedItem);
    this.achievementState = SaveSystem.getAchievements();
    this.handleNewAchievements(this.collectNewAchievements(previousUnlocked));
    this.showNotification(`${box.itemName} (${EQUIPMENT_CONFIG.RARITY[box.rarity].label}) saved!`, '#ffdd88');

    const existing = equipmentSystem.getItem(box.slot);

    if (!existing || equipmentSystem.getRarityRank(box.rarity) > equipmentSystem.getRarityRank(existing.rarity)) {
      equipmentSystem.equip(box.slot, box.statName, box.value, box.itemName, box.rarity, box.color);
      this.refreshEquipmentIndicators();
      this.showNotification(`${box.itemName} equipped`, `#${box.color.toString(16).padStart(6, '0')}`);
      this.updateHud();
      return;
    }

    this.showNotification(`${box.itemName} discarded`, '#bbbbbb');
  }

  private handlePlayerDied(): void {
    this.trackAchievementStats({
      totalCoins: this.coinCount,
      totalBloodstones: this.bloodstoneCount,
      runsCompleted: 1,
      maxLevelReached: this.levelSystem.level,
    });
    SaveSystem.addCoins(this.coinCount);
    SaveSystem.addBloodstones(this.bloodstoneCount);
    this.isGameOver = true;
    this.isPaused = true;
    this.enemySpawner?.stop();
    this.physics.pause();

    this.overlay?.setVisible(true);
    this.gameOverTitle?.setVisible(true);
    const lines = [
      `⚔️ Level ${this.levelSystem.level}`,
      `💀 Score: ${this.score}`,
      `🪙 Coins: ${this.coinCount}`,
      `💎 Bloodstones: ${this.bloodstoneCount}`,
      `⏱️ Time: ${this.formatTime(this.gameTime)}`,
    ];
    this.gameOverScore?.setText(lines.join('\n')).setVisible(true);
    this.gameOverPrompt?.setText('Press R to continue').setVisible(true);
    this.hideLevelUpOverlay();

    this.input.keyboard?.once('keydown-R', () => {
      this.scene.start('CharacterSelectScene');
    });
  }

  private updateHud(): void {
    if (!this.player) {
      return;
    }

    const ratio = Phaser.Math.Clamp(this.player.hp / this.player.maxHp, 0, 1);
    this.hpBarFill?.setDisplaySize(HUD_CONFIG.BAR_WIDTH * ratio, HUD_CONFIG.BAR_HEIGHT);
    this.xpBarFill?.setDisplaySize(HUD_CONFIG.BAR_WIDTH * this.levelSystem.getLevelProgress(), HUD_CONFIG.BAR_HEIGHT);

    let hpStr = `HP: ${Math.ceil(this.player.hp)}/${this.player.maxHp}`;
    if (hpStr !== this.lastHpStr) { this.hpText?.setText(hpStr); this.lastHpStr = hpStr; }

    let levelStr = `Level ${this.levelSystem.level}  XP ${this.levelSystem.currentXp}/${this.levelSystem.xpToNextLevel}`;
    if (levelStr !== this.lastLevelStr) { this.levelText?.setText(levelStr); this.lastLevelStr = levelStr; }

    let scoreStr = `Score: ${this.score}`;
    if (scoreStr !== this.lastScoreStr) { this.scoreText?.setText(scoreStr); this.lastScoreStr = scoreStr; }

    let coinStr = `Coins: ${this.coinCount}`;
    if (coinStr !== this.lastCoinStr) { this.coinText?.setText(coinStr); this.lastCoinStr = coinStr; }

    let bsStr = `Bloodstones: ${this.bloodstoneCount}`;
    if (bsStr !== this.lastBloodstoneStr) { this.bloodstoneText?.setText(bsStr); this.lastBloodstoneStr = bsStr; }

    let timerStr = this.formatTime(this.gameTime);
    if (timerStr !== this.lastTimerStr) { this.timerText?.setText(timerStr); this.lastTimerStr = timerStr; }

    this.refreshEquipmentIndicators();
  }

  private handleShutdown(): void {
    this.events.off('enemy-killed', this.handleEnemyKilled, this);
    this.events.off('elite-killed', this.handleEliteKilled, this);
    this.events.off('boss-killed', this.handleBossKilled, this);
    this.events.off('enemy-drop-xp', this.handleEnemyDropXp, this);
    this.events.off('xp-collected', this.handleXpCollected, this);
    this.events.off('health-collected', this.handleHealthCollected, this);
    this.events.off('coin-collected', this.handleCoinCollected, this);
    this.events.off('bloodstone-collected', this.handleBloodstoneCollected, this);
    this.events.off('equipment-collected', this.handleEquipmentCollected, this);
    this.events.off('player-died', this.handlePlayerDied, this);
    this.events.off('damage-dealt', this.handleDamageDealt, this);
    this.enemySpawner?.destroy();
    this.joystick?.destroy();
    this.weaponSystem.reset();
    this.xpGems?.destroy(true);
    this.healthGems?.destroy(true);
    this.coins?.destroy(true);
    this.bloodstones?.destroy(true);
    this.equipmentBoxes?.destroy(true);
    this.weaponIndicators.forEach((indicator) => indicator.destroy());
    this.weaponIndicators = [];
    Object.values(this.equipmentIndicators).forEach((indicator) => indicator?.destroy());
    this.equipmentIndicators = {};
    this.hideLevelUpOverlay();
  }

  private updateAllPickups(): void {
    const player = this.player;
    if (!player || !player.active) {
      return;
    }

    const px = player.x;
    const py = player.y;
    const rangeSq = player.pickupRange * player.pickupRange;

    const groups: (Phaser.Physics.Arcade.Group | undefined)[] = [
      this.xpGems, this.healthGems, this.coins, this.bloodstones, this.equipmentBoxes,
    ];

    for (const group of groups) {
      if (!group) {
        continue;
      }

      const entries = group.children.entries;

      for (let i = entries.length - 1; i >= 0; i--) {
        const item = entries[i] as PickupItem;

        if (!item.active) {
          group.remove(item, false, false);
          continue;
        }

        if (item.isCollected) {
          continue;
        }

        const dx = item.x - px;
        const dy = item.y - py;

        if (dx * dx + dy * dy <= rangeSq) {
          item.collect(player);
        }
      }
    }
  }

  private showLevelUp(): void {
    this.isPaused = true;
    this.levelSystem.isPaused = true;
    this.physics.pause();

    if (!this.levelUpOverlay) {
      this.levelUpOverlay = this.add
        .rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0x000000, 0.8)
        .setDepth(200)
        .setScrollFactor(0);
    }

    this.levelUpOverlay.setVisible(true);
    this.clearLevelUpChoices();

    if (this.levelUpTitle) {
      this.levelUpTitle.destroy();
    }

    this.levelUpTitle = this.add
      .text(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5 - 120, 'LEVEL UP', {
        color: HUD_CONFIG.LEVEL_COLOR,
        fontSize: '32px',
      })
      .setOrigin(0.5)
      .setDepth(201)
      .setScrollFactor(0);

    const choices = Phaser.Utils.Array.Shuffle(this.buildLevelUpChoices()).slice(0, LEVEL_CONFIG.STAT_CHOICES);

    choices.forEach((choice, index) => {
      const item = this.createLevelUpChoice(choice, index);
      this.levelUpChoices.push(item);
    });
  }

  private buildLevelUpChoices(): LevelUpChoice[] {
    const choices: LevelUpChoice[] = Object.values(StatType).map((stat) => ({
      kind: 'stat',
      label: STAT_LABELS[stat],
      stat,
    }));

    Object.values(PassiveType).forEach((passive) => {
      const level = this.passiveSystem.getPassiveLevel(passive);

      if (level < 3) {
        choices.push({
          kind: 'passive',
          passive,
          label: `${PASSIVE_LABELS[passive]} (Lv ${level + 1})`,
        });
      }
    });

    const weaponCount = this.weaponSystem.getWeaponCount();

    BASE_WEAPON_DEFINITIONS.forEach((definition) => {
      const weapon = this.weaponSystem.getWeapon(definition.name);
      const evolvedVersionEquipped = this.weaponSystem.getWeapons().some((ownedWeapon) => getWeaponDefinition(ownedWeapon.name)?.evolvedFrom === definition.name);

      if (evolvedVersionEquipped) {
        return;
      }

      if (!weapon && weaponCount < 6) {
        choices.push({
          kind: 'weaponUnlock',
          weaponName: definition.name,
          label: `New Weapon: ${definition.label}`,
        });
        return;
      }

      if (weapon && weapon.level < definition.maxLevel) {
        choices.push({
          kind: 'weaponUpgrade',
          weaponName: definition.name,
          label: `Upgrade ${definition.label} Lv ${weapon.level + 1}`,
        });
      }
    });

    this.evolutionSystem.getAvailableRecipeNames(this.weaponSystem, this.passiveSystem).forEach((baseName) => {
      const weapon = this.weaponSystem.getWeapon(baseName);
      const definition = getWeaponDefinition(baseName);
      const evolvedDefinition = definition ? getWeaponDefinition(this.evolutionSystem.getRecipeForBase(baseName)?.evolved ?? '') : undefined;

      if (!weapon || !definition || !evolvedDefinition) {
        return;
      }

      choices.push({
        kind: 'evolution',
        baseName,
        evolvedName: evolvedDefinition.name,
        label: `Evolve ${definition.label} → ${evolvedDefinition.label}`,
      });
    });

    return choices;
  }

  private createLevelUpChoice(choice: LevelUpChoice, index: number): Phaser.GameObjects.Container {
    const width = 320;
    const height = 72;
    const y = WORLD.HEIGHT * 0.5 - 20 + index * 76;
    const background = this.add.rectangle(0, 0, width, height, 0x221811, 0.95).setStrokeStyle(2, 0xffdd44);
    const label = this.add
      .text(0, 0, choice.label, {
        color: '#ffdd44',
        fontSize: '20px',
        align: 'center',
      })
      .setOrigin(0.5);

    const container = this.add.container(WORLD.WIDTH * 0.5, y, [background, label]).setDepth(201).setScrollFactor(0);

    container
      .setSize(width, height)
      .setInteractive(new Phaser.Geom.Rectangle(-width * 0.5, -height * 0.5, width, height), Phaser.Geom.Rectangle.Contains)
      .on('pointerover', () => {
        background.setFillStyle(0x3a2617, 1);
      })
      .on('pointerout', () => {
        background.setFillStyle(0x221811, 0.95);
      })
      .on('pointerdown', () => {
        this.applyLevelUpChoice(choice);
      });

    return container;
  }

  private applyLevelUpChoice(choice: LevelUpChoice): void {
    switch (choice.kind) {
      case 'stat':
        this.player?.applyStatBoost(choice.stat);
        break;
      case 'passive':
        if (this.passiveSystem.addPassive(choice.passive) && this.player) {
          this.player.applyPassive(choice.passive, this.passiveSystem);
        } else if (this.player) {
          this.player.applyPassive(choice.passive, this.passiveSystem);
        }
        break;
      case 'weaponUnlock': {
        const definition = getWeaponDefinition(choice.weaponName);

        if (definition) {
          this.weaponSystem.addWeapon(definition.create());
          this.refreshWeaponIndicators();
        }
        break;
      }
      case 'weaponUpgrade': {
        const weapon = this.weaponSystem.getWeapon(choice.weaponName);
        weapon?.upgrade();
        this.refreshWeaponIndicators();
        break;
      }
      case 'evolution':
        break;
    }

    const evolvedName = choice.kind === 'evolution'
      ? this.evolutionSystem.evolve(choice.baseName, this.weaponSystem, this.passiveSystem)
      : this.evolutionSystem.checkEvolutions(this.weaponSystem, this.passiveSystem);

    if (evolvedName) {
      const evolvedDefinition = getWeaponDefinition(evolvedName);
      this.trackAchievementStats({ evolutionsTriggered: 1 });
      this.refreshWeaponIndicators();
      this.showNotification(`${evolvedDefinition?.label ?? evolvedName} evolved!`, `#${(evolvedDefinition?.color ?? 0xffaa00).toString(16).padStart(6, '0')}`);
    }

    this.hideLevelUpOverlay();

    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
      this.showLevelUp();
      return;
    }

    this.isPaused = false;
    this.levelSystem.isPaused = false;

    if (!this.isGameOver) {
      this.physics.resume();
    }

    this.updateHud();
  }

  private refreshWeaponIndicators(): void {
    this.weaponIndicators.forEach((indicator) => indicator.destroy());
    this.weaponIndicators = [];

    this.weaponSystem.getWeapons().forEach((weapon, index) => {
      const definition = getWeaponDefinition(weapon.name);

      if (!definition) {
        return;
      }

      const indicator = this.add
        .rectangle(HUD_CONFIG.POSITION_X + index * 18, WORLD.HEIGHT - 18, 12, 12, definition.color)
        .setOrigin(0, 0.5)
        .setStrokeStyle(2, 0xffffff)
        .setDepth(101)
        .setScrollFactor(0);

      this.weaponIndicators.push(indicator);
    });
  }

  private refreshEquipmentIndicators(): void {
    const equipmentSystem = this.equipmentSystem;

    if (!equipmentSystem) {
      return;
    }

    (EQUIPMENT_CONFIG.SLOTS as readonly EquipmentSlot[]).forEach((slot) => {
      const indicator = this.equipmentIndicators[slot];
      const item = equipmentSystem.getItem(slot);

      if (!indicator) {
        return;
      }

      indicator.setFillStyle(item?.color ?? 0x1d1d1d, 1);
      indicator.setStrokeStyle(2, item ? 0xffffff : 0x666666);
    });
  }

  private clearLevelUpChoices(): void {
    this.levelUpChoices.forEach((choice) => {
      choice.destroy(true);
    });
    this.levelUpChoices = [];
  }

  private hideLevelUpOverlay(): void {
    this.levelUpOverlay?.setVisible(false);
    this.levelUpTitle?.destroy();
    this.levelUpTitle = undefined;
    this.clearLevelUpChoices();
  }

  private rollDrops(x: number, y: number, tier: 'normal' | 'elite' | 'boss'): void {
    if (this.healthGems) {
      const healthChance = tier === 'boss'
        ? 1
        : tier === 'elite'
          ? Math.min(1, DROP_CONFIG.HEALTH_GEM.DROP_CHANCE * 2)
          : DROP_CONFIG.HEALTH_GEM.DROP_CHANCE;

      if (Math.random() < healthChance) {
        const gem = this.healthGems.get(x, y);
        if (gem instanceof HealthGem) {
          gem.spawn(x, y);
        } else {
          this.healthGems.add(HealthGem.fromScene(this, x, y));
        }
      }
    }

    if (!this.coins) {
      return;
    }

    const coinChance = tier === 'boss'
      ? 1
      : tier === 'elite'
        ? Math.min(1, DROP_CONFIG.COIN.DROP_CHANCE * 2)
        : DROP_CONFIG.COIN.DROP_CHANCE;

    if (Math.random() < coinChance || tier !== 'normal') {
      const coinX = x + (tier === 'normal' ? 0 : 8);
      const coin = this.coins.get(coinX, y);
      if (coin instanceof Coin) {
        coin.spawn(coinX, y);
      } else {
        this.coins.add(Coin.fromScene(this, coinX, y));
      }
    }

    if (this.bloodstones) {
      const bloodstoneChance = tier === 'boss'
        ? DROP_CONFIG.BLOODSTONE.BOSS_DROP_CHANCE
        : tier === 'elite'
          ? DROP_CONFIG.BLOODSTONE.ELITE_DROP_CHANCE
          : DROP_CONFIG.BLOODSTONE.DROP_CHANCE;

      if (Math.random() < bloodstoneChance) {
        const bsX = x + Phaser.Math.Between(-12, 12);
        const bsY = y + Phaser.Math.Between(-12, 12);
        const bs = this.bloodstones.get(bsX, bsY);
        if (bs instanceof Bloodstone) {
          bs.spawn(bsX, bsY);
        } else {
          this.bloodstones.add(Bloodstone.fromScene(this, bsX, bsY));
        }
      }
    }

    this.rollEquipmentDrop(x, y, tier);
  }

  private applySkillTreeBonuses(skillTree: SkillTreeState): void {
    const player = this.player;

    if (!player) {
      return;
    }

    const hpBonus = getSkillValue('survival-hp', getSkillLevel(skillTree, 'survival-hp'));
    const regenBonus = getSkillValue('survival-regen', getSkillLevel(skillTree, 'survival-regen'));
    const invincibilityBonus = getSkillValue('survival-invincibility', getSkillLevel(skillTree, 'survival-invincibility'));
    const damageBonus = getSkillValue('attack-damage', getSkillLevel(skillTree, 'attack-damage'));
    const critRateBonus = getSkillValue('attack-crit-rate', getSkillLevel(skillTree, 'attack-crit-rate'));
    const critDamageBonus = getSkillValue('attack-crit-damage', getSkillLevel(skillTree, 'attack-crit-damage'));
    const xpBonus = getSkillValue('efficiency-xp', getSkillLevel(skillTree, 'efficiency-xp'));
    const pickupBonus = getSkillValue('efficiency-pickup', getSkillLevel(skillTree, 'efficiency-pickup'));
    const speedBonus = getSkillValue('efficiency-speed', getSkillLevel(skillTree, 'efficiency-speed'));

    if (hpBonus > 0) {
      player.maxHp *= 1 + hpBonus / 100;
      player.hp = player.maxHp;
    }

    if (regenBonus > 0) {
      player.addHpRegenBonus(regenBonus);
    }

    if (invincibilityBonus > 0) {
      player.grantInvincibility(invincibilityBonus);
    }

    if (damageBonus > 0) {
      player.applyDamageMultiplier(1 + damageBonus / 100);
    }

    if (critRateBonus > 0) {
      player.addCritChanceBonus(critRateBonus / 100);
    }

    if (critDamageBonus > 0) {
      player.critDamageMultiplier += critDamageBonus / 100;
    }

    if (xpBonus > 0) {
      this.levelSystem.xpMultiplier = 1 + xpBonus / 100;
    }

    if (pickupBonus > 0) {
      player.applyPickupRangeMultiplier(1 + pickupBonus / 100);
    }

    if (speedBonus > 0) {
      player.applySpeedMultiplier(1 + speedBonus / 100);
    }
  }

  private applyPersistentEquipmentLoadout(): void {
    const equipmentSystem = this.equipmentSystem;

    if (!equipmentSystem) {
      return;
    }

    SaveSystem.getEquippedItems().forEach((item) => {
      equipmentSystem.equip(item.slot, item.statName, item.value, item.itemName, item.rarity, item.color);
    });
  }

  private applyRuneBonuses(): void {
    const player = this.player;

    if (!player) {
      return;
    }

    SaveSystem.getRuneLoadout().forEach((rune) => {
      const value = getRuneBonusValue(rune.type, rune.level);

      switch (rune.type) {
        case 'fire':
          player.applyDamageMultiplier(1 + value / 100);
          break;
        case 'ice':
          player.armor += value;
          break;
        case 'thunder':
          player.applySpeedMultiplier(1 + value / 100);
          break;
        case 'life':
          player.addHpRegenBonus(value);
          break;
        case 'dark':
          player.addCritChanceBonus(value / 100);
          break;
      }
    });
  }

  private rollEquipmentDrop(x: number, y: number, tier: 'normal' | 'elite' | 'boss'): void {
    if (!this.equipmentBoxes) {
      return;
    }

    const chance = tier === 'boss'
      ? EQUIPMENT_CONFIG.BOSS_DROP_CHANCE
      : tier === 'elite'
        ? EQUIPMENT_CONFIG.ELITE_DROP_CHANCE
        : EQUIPMENT_CONFIG.DROP_CHANCE;

    if (Math.random() > chance) {
      return;
    }

    const slot = EQUIPMENT_CONFIG.SLOTS[Phaser.Math.Between(0, EQUIPMENT_CONFIG.SLOTS.length - 1)] as EquipmentSlot;
    const rarity = this.rollEquipmentRarity(tier);
    const itemPool = EQUIPMENT_CONFIG.TYPES[slot];
    const item = itemPool[Phaser.Math.Between(0, itemPool.length - 1)];
    const rarityData = EQUIPMENT_CONFIG.RARITY[rarity];
    this.equipmentBoxes.add(
      EquipmentBox.fromScene(
        this,
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        slot,
        rarity,
        item.stat,
        item.value * rarityData.multiplier,
        item.name,
        rarityData.color
      )
    );
  }

  private rollEquipmentRarity(tier: 'normal' | 'elite' | 'boss'): keyof typeof EQUIPMENT_CONFIG.RARITY {
    const roll = Math.random();

    if (tier === 'boss') {
      if (roll < 0.15) {
        return 'LEGENDARY';
      }

      if (roll < 0.45) {
        return 'EPIC';
      }

      return 'RARE';
    }

    if (tier === 'elite') {
      if (roll < 0.1) {
        return 'EPIC';
      }

      if (roll < 0.35) {
        return 'RARE';
      }

      if (roll < 0.7) {
        return 'UNCOMMON';
      }

      return 'COMMON';
    }

    if (roll < 0.05) {
      return 'RARE';
    }

    if (roll < 0.25) {
      return 'UNCOMMON';
    }

    return 'COMMON';
  }

  private showNotification(message: string, color: string): void {
    const notification = this.add.text(WORLD.WIDTH * 0.5, WORLD.HEIGHT - 64, message, {
      color,
      fontSize: '18px',
      stroke: '#000000',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(220)
      .setScrollFactor(0);

    this.tweens.add({
      targets: notification,
      y: notification.y - 24,
      alpha: 0,
      duration: 900,
      onComplete: () => notification.destroy(),
    });
  }

  private formatTime(timeMs: number): string {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private trackAchievementStats(partial: Partial<AchievementState['stats']>): void {
    const previousUnlocked = [...this.achievementState.unlocked];
    const updated = SaveSystem.updateAchievementStats(partial);
    this.achievementState = updated.achievements;
    this.handleNewAchievements(this.collectNewAchievements(previousUnlocked));
  }

  private checkRunAchievements(): void {
    if (this.gameTime >= TIMER_CONFIG.SURVIVAL_MINUTES * 60_000) {
      this.tryUnlockAchievement('survival-master');
    }
  }

  private tryUnlockAchievement(id: AchievementId): void {
    if (this.achievementState.unlocked.includes(id)) {
      return;
    }

    const previousUnlocked = [...this.achievementState.unlocked];
    const updated = SaveSystem.unlockAchievement(id);
    this.achievementState = updated.achievements;
    this.handleNewAchievements(this.collectNewAchievements(previousUnlocked));
  }

  private collectNewAchievements(previousUnlocked: AchievementId[]): AchievementId[] {
    return this.achievementState.unlocked.filter((id) => !previousUnlocked.includes(id));
  }

  private handleNewAchievements(ids: AchievementId[]): void {
    ids.forEach((id) => {
      const achievement = ACHIEVEMENT_MAP[id];
      SaveSystem.addCoins(achievement.reward);
      this.showNotification(`🏆 Achievement Unlocked: ${achievement.name}! +${achievement.reward} coins`, '#ffcc44');
    });
  }
}
