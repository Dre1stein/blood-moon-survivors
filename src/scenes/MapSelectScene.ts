import Phaser from 'phaser';
import { WORLD } from '../constants';
import { GAME_MAPS, GameMap, MapId } from '../data/MapData';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { CharacterSelectScene } from './CharacterSelectScene';

type MapCard = {
  map: GameMap;
  background: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  selectionGlow: Phaser.GameObjects.Rectangle;
  lockOverlay: Phaser.GameObjects.Rectangle;
  lockText: Phaser.GameObjects.Text;
  rewardsText: Phaser.GameObjects.Text;
};

export class MapSelectScene extends Phaser.Scene {
  static readonly KEY = 'MapSelectScene';

  private saveData!: SaveData;
  private coinText?: Phaser.GameObjects.Text;
  private cards: MapCard[] = [];

  constructor() {
    super(MapSelectScene.KEY);
  }

  create(): void {
    this.saveData = SaveSystem.load();

    this.cameras.main.setBackgroundColor(0x100814);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0x100814);

    this.add.text(WORLD.WIDTH * 0.5, 34, 'SELECT MAP', {
      color: '#ffcc44',
      fontSize: '30px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.coinText = this.add.text(WORLD.WIDTH - 24, 26, '', {
      color: '#ffcc44',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.createCards();
    this.createBackButton();
    this.refreshUi();
  }

  private createCards(): void {
    const columns = 2;
    const cardWidth = 320;
    const cardHeight = 180;
    const gapX = 28;
    const gapY = 26;
    const startX = (WORLD.WIDTH - (columns * cardWidth + gapX)) * 0.5 + cardWidth * 0.5;
    const startY = 112 + cardHeight * 0.5;

    GAME_MAPS.forEach((map, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + column * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);
      const background = this.add.rectangle(0, 0, cardWidth, cardHeight, map.groundColor, 0.92);
      const selectionGlow = this.add.rectangle(0, 0, cardWidth + 8, cardHeight + 8, 0xffcc44, 0.14).setVisible(false);
      const border = this.add.rectangle(0, 0, cardWidth, cardHeight).setFillStyle(0, 0);
      const title = this.add.text(-cardWidth * 0.5 + 14, -cardHeight * 0.5 + 18, `${map.emoji} ${map.name}`, {
        color: '#ffffff',
        fontSize: '21px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: cardWidth - 28 },
      }).setOrigin(0, 0);
      const description = this.add.text(-cardWidth * 0.5 + 14, -cardHeight * 0.5 + 52, map.description, {
        color: '#f0f0f0',
        fontSize: '14px',
        align: 'center',
        wordWrap: { width: cardWidth - 28 },
      }).setOrigin(0, 0);
      const difficulty = this.add.text(-cardWidth * 0.5 + 14, -4, this.getDifficultyLabel(map), {
        color: '#ffd67a',
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0, 0.5);
      const rewardsText = this.add.text(-cardWidth * 0.5 + 14, 44, '', {
        color: '#d5f3d5',
        fontSize: '15px',
        align: 'center',
        wordWrap: { width: cardWidth - 28 },
      }).setOrigin(0, 0.5);
      const lockOverlay = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0.56);
      const lockText = this.add.text(0, 0, '', {
        color: '#ffcc44',
        fontSize: '22px',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);
      const container = this.add.container(x, y, [selectionGlow, background, border, title, description, difficulty, rewardsText, lockOverlay, lockText]);

      container.setSize(cardWidth, cardHeight);
      container.setInteractive(new Phaser.Geom.Rectangle(-cardWidth * 0.5, -cardHeight * 0.5, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
      container.on('pointerover', () => {
        background.setAlpha(1);
      });
      container.on('pointerout', () => {
        this.refreshCard(map.id);
      });
      container.on('pointerdown', () => {
        this.playUiClick();
        this.handleMapClick(map.id);
      });

      this.cards.push({ map, background, border, selectionGlow, lockOverlay, lockText, rewardsText });
    });
  }

  private createBackButton(): void {
    const button = this.add.rectangle(84, WORLD.HEIGHT - 36, 120, 42, 0x1a251a, 0.95).setStrokeStyle(2, 0xffcc44);
    const label = this.add.text(84, WORLD.HEIGHT - 36, '← BACK', {
      color: '#ffcc44',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setFillStyle(0x253525, 1));
    button.on('pointerout', () => button.setFillStyle(0x1a251a, 0.95));
    button.on('pointerdown', () => {
      this.playUiClick();
      this.scene.start(CharacterSelectScene.KEY);
    });

    label.setDepth((button.depth ?? 0) + 1);
  }

  private playUiClick(): void {
    if (this.cache.audio.exists('ui-click')) {
      this.sound.play('ui-click', { volume: 0.35 });
    }
  }

  private handleMapClick(mapId: MapId): void {
    const unlocked = this.saveData.unlockedMaps.includes(mapId);

    if (unlocked) {
      SaveSystem.selectMap(mapId);
      this.saveData = SaveSystem.load();
      this.refreshUi();
      return;
    }

    const updated = SaveSystem.unlockMap(mapId);

    if (!updated) {
      this.flashCard(mapId, 0xaa3333);
      return;
    }

    SaveSystem.selectMap(mapId);
    this.saveData = SaveSystem.load();
    this.flashCard(mapId, 0xffcc44);
    this.refreshUi();
  }

  private refreshUi(): void {
    this.coinText?.setText(`🪙 ${this.saveData.coins} coins`);
    this.cards.forEach((card) => this.refreshCard(card.map.id));
  }

  private refreshCard(mapId: MapId): void {
    const card = this.cards.find((entry) => entry.map.id === mapId);

    if (!card) {
      return;
    }

    const unlocked = this.saveData.unlockedMaps.includes(mapId);
    const selected = this.saveData.selectedMap === mapId;
    card.background.setFillStyle(card.map.groundColor, unlocked ? 0.92 : 0.58);
    card.border.setStrokeStyle(selected ? 4 : 2, selected ? 0xffcc44 : 0x8ba58b, 1);
    card.selectionGlow.setVisible(selected);
    card.lockOverlay.setVisible(!unlocked);
    card.lockText.setVisible(!unlocked);
    card.lockText.setText(`🔒 ${card.map.cost} Coins`);
    card.rewardsText.setText(`XP ×${card.map.xpMultiplier.toFixed(1)} | Coins ×${card.map.coinMultiplier.toFixed(1)} | Blood ×${card.map.bloodstoneMultiplier.toFixed(1)}`);
  }

  private getDifficultyLabel(map: GameMap): string {
    const rating = this.getDifficultyRating(map);
    return `Difficulty: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
  }

  private getDifficultyRating(map: GameMap): number {
    switch (map.id) {
      case 'cursed-village':
        return 2;
      case 'shadow-forest':
        return 3;
      case 'abandoned-castle':
        return 4;
      case 'blood-moon-wasteland':
        return 5;
    }
  }

  private flashCard(mapId: MapId, color: number): void {
    const card = this.cards.find((entry) => entry.map.id === mapId);

    if (!card) {
      return;
    }

    card.border.setStrokeStyle(4, color, 1);
    this.tweens.add({
      targets: card.background,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 90,
      yoyo: true,
      onComplete: () => this.refreshCard(mapId),
    });
  }
}