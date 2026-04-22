import Phaser from 'phaser';
import { WORLD } from '../constants';
import { ACHIEVEMENT_MAP, AchievementId } from '../data/AchievementData';
import { getRuneBonusValue, OwnedRune, RUNE_MAP, RUNE_TYPES, RuneType } from '../data/RuneData';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { CharacterSelectScene } from './CharacterSelectScene';

type LoadoutSlotView = {
  slotIndex: 0 | 1 | 2;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  detail: Phaser.GameObjects.Text;
};

type RuneRowView = {
  type: RuneType;
  level: number;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  countText: Phaser.GameObjects.Text;
  detailText: Phaser.GameObjects.Text;
  mergeButton?: Phaser.GameObjects.Rectangle;
  mergeLabel?: Phaser.GameObjects.Text;
};

type RuneColumnView = {
  type: RuneType;
  panel: Phaser.GameObjects.Rectangle;
  buyButton: Phaser.GameObjects.Rectangle;
  buyLabel: Phaser.GameObjects.Text;
  rows: RuneRowView[];
};

export class RuneScene extends Phaser.Scene {
  static readonly KEY = 'RuneScene';

  private saveData!: SaveData;
  private coinText?: Phaser.GameObjects.Text;
  private bloodstoneText?: Phaser.GameObjects.Text;
  private loadoutSlots: LoadoutSlotView[] = [];
  private runeColumns: RuneColumnView[] = [];

  constructor() {
    super(RuneScene.KEY);
  }

  create(): void {
    this.saveData = SaveSystem.load();

    this.cameras.main.setBackgroundColor(0x100814);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0x100814);

