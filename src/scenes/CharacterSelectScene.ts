import Phaser from 'phaser';
import { CHARACTER_MAP, CHARACTERS, CharacterData, CharacterId } from '../data/CharacterData';
import { ACHIEVEMENT_MAP, AchievementId } from '../data/AchievementData';
import { WORLD } from '../constants';
import { GAME_MAP_MAP } from '../data/MapData';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { AchievementScene } from './AchievementScene';
import { EquipmentScene } from './EquipmentScene';
import { GameScene } from './GameScene';
import { MapSelectScene } from './MapSelectScene';
import { RuneScene } from './RuneScene';
import { SkillTreeScene } from './SkillTreeScene';

type CharacterCard = {
  character: CharacterData;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  lockOverlay: Phaser.GameObjects.Rectangle;
  lockText: Phaser.GameObjects.Text;
};

export class CharacterSelectScene extends Phaser.Scene {
  static readonly KEY = 'CharacterSelectScene';

  private saveData!: SaveData;
  private selectedCharacterId: CharacterId = 'hunter';
  private coinText?: Phaser.GameObjects.Text;
  private startButtonBg?: Phaser.GameObjects.Rectangle;
  private equipmentButtonBg?: Phaser.GameObjects.Rectangle;
  private skillTreeButtonBg?: Phaser.GameObjects.Rectangle;
  private runeButtonBg?: Phaser.GameObjects.Rectangle;
  private achievementButtonBg?: Phaser.GameObjects.Rectangle;
  private mapButtonBg?: Phaser.GameObjects.Rectangle;
  private cards: CharacterCard[] = [];

  constructor() {
    super(CharacterSelectScene.KEY);
  }

  create(): void {
    this.saveData = SaveSystem.load();
    this.selectedCharacterId = this.saveData.selectedCharacter;

    this.cameras.main.setBackgroundColor(0x100814);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0x100814);

    this.add.text(WORLD.WIDTH * 0.5, 34, 'BLOOD MOON SURVIVORS', {
      color: '#ffcc44',
      fontSize: '30px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(WORLD.WIDTH * 0.5, 96, 'Select Your Character', {
      color: '#f3d9d9',
      fontSize: '20px',
    }).setOrigin(0.5);

    const mapSave = SaveSystem.load();
    const mapInfo = GAME_MAP_MAP[mapSave.selectedMap];
    this.add.text(WORLD.WIDTH * 0.5, 114, `${mapInfo.emoji} ${mapInfo.name}`, {
      color: '#aaaacc',
      fontSize: '14px',
    }).setOrigin(0.5);

    this.coinText = this.add.text(WORLD.WIDTH - 24, 26, '', {
      color: '#ffcc44',
      fontSize: '20px',
    }).setOrigin(1, 0);
    this.add.text(WORLD.WIDTH - 24, 48, '', {
      color: '#dd66ff',
      fontSize: '20px',
    }).setOrigin(1, 0);

