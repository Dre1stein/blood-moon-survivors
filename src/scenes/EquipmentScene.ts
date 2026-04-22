import Phaser from 'phaser';
import { EQUIPMENT_CONFIG, WORLD } from '../constants';
import { EquipmentItem } from '../data/EquipmentData';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { EquipmentSlot } from '../types';
import { CharacterSelectScene } from './CharacterSelectScene';

type InventoryFilter = 'all' | EquipmentSlot;

type EquippedSlotView = {
  slot: EquipmentSlot;
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  dashedBorder: Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  statText: Phaser.GameObjects.Text;
  rarityText: Phaser.GameObjects.Text;
};

type FilterTabView = {
  filter: InventoryFilter;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: '⚔️ Weapon',
  armor: '🛡️ Armor',
  accessory: '💍 Accessory',
};

const FILTER_LABELS: Record<InventoryFilter, string> = {
  all: 'All',
  weapon: 'Weapon',
  armor: 'Armor',
  accessory: 'Accessory',
};

export class EquipmentScene extends Phaser.Scene {
  static readonly KEY = 'EquipmentScene';

  private saveData!: SaveData;
  private coinText?: Phaser.GameObjects.Text;
  private bloodstoneText?: Phaser.GameObjects.Text;
  private equippedViews: EquippedSlotView[] = [];
  private filterTabs: FilterTabView[] = [];
  private selectedFilter: InventoryFilter = 'all';
  private inventoryViewport?: Phaser.Geom.Rectangle;
  private inventoryMask?: Phaser.Display.Masks.GeometryMask;
  private inventoryContent?: Phaser.GameObjects.Container;
  private inventoryScrollOffset = 0;
  private inventoryContentHeight = 0;

  constructor() {
    super(EquipmentScene.KEY);
  }

  create(): void {
    this.saveData = SaveSystem.load();
    this.selectedFilter = 'all';
    this.inventoryScrollOffset = 0;

    this.cameras.main.setBackgroundColor(0x100814);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0x100814);