    this.add.text(WORLD.WIDTH * 0.5, 34, 'RUNES', {
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

    this.add.text(48, 92, 'Loadout', {
      color: '#f4d7a1',
      fontSize: '24px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.createLoadoutSection();
    this.createRuneGrid();
    this.createBackButton();
    this.refreshUi();
  }

  private createLoadoutSection(): void {
    const slotXs: Array<0 | 1 | 2> = [0, 1, 2];
    const startX = 180;
    const gap = 220;
    const y = 140;

    slotXs.forEach((slotIndex) => {
      const x = startX + slotIndex * gap;
      const background = this.add.rectangle(0, 0, 180, 72, 0x1b1220, 0.96).setStrokeStyle(2, 0x8a6666, 0.9);
      const label = this.add.text(0, -12, '', {
        color: '#ffffff',
        fontSize: '21px',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const detail = this.add.text(0, 16, '', {
        color: '#d8d0df',
        fontSize: '14px',
        align: 'center',
      }).setOrigin(0.5);

      const container = this.add.container(x, y, [background, label, detail]);
      container.setSize(180, 72);
      container.setInteractive(new Phaser.Geom.Rectangle(-90, -36, 180, 72), Phaser.Geom.Rectangle.Contains);
      container.on('pointerover', () => background.setFillStyle(0x26172f, 1));
      container.on('pointerout', () => this.refreshLoadoutSlot(slotIndex));
      container.on('pointerdown', () => {
        if (this.saveData.runeLoadout[slotIndex] === null) {
          this.flashDisplay(container, background, 0xaa2222, () => this.refreshLoadoutSlot(slotIndex));
          return;
        }

        this.saveData = SaveSystem.unequipRune(slotIndex);
        this.flashDisplay(container, background, 0xffcc44, () => this.refreshLoadoutSlot(slotIndex));
        this.refreshUi();
      });

      this.loadoutSlots.push({ slotIndex, container, background, label, detail });
    });
  }

  private createRuneGrid(): void {
    const startX = 80;
    const columnGap = 160;
    const columnY = 378;

    RUNE_TYPES.forEach((type, index) => {
      const info = RUNE_MAP[type];
      const x = startX + index * columnGap;
      const panel = this.add.rectangle(x, columnY, 142, 312, 0x1a111f, 0.96).setStrokeStyle(2, info.color, 0.9);
      const header = this.add.text(x, 224, `${info.emoji} ${info.name}`, {
        color: this.toColorString(info.color),
        fontSize: '22px',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const hint = this.add.text(x, 246, info.description.replace('{v}', this.formatValue(info.values[0] ?? 0)), {
        color: '#c8bbd0',
        fontSize: '11px',
        align: 'center',
        wordWrap: { width: 126 },
      }).setOrigin(0.5, 0);

      const rows = [1, 2, 3, 4, 5].map((level, rowIndex) => this.createRuneRow(type, level, x, 292 + rowIndex * 38));

      const buyButton = this.add.rectangle(x, 508, 108, 34, 0x274e2a, 0.96).setStrokeStyle(2, 0x6de080, 1);
      const buyLabel = this.add.text(x, 508, '', {
        color: '#d8ffe0',
        fontSize: '15px',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      buyButton.setInteractive({ useHandCursor: true });
      buyButton.on('pointerover', () => buyButton.setFillStyle(0x346637, 1));
      buyButton.on('pointerout', () => this.refreshColumn(type));
      buyButton.on('pointerdown', () => this.handleBuyRune(type));

      this.runeColumns.push({ type, panel, buyButton, buyLabel, rows });

      header.setDepth((panel.depth ?? 0) + 1);
      hint.setDepth((panel.depth ?? 0) + 1);
      buyLabel.setDepth((buyButton.depth ?? 0) + 1);
    });
  }

  private createRuneRow(type: RuneType, level: number, x: number, y: number): RuneRowView {
    const info = RUNE_MAP[type];
    const background = this.add.rectangle(0, 0, 124, 28, 0x24161a, 0.96).setStrokeStyle(1, info.color, 0.7);
    const levelText = this.add.text(-54, 0, `Lv${level}`, {
      color: '#f4d7a1',
      fontSize: '13px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const countText = this.add.text(-6, 0, '', {
      color: '#ffffff',
      fontSize: '14px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const detailText = this.add.text(26, 0, this.formatRuneBonus(type, level), {
      color: '#bfb4c9',
      fontSize: '10px',
    }).setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [background, levelText, countText, detailText];
    let mergeButton: Phaser.GameObjects.Rectangle | undefined;
    let mergeLabel: Phaser.GameObjects.Text | undefined;

    if (level < 5) {
      mergeButton = this.add.rectangle(46, 0, 34, 18, 0x3b2646, 0.96).setStrokeStyle(1, info.color, 1);
      mergeLabel = this.add.text(46, 0, '↑', {
        color: '#f6e9ff',
        fontSize: '12px',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      mergeButton.setInteractive({ useHandCursor: true });
      mergeButton.on('pointerover', () => mergeButton?.setFillStyle(0x563564, 1));
      mergeButton.on('pointerout', () => this.refreshRow(type, level));
      mergeButton.on('pointerdown', () => this.handleMergeRune(type, level));

      children.push(mergeButton, mergeLabel);
    }

    const container = this.add.container(x, y, children);
    container.setSize(124, 28);
    container.setInteractive(new Phaser.Geom.Rectangle(-62, -14, 124, 28), Phaser.Geom.Rectangle.Contains);
    container.on('pointerover', () => background.setFillStyle(0x34202d, 1));
    container.on('pointerout', () => this.refreshRow(type, level));
    container.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number) => {
      if (level < 5 && localX >= 29) {
        return;
      }

      this.handleEquipRune(type, level, container, background);
    });

    return { type, level, container, background, countText, detailText, mergeButton, mergeLabel };
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

  private handleBuyRune(type: RuneType): void {
    const previousUnlocked = [...this.saveData.achievements.unlocked];
    const updated = SaveSystem.purchaseRune(type);
    const column = this.runeColumns.find((entry) => entry.type === type);

    if (!updated || !column) {
      if (column) {
        this.flashDisplay(undefined, column.buyButton, 0xaa2222, () => this.refreshColumn(type));
      }
      return;
    }

    this.saveData = updated;
    this.rewardNewAchievements(previousUnlocked);
    this.saveData = SaveSystem.load();
    this.flashDisplay(undefined, column.buyButton, RUNE_MAP[type].color, () => this.refreshColumn(type));
    this.refreshUi();
  }

  private handleMergeRune(type: RuneType, level: number): void {
    const previousUnlocked = [...this.saveData.achievements.unlocked];
    const updated = SaveSystem.mergeRunes(type, level);
    const row = this.getRowView(type, level);

    if (!updated || !row) {
      if (row?.mergeButton) {
        this.flashDisplay(undefined, row.mergeButton, 0xaa2222, () => this.refreshRow(type, level));
      }
      return;
    }

    this.saveData = updated;
    this.rewardNewAchievements(previousUnlocked);
    this.saveData = SaveSystem.load();
    if (row.mergeButton) {
      this.flashDisplay(undefined, row.mergeButton, RUNE_MAP[type].color, () => this.refreshRow(type, level));
    }
    this.refreshUi();
  }

  private handleEquipRune(
    type: RuneType,
    level: number,
    container: Phaser.GameObjects.Container,
    background: Phaser.GameObjects.Rectangle
  ): void {
    const runeIndex = this.findOwnedRuneIndex(type, level);
    const firstEmptySlot = this.findFirstEmptySlot();

    if (runeIndex < 0 || firstEmptySlot === null) {
      this.flashDisplay(container, background, 0xaa2222, () => this.refreshRow(type, level));
      return;
    }

    this.saveData = SaveSystem.equipRune(firstEmptySlot, runeIndex);
    this.flashDisplay(container, background, RUNE_MAP[type].color, () => this.refreshRow(type, level));
    this.refreshUi();
  }

  private refreshUi(): void {
    this.saveData = SaveSystem.load();
    this.coinText?.setText(`🪙 ${this.saveData.coins}`);
    this.bloodstoneText?.setText(`💎 ${this.saveData.bloodstones}`);
    this.loadoutSlots.forEach((slot) => this.refreshLoadoutSlot(slot.slotIndex));
    this.runeColumns.forEach((column) => this.refreshColumn(column.type));
  }

  private refreshLoadoutSlot(slotIndex: 0 | 1 | 2): void {
    const slot = this.loadoutSlots.find((entry) => entry.slotIndex === slotIndex);

    if (!slot) {
      return;
    }

    const resolved = this.resolveLoadoutRunes()[slotIndex];

    if (!resolved) {
      slot.background.setFillStyle(0x1b1220, 0.96);
      slot.background.setStrokeStyle(2, 0x8a6666, 0.9);
      slot.label.setText(`Slot ${slotIndex + 1}: Empty`).setColor('#aaaaaa');
      slot.detail.setText('Click a rune below to equip').setColor('#777777');
      return;
    }

    const info = RUNE_MAP[resolved.type];
    slot.background.setFillStyle(0x1b1220, 0.96);
    slot.background.setStrokeStyle(2, info.color, 1);
    slot.label.setText(`${info.emoji} ${info.name} Lv${resolved.level}`).setColor('#ffffff');
    slot.detail.setText(this.formatRuneBonus(resolved.type, resolved.level)).setColor(this.toColorString(info.color));
  }

  private refreshColumn(type: RuneType): void {
    const column = this.runeColumns.find((entry) => entry.type === type);
    const info = RUNE_MAP[type];

    if (!column) {
      return;
    }

    column.panel.setStrokeStyle(2, info.color, 0.9);
    column.buyButton.setFillStyle(this.saveData.coins >= (info.costs[0] ?? 0) ? 0x274e2a : 0x3a2525, 0.96);
    column.buyButton.setStrokeStyle(2, this.saveData.coins >= (info.costs[0] ?? 0) ? 0x6de080 : 0xcc6666, 1);
    column.buyLabel.setText(`BUY ${info.costs[0]}c`).setColor(this.saveData.coins >= (info.costs[0] ?? 0) ? '#d8ffe0' : '#ffbbbb');
    column.rows.forEach((row) => this.refreshRow(type, row.level));
  }

  private refreshRow(type: RuneType, level: number): void {
    const row = this.getRowView(type, level);
    const count = this.countRunes(type, level);
    const canMerge = level < 5 && count >= 3;
    const info = RUNE_MAP[type];

    if (!row) {
      return;
    }

    row.background.setFillStyle(count > 0 ? 0x24161a : 0x191015, 0.96);
    row.background.setStrokeStyle(1, info.color, count > 0 ? 0.9 : 0.45);
    row.countText.setText(`x${count}`).setColor(count > 0 ? '#ffffff' : '#777777');
    row.detailText.setText(this.formatRuneBonus(type, level)).setColor(count > 0 ? '#cfc5d8' : '#6f6678');

    if (row.mergeButton && row.mergeLabel) {
      row.mergeButton.setFillStyle(canMerge ? 0x3b2646 : 0x251826, 0.96);
      row.mergeButton.setStrokeStyle(1, canMerge ? info.color : 0x6b516b, 1);
      row.mergeLabel.setText(canMerge ? '↑' : '·').setColor(canMerge ? '#f6e9ff' : '#8b7e93');
    }
  }

  private rewardNewAchievements(previousUnlocked: AchievementId[]): void {
    this.saveData.achievements.unlocked
      .filter((id) => !previousUnlocked.includes(id))
      .forEach((id) => {
        SaveSystem.addCoins(ACHIEVEMENT_MAP[id].reward);
      });
  }

  private resolveLoadoutRunes(): Array<OwnedRune | null> {
    const remainingRunes = [...this.saveData.runes].sort((left, right) => right.level - left.level);

    return this.saveData.runeLoadout.map((type) => {
      if (!type) {
        return null;
      }

      const index = remainingRunes.findIndex((rune) => rune.type === type);

      if (index < 0) {
        return null;
      }

      const [rune] = remainingRunes.splice(index, 1);
      return rune ?? null;
    });
  }

  private findFirstEmptySlot(): 0 | 1 | 2 | null {
    const index = this.saveData.runeLoadout.findIndex((slot) => slot === null);

    if (index === 0 || index === 1 || index === 2) {
      return index;
    }

    return null;
  }

  private findOwnedRuneIndex(type: RuneType, level: number): number {
    return this.saveData.runes.findIndex((rune) => rune.type === type && rune.level === level);
  }

  private countRunes(type: RuneType, level: number): number {
    return this.saveData.runes.filter((rune) => rune.type === type && rune.level === level).length;
  }

  private getRowView(type: RuneType, level: number): RuneRowView | undefined {
    return this.runeColumns
      .find((entry) => entry.type === type)
      ?.rows.find((row) => row.level === level);
  }

  private formatRuneBonus(type: RuneType, level: number): string {
    return RUNE_MAP[type].description.replace('{v}', this.formatValue(getRuneBonusValue(type, level)));
  }

  private formatValue(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(/\.0$/, '');
  }

  private toColorString(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  private flashDisplay(
    container: Phaser.GameObjects.Container | undefined,
    background: Phaser.GameObjects.Rectangle,
    color: number,
    onComplete: () => void
  ): void {
    background.setStrokeStyle(3, color, 1);
    this.tweens.add({
      targets: container ?? background,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 90,
      yoyo: true,
      onComplete,
    });
  }
}