    this.createCards();
    this.createStartButton();
    this.refreshUi();
  }

  private createCards(): void {
    const cardWidth = 140;
    const cardHeight = 180;
    const gap = 20;
    const totalWidth = CHARACTERS.length * cardWidth + (CHARACTERS.length - 1) * gap;
    const startX = (WORLD.WIDTH - totalWidth) * 0.5 + cardWidth * 0.5;
    const y = WORLD.HEIGHT * 0.5;

    CHARACTERS.forEach((character, index) => {
      const x = startX + index * (cardWidth + gap);
      const background = this.add.rectangle(0, 0, cardWidth, cardHeight, character.color, 0.38);
      const border = this.add.rectangle(0, 0, cardWidth, cardHeight)
        .setStrokeStyle(2, 0x8a6666, 1)
        .setFillStyle(0, 0);
      const name = this.add.text(0, -58, `${character.emoji} ${character.name}`, {
        color: '#ffffff',
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: cardWidth - 16 },
      }).setOrigin(0.5);
      const description = this.add.text(0, -4, character.description, {
        color: '#f5e9e9',
        fontSize: '15px',
        align: 'center',
        wordWrap: { width: cardWidth - 20 },
      }).setOrigin(0.5);
      const lockOverlay = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0.55);
      const lockText = this.add.text(0, 40, '', {
        color: '#ffcc44',
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);

      const container = this.add.container(x, y, [background, border, name, description, lockOverlay, lockText]);
      container.setSize(cardWidth, cardHeight);
      container.setInteractive(new Phaser.Geom.Rectangle(-cardWidth * 0.5, -cardHeight * 0.5, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
      container.on('pointerover', () => {
        background.setFillStyle(character.color, 0.55);
      });
      container.on('pointerout', () => {
        this.refreshCard(character.id);
      });
      container.on('pointerdown', () => {
        this.playUiClick();
        this.handleCharacterClick(character.id);
      });

      this.cards.push({ character, container, background, border, lockOverlay, lockText });
    });
  }

  private createStartButton(): void {
    const topRowY = WORLD.HEIGHT - 90;
    const bottomRowY = WORLD.HEIGHT - 38;
    const buttonWidth = 130;
    const buttonHeight = 38;

    this.skillTreeButtonBg = this.add.rectangle(140, topRowY, buttonWidth, buttonHeight, 0x6c2e91, 0.95)
      .setStrokeStyle(3, 0xffcc44, 1);
    const skillTreeLabel = this.add.text(140, topRowY, 'SKILL TREE', {
      color: '#ffe6ff',
      fontSize: '16px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.skillTreeButtonBg.setInteractive({ useHandCursor: true });
    this.skillTreeButtonBg.on('pointerover', () => {
      this.skillTreeButtonBg?.setFillStyle(0x8240a8, 1);
    });
    this.skillTreeButtonBg.on('pointerout', () => {
      this.skillTreeButtonBg?.setFillStyle(0x6c2e91, 0.95);
    });
    this.skillTreeButtonBg.on('pointerdown', () => {
      this.playUiClick();
      this.scene.start(SkillTreeScene.KEY);
    });

    this.runeButtonBg = this.add.rectangle(310, topRowY, buttonWidth, buttonHeight, 0x1a6b5a, 0.95)
      .setStrokeStyle(3, 0x8ed8ff, 1);
    const runeLabel = this.add.text(310, topRowY, 'RUNES', {
      color: '#e3f6ff',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.runeButtonBg.setInteractive({ useHandCursor: true });
    this.runeButtonBg.on('pointerover', () => {
      this.runeButtonBg?.setFillStyle(0x23836e, 1);
    });
    this.runeButtonBg.on('pointerout', () => {
      this.runeButtonBg?.setFillStyle(0x1a6b5a, 0.95);
    });
    this.runeButtonBg.on('pointerdown', () => {
      this.playUiClick();
      this.scene.start(RuneScene.KEY);
    });

    this.equipmentButtonBg = this.add.rectangle(480, topRowY, buttonWidth, buttonHeight, 0xa86132, 0.95)
      .setStrokeStyle(3, 0xf0b27a, 1);
    const equipmentLabel = this.add.text(480, topRowY, 'EQUIP', {
      color: '#fff0e2',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.equipmentButtonBg.setInteractive({ useHandCursor: true });
    this.equipmentButtonBg.on('pointerover', () => {
      this.equipmentButtonBg?.setFillStyle(0xc77743, 1);
    });
    this.equipmentButtonBg.on('pointerout', () => {
      this.equipmentButtonBg?.setFillStyle(0xa86132, 0.95);
    });
    this.equipmentButtonBg.on('pointerdown', () => {
      this.playUiClick();
      this.scene.start(EquipmentScene.KEY);
    });

    this.achievementButtonBg = this.add.rectangle(140, bottomRowY, buttonWidth, buttonHeight, 0x2a5a3a, 0.95)
      .setStrokeStyle(3, 0x98d6a8, 1);
    const achievementLabel = this.add.text(140, bottomRowY, 'ACHIEVE', {
      color: '#dcfff7',
      fontSize: '16px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.achievementButtonBg.setInteractive({ useHandCursor: true });
    this.achievementButtonBg.on('pointerover', () => {
      this.achievementButtonBg?.setFillStyle(0x367349, 1);
    });
    this.achievementButtonBg.on('pointerout', () => {
      this.achievementButtonBg?.setFillStyle(0x2a5a3a, 0.95);
    });
    this.achievementButtonBg.on('pointerdown', () => {
      this.playUiClick();
      this.scene.start(AchievementScene.KEY);
    });

    this.mapButtonBg = this.add.rectangle(310, bottomRowY, buttonWidth, buttonHeight, 0x2a3a6b, 0.95)
      .setStrokeStyle(3, 0x8ed8ff, 1);
    const mapLabel = this.add.text(310, bottomRowY, 'MAP', {
      color: '#e3f6ff',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.mapButtonBg.setInteractive({ useHandCursor: true });
    this.mapButtonBg.on('pointerover', () => {
      this.mapButtonBg?.setFillStyle(0x3671af, 1);
    });
    this.mapButtonBg.on('pointerout', () => {
      this.mapButtonBg?.setFillStyle(0x2a3a6b, 0.95);
    });
    this.mapButtonBg.on('pointerdown', () => {
      this.playUiClick();
      this.scene.start(MapSelectScene.KEY);
    });

    this.startButtonBg = this.add.rectangle(480, bottomRowY, 140, 42, 0xffcc44, 0.95)
      .setStrokeStyle(3, 0xffee99, 1);
    const label = this.add.text(480, bottomRowY, 'START', {
      color: '#2a1408',
      fontSize: '24px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.startButtonBg.setInteractive({ useHandCursor: true });
    this.startButtonBg.on('pointerover', () => {
      this.startButtonBg?.setFillStyle(0xffdd66, 1);
    });
    this.startButtonBg.on('pointerout', () => {
      this.startButtonBg?.setFillStyle(0xffcc44, 0.95);
    });
    this.startButtonBg.on('pointerdown', () => {
      const character = CHARACTER_MAP[this.selectedCharacterId];
      this.playUiClick();
      this.scene.start(GameScene.KEY, { character, mapId: this.saveData.selectedMap });
    });

    // Add pulse tween to start button
    this.tweens.add({
      targets: this.startButtonBg,
      alpha: 0.85,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    label.setDepth((this.startButtonBg.depth ?? 0) + 1);
    mapLabel.setDepth((this.mapButtonBg.depth ?? 0) + 1);
    achievementLabel.setDepth((this.achievementButtonBg.depth ?? 0) + 1);
    equipmentLabel.setDepth((this.equipmentButtonBg.depth ?? 0) + 1);
    runeLabel.setDepth((this.runeButtonBg.depth ?? 0) + 1);
    skillTreeLabel.setDepth((this.skillTreeButtonBg.depth ?? 0) + 1);
  }

  private handleCharacterClick(characterId: CharacterId): void {
    const character = CHARACTER_MAP[characterId];
    const unlocked = this.saveData.unlockedCharacters.includes(characterId);

    if (unlocked) {
      this.selectedCharacterId = characterId;
      SaveSystem.selectCharacter(characterId);
      this.saveData = SaveSystem.load();
      this.refreshUi();
      return;
    }

    if (this.saveData.coins < character.cost) {
      this.flashCard(characterId, 0xaa2222);
      return;
    }

    const remaining = SaveSystem.spendCoins(character.cost);

    if (!remaining) {
      this.flashCard(characterId, 0xaa2222);
      return;
    }

    SaveSystem.unlockCharacter(characterId);
    SaveSystem.selectCharacter(characterId);
    this.saveData = SaveSystem.load();
    this.rewardNewAchievements(remaining.achievements.unlocked);
    this.saveData = SaveSystem.load();
    this.selectedCharacterId = characterId;
    this.flashCard(characterId, 0xffcc44);
    this.refreshUi();
  }

private refreshUi(): void {
    this.coinText?.setText(`🪙 ${this.saveData.coins} coins`);
    this.cards.forEach((card) => this.refreshCard(card.character.id));
  }

  private refreshCard(characterId: CharacterId): void {
    const card = this.cards.find((entry) => entry.character.id === characterId);

    if (!card) {
      return;
    }

    const unlocked = this.saveData.unlockedCharacters.includes(characterId);
    const selected = this.selectedCharacterId === characterId;
    card.background.setFillStyle(card.character.color, unlocked ? 0.38 : 0.22);
    card.border.setStrokeStyle(selected ? 3 : 2, selected ? 0xffcc44 : 0x8a6666, 1);
    card.lockOverlay.setVisible(!unlocked);
    card.lockText.setVisible(!unlocked);
    card.lockText.setText(`🔒 ${card.character.cost} Coins`);

    // Add pulsing tween for selected card border
    if (selected) {
      this.tweens.killTweensOf(card.border);
      this.tweens.add({
        targets: card.border,
        alpha: 0.9,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.tweens.killTweensOf(card.border);
    }
  }

  private flashCard(characterId: CharacterId, color: number): void {
    const card = this.cards.find((entry) => entry.character.id === characterId);

    if (!card) {
      return;
    }

    card.border.setStrokeStyle(3, color, 1);
    this.tweens.add({
      targets: card.container,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 90,
      yoyo: true,
      onComplete: () => this.refreshCard(characterId),
    });
  }

  private rewardNewAchievements(previousUnlocked: AchievementId[]): void {
    this.saveData.achievements.unlocked
      .filter((id) => !previousUnlocked.includes(id))
      .forEach((id) => {
        SaveSystem.addCoins(ACHIEVEMENT_MAP[id].reward);
      });
  }

  private playUiClick(): void {
    if (this.cache.audio.exists('ui-click')) {
      this.sound.play('ui-click', { volume: 0.35 });
    }
  }
}