    this.add.text(WORLD.WIDTH * 0.5, 34, 'EQUIPMENT', {
      color: '#ffcc44',
      fontSize: '30px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.coinText = this.add.text(WORLD.WIDTH - 24, 26, '', {
      color: '#ffcc44',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.bloodstoneText = this.add.text(WORLD.WIDTH - 24, 48, '', {
      color: '#dd66ff',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.add.text(40, 92, 'Equipped', {
      color: '#f4d7a1',
      fontSize: '24px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.createEquippedSection();
    this.createInventorySection();
    this.createBackButton();
    this.registerScrollInput();
    this.refreshUi();
  }

  private createEquippedSection(): void {
    const startY = 145;
    const gap = 72;

    (EQUIPMENT_CONFIG.SLOTS as readonly EquipmentSlot[]).forEach((slot, index) => {
      this.equippedViews.push(this.createEquippedSlotView(slot, WORLD.WIDTH * 0.5, startY + index * gap));
    });
  }

  private createEquippedSlotView(slot: EquipmentSlot, x: number, y: number): EquippedSlotView {
    const width = 680;
    const height = 56;
    const background = this.add.rectangle(0, 0, width, height, 0x1a111f, 0.96);
    const frame = this.add.rectangle(0, 0, width, height).setFillStyle(0, 0);
    const dashedBorder = this.add.graphics();
    const slotLabel = this.add.text(-width * 0.5 + 16, 0, SLOT_LABELS[slot], {
      color: '#f6e9d7',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const nameText = this.add.text(-96, -10, '', {
      color: '#ffffff',
      fontSize: '18px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const statText = this.add.text(-96, 12, '', {
      color: '#d8d0df',
      fontSize: '15px',
    }).setOrigin(0, 0.5);
    const rarityText = this.add.text(width * 0.5 - 18, 0, '', {
      color: '#ffffff',
      fontSize: '16px',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const container = this.add.container(x, y, [background, frame, dashedBorder, slotLabel, nameText, statText, rarityText]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width * 0.5, -height * 0.5, width, height), Phaser.Geom.Rectangle.Contains);
    container.on('pointerover', () => background.setFillStyle(0x25182d, 1));
    container.on('pointerout', () => this.refreshEquippedSection());
    container.on('pointerdown', () => {
      if (this.saveData.equipmentInventory.equipped[slot] === undefined) {
        return;
      }

      this.saveData = SaveSystem.unequipItem(slot);
      this.refreshUi();
    });

    return { slot, container, frame, dashedBorder, nameText, statText, rarityText };
  }

  private createInventorySection(): void {
    this.add.text(40, 366, 'Inventory', {
      color: '#f4d7a1',
      fontSize: '24px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.createFilterTabs();

    const viewportX = 40;
    const viewportY = 412;
    const viewportWidth = WORLD.WIDTH - 80;
    const viewportHeight = 124;
    this.inventoryViewport = new Phaser.Geom.Rectangle(viewportX, viewportY, viewportWidth, viewportHeight);

    this.add.rectangle(viewportX + viewportWidth * 0.5, viewportY + viewportHeight * 0.5, viewportWidth, viewportHeight, 0x1a111f, 0.82)
      .setStrokeStyle(2, 0x4b344f, 1)
      .setOrigin(0.5);

    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
    this.inventoryMask = maskShape.createGeometryMask();
    maskShape.destroy();

    this.inventoryContent = this.add.container(0, 0);
    this.inventoryContent.setMask(this.inventoryMask);
  }

  private createFilterTabs(): void {
    const filters: InventoryFilter[] = ['all', 'weapon', 'armor', 'accessory'];
    const startX = 194;
    const y = 366;
    const width = 116;

    filters.forEach((filter, index) => {
      const x = startX + index * 126;
      const background = this.add.rectangle(x, y, width, 34, 0x24161a, 0.95).setStrokeStyle(2, 0x8a6666, 1);
      const label = this.add.text(x, y, FILTER_LABELS[filter], {
        color: '#f6e9d7',
        fontSize: '16px',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      background.setInteractive({ useHandCursor: true });
      background.on('pointerover', () => {
        if (this.selectedFilter !== filter) {
          background.setFillStyle(0x3a222a, 1);
        }
      });
      background.on('pointerout', () => this.refreshFilterTabs());
      background.on('pointerdown', () => {
        this.selectedFilter = filter;
        this.inventoryScrollOffset = 0;
        this.refreshUi();
      });

      this.filterTabs.push({ filter, background, label });
    });
  }

  private createBackButton(): void {
    const button = this.add.rectangle(84, WORLD.HEIGHT - 34, 120, 42, 0x24161a, 0.95).setStrokeStyle(2, 0xffcc44);
    const label = this.add.text(84, WORLD.HEIGHT - 36, '← BACK', {
      color: '#ffcc44',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setFillStyle(0x382026, 1));
    button.on('pointerout', () => button.setFillStyle(0x24161a, 0.95));
    button.on('pointerdown', () => this.scene.start(CharacterSelectScene.KEY));

    label.setDepth((button.depth ?? 0) + 1);
  }

  private registerScrollInput(): void {
    this.input.on(
      'wheel',
      (pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
        if (!this.inventoryViewport || !this.inventoryContent || !Phaser.Geom.Rectangle.Contains(this.inventoryViewport, pointer.x, pointer.y)) {
          return;
        }

        const maxScroll = Math.max(0, this.inventoryContentHeight - this.inventoryViewport.height);

        if (maxScroll <= 0) {
          return;
        }

        this.inventoryScrollOffset = Phaser.Math.Clamp(this.inventoryScrollOffset + deltaY * 0.6, 0, maxScroll);
        this.inventoryContent.y = -this.inventoryScrollOffset;
      }
    );
  }

  private refreshUi(): void {
    this.saveData = SaveSystem.load();
    this.coinText?.setText(`🪙 ${this.saveData.coins}`);
    this.bloodstoneText?.setText(`💎 ${this.saveData.bloodstones}`);
    this.refreshFilterTabs();
    this.refreshEquippedSection();
    this.refreshInventorySection();
  }

  private refreshFilterTabs(): void {
    this.filterTabs.forEach((tab) => {
      const active = tab.filter === this.selectedFilter;
      tab.background.setFillStyle(active ? 0x6c2e91 : 0x24161a, active ? 1 : 0.95);
      tab.background.setStrokeStyle(2, active ? 0xffcc44 : 0x8a6666, 1);
      tab.label.setColor(active ? '#ffe6ff' : '#f6e9d7');
    });
  }

  private refreshEquippedSection(): void {
    this.equippedViews.forEach((view) => {
      const index = this.saveData.equipmentInventory.equipped[view.slot];
      const item = typeof index === 'number' ? this.saveData.equipmentInventory.owned[index] : undefined;

      if (!item) {
        view.frame.setStrokeStyle(1, 0x333333, 0.15);
        view.dashedBorder.clear();
        this.drawDashedRect(view.dashedBorder, -340, -28, 680, 56, 0x777777);
        view.nameText.setText('Empty').setColor('#aaaaaa');
        view.statText.setText('Click an inventory item below to equip it.').setColor('#777777');
        view.rarityText.setText('');
        return;
      }

      view.frame.setStrokeStyle(2, item.color, 1);
      view.dashedBorder.clear();
      view.nameText.setText(item.itemName).setColor('#ffffff');
      view.statText.setText(this.formatStat(item)).setColor('#d8d0df');
      view.rarityText.setText(EQUIPMENT_CONFIG.RARITY[item.rarity].label).setColor(this.toColorString(item.color));
    });
  }

  private refreshInventorySection(): void {
    if (!this.inventoryViewport || !this.inventoryContent) {
      return;
    }

    this.inventoryContent.removeAll(true);

    const filteredItems = this.saveData.equipmentInventory.owned
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => this.selectedFilter === 'all' || item.slot === this.selectedFilter);

    if (filteredItems.length === 0) {
      const emptyText = this.add.text(this.inventoryViewport.x + 16, this.inventoryViewport.y + 16, 'No equipment collected yet.', {
        color: '#8f8195',
        fontSize: '18px',
      }).setOrigin(0, 0);
      this.inventoryContent.add(emptyText);
      this.inventoryContentHeight = emptyText.height + 32;
      this.inventoryScrollOffset = 0;
      this.inventoryContent.setPosition(0, 0);
      return;
    }

    const columns = 4;
    const cardWidth = 168;
    const cardHeight = 78;
    const gapX = 12;
    const gapY = 12;
    const startX = this.inventoryViewport.x + cardWidth * 0.5;
    const startY = this.inventoryViewport.y + cardHeight * 0.5;
    const equippedIndices = new Set(Object.values(this.saveData.equipmentInventory.equipped));

    filteredItems.forEach(({ item, index }, itemIndex) => {
      const column = itemIndex % columns;
      const row = Math.floor(itemIndex / columns);
      const x = startX + column * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);
      const isEquipped = equippedIndices.has(index);
      const card = this.createInventoryCard(item, index, x, y, cardWidth, cardHeight, isEquipped);
      this.inventoryContent?.add(card);
    });

    const rowCount = Math.ceil(filteredItems.length / columns);
    this.inventoryContentHeight = rowCount * cardHeight + Math.max(0, rowCount - 1) * gapY;
    const maxScroll = Math.max(0, this.inventoryContentHeight - this.inventoryViewport.height);
    this.inventoryScrollOffset = Phaser.Math.Clamp(this.inventoryScrollOffset, 0, maxScroll);
    this.inventoryContent.setPosition(0, -this.inventoryScrollOffset);
  }

  private createInventoryCard(
    item: EquipmentItem,
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    isEquipped: boolean
  ): Phaser.GameObjects.Container {
    const background = this.add.rectangle(0, 0, width, height, 0x24161a, 0.96).setStrokeStyle(2, item.color, 1);
    const stripe = this.add.rectangle(-width * 0.5 + 6, 0, 8, height - 12, item.color, 1);
    const nameText = this.add.text(-width * 0.5 + 18, -18, item.itemName, {
      color: '#ffffff',
      fontSize: '15px',
      fontStyle: 'bold',
      wordWrap: { width: width - 44 },
    }).setOrigin(0, 0.5);
    const statText = this.add.text(-width * 0.5 + 18, 8, this.formatStat(item), {
      color: '#d8d0df',
      fontSize: '14px',
    }).setOrigin(0, 0.5);
    const equippedText = this.add.text(width * 0.5 - 10, -25, isEquipped ? 'EQUIPPED' : '', {
      color: '#ffcc44',
      fontSize: '11px',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    const rarityText = this.add.text(width * 0.5 - 10, 25, EQUIPMENT_CONFIG.RARITY[item.rarity].label, {
      color: this.toColorString(item.color),
      fontSize: '12px',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const container = this.add.container(x, y, [background, stripe, nameText, statText, equippedText, rarityText]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width * 0.5, -height * 0.5, width, height), Phaser.Geom.Rectangle.Contains);
    container.on('pointerover', () => background.setFillStyle(0x34202d, 1));
    container.on('pointerout', () => background.setFillStyle(0x24161a, 0.96));
    container.on('pointerdown', () => {
      this.saveData = SaveSystem.equipItem(item.slot, index);
      this.refreshUi();
    });

    return container;
  }

  private formatStat(item: EquipmentItem): string {
    switch (item.statName) {
      case 'damage':
        return `Damage +${Math.round(item.value * 100)}%`;
      case 'maxHp':
        return `Max HP +${item.value}`;
      case 'hpRegen':
        return `HP Regen +${this.formatNumber(item.value)}/s`;
      case 'critChance':
        return `Crit Chance +${Math.round(item.value * 100)}%`;
    }
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  private toColorString(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  private drawDashedRect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, color: number): void {
    const dashLength = 12;
    const gapLength = 8;
    graphics.lineStyle(2, color, 1);

    const drawDashedLine = (startX: number, startY: number, endX: number, endY: number): void => {
      const length = Phaser.Math.Distance.Between(startX, startY, endX, endY);
      const direction = new Phaser.Math.Vector2(endX - startX, endY - startY).normalize();

      for (let distance = 0; distance < length; distance += dashLength + gapLength) {
        const segmentLength = Math.min(dashLength, length - distance);
        const fromX = startX + direction.x * distance;
        const fromY = startY + direction.y * distance;
        const toX = fromX + direction.x * segmentLength;
        const toY = fromY + direction.y * segmentLength;
        graphics.lineBetween(fromX, fromY, toX, toY);
      }
    };

    drawDashedLine(x, y, x + width, y);
    drawDashedLine(x + width, y, x + width, y + height);
    drawDashedLine(x + width, y + height, x, y + height);
    drawDashedLine(x, y + height, x, y);
  }
}
