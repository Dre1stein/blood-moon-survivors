import Phaser from 'phaser';
import { WORLD } from '../constants';
import { ACHIEVEMENT_MAP, AchievementId } from '../data/AchievementData';
import { BRANCH_INFO, BranchId, getSkillLevel, getSkillValue, SKILL_NODES, SkillNode } from '../data/SkillTreeData';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { CharacterSelectScene } from './CharacterSelectScene';

type SkillNodeView = {
  node: SkillNode;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  levelText: Phaser.GameObjects.Text;
  descriptionText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  indicators: Phaser.GameObjects.Rectangle[];
};

export class SkillTreeScene extends Phaser.Scene {
  static readonly KEY = 'SkillTreeScene';

  private saveData!: SaveData;
  private coinText?: Phaser.GameObjects.Text;
  private bloodstoneText?: Phaser.GameObjects.Text;
  private nodeViews: SkillNodeView[] = [];

  constructor() {
    super(SkillTreeScene.KEY);
  }

  create(): void {
    this.saveData = SaveSystem.load();

    this.cameras.main.setBackgroundColor(0x100814);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0x100814);

    this.add.text(WORLD.WIDTH * 0.5, 34, 'SKILL TREE', {
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
    this.add.text(WORLD.WIDTH - 24, 26, '', {
      color: '#ffcc44',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.createBranches();
    this.createBackButton();
    this.refreshUi();
  }

  private createBranches(): void {
    const branches: BranchId[] = ['survival', 'attack', 'efficiency'];
    const columnXs = [150, 400, 650];
    const startY = 170;
    const verticalGap = 122;

    branches.forEach((branch, branchIndex) => {
      const branchInfo = BRANCH_INFO[branch];
      const x = columnXs[branchIndex];

      this.add.text(x, 100, `${branchInfo.emoji} ${branchInfo.name}`, {
        color: `#${branchInfo.color.toString(16).padStart(6, '0')}`,
        fontSize: '24px',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      SKILL_NODES.filter((node) => node.branch === branch).forEach((node, rowIndex) => {
        this.nodeViews.push(this.createSkillNode(node, x, startY + rowIndex * verticalGap));
      });
    });
  }

  private createSkillNode(node: SkillNode, x: number, y: number): SkillNodeView {
    const branchInfo = BRANCH_INFO[node.branch];
    const width = 210;
    const height = 96;
    const background = this.add.rectangle(0, 0, width, height, 0x1b1220, 0.96).setStrokeStyle(2, branchInfo.color, 0.85);
    const nameText = this.add.text(-width * 0.5 + 12, -height * 0.5 + 10, node.name, {
      color: '#ffffff',
      fontSize: '18px',
      fontStyle: 'bold',
    }).setOrigin(0, 0);
    const levelText = this.add.text(width * 0.5 - 12, -height * 0.5 + 10, '', {
      color: '#f0d8ff',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    const descriptionText = this.add.text(-width * 0.5 + 12, -8, '', {
      color: '#d8d0df',
      fontSize: '14px',
      wordWrap: { width: width - 24 },
    }).setOrigin(0, 0.5);
    const costText = this.add.text(-width * 0.5 + 12, height * 0.5 - 18, '', {
      color: '#dd66ff',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const indicators = [0, 1, 2].map((index) => this.add.rectangle(width * 0.5 - 64 + index * 18, height * 0.5 - 18, 12, 12, branchInfo.color, 0.15));

    indicators.forEach((indicator) => indicator.setStrokeStyle(2, branchInfo.color, 1));

    const container = this.add.container(x, y, [background, nameText, levelText, descriptionText, costText, ...indicators]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width * 0.5, -height * 0.5, width, height), Phaser.Geom.Rectangle.Contains);
    container.on('pointerover', () => background.setFillStyle(0x26172f, 1));
    container.on('pointerout', () => this.refreshNode(node.id));
    container.on('pointerdown', () => {
        this.playUiClick();
        this.tryUpgrade(node);
      });

    return { node, container, background, levelText, descriptionText, costText, indicators };
  }

  private createBackButton(): void {
    const button = this.add.rectangle(84, WORLD.HEIGHT - 36, 120, 42, 0x24161a, 0.95).setStrokeStyle(2, 0xffcc44);
    const label = this.add.text(84, WORLD.HEIGHT - 36, '← BACK', {
      color: '#ffcc44',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setFillStyle(0x382026, 1));
    button.on('pointerout', () => button.setFillStyle(0x24161a, 0.95));
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

  private tryUpgrade(node: SkillNode): void {
    const currentLevel = getSkillLevel(this.saveData.skillTree, node.id);
    const cost = node.costPerLevel[currentLevel];
    const previousUnlocked = [...this.saveData.achievements.unlocked];

    if (currentLevel >= node.maxLevel || cost === undefined || this.saveData.bloodstones < cost) {
      this.flashNode(node.id, 0xaa2222);
      return;
    }

    const updated = SaveSystem.upgradeSkill(node.id);

    if (!updated) {
      this.flashNode(node.id, 0xaa2222);
      return;
    }

    this.saveData = updated;
    this.rewardNewAchievements(previousUnlocked);
    this.saveData = SaveSystem.load();
    this.flashNode(node.id, BRANCH_INFO[node.branch].color);
    this.refreshUi();
  }

  private refreshUi(): void {
    this.coinText?.setText(`🪙 ${this.saveData.coins}`);
    this.bloodstoneText?.setText(`💎 ${this.saveData.bloodstones}`);
    this.nodeViews.forEach((view) => this.refreshNode(view.node.id));
  }

  private refreshNode(skillId: SkillNode['id']): void {
    const view = this.nodeViews.find((entry) => entry.node.id === skillId);

    if (!view) {
      return;
    }

    const level = getSkillLevel(this.saveData.skillTree, skillId);
    const nextLevel = Math.min(level + 1, view.node.maxLevel);
    const currentValue = getSkillValue(skillId, level);
    const nextValue = getSkillValue(skillId, nextLevel);
    const cost = view.node.costPerLevel[level];
    const affordable = cost !== undefined && this.saveData.bloodstones >= cost;
    const branchColor = BRANCH_INFO[view.node.branch].color;

    view.background.setFillStyle(level >= view.node.maxLevel ? 0x2d1d34 : 0x1b1220, 0.96);
    view.background.setStrokeStyle(2, branchColor, 0.9);
    view.levelText.setText(`Lv ${level}/${view.node.maxLevel}`);
    view.descriptionText.setText(this.getNodeDescription(view.node, level, currentValue, nextValue));
    view.costText.setText(level >= view.node.maxLevel ? 'MAXED' : `💎 ${cost}`);
    view.costText.setColor(level >= view.node.maxLevel ? '#88ff88' : affordable ? '#dd66ff' : '#777777');

    view.indicators.forEach((indicator, index) => {
      indicator.setFillStyle(branchColor, index < level ? 0.9 : 0.12);
      indicator.setStrokeStyle(2, branchColor, 1);
    });
  }

  private getNodeDescription(node: SkillNode, level: number, currentValue: number, nextValue: number): string {
    if (level <= 0) {
      return `Next: ${node.description.replace('{v}', this.formatValue(nextValue))}`;
    }

    if (level >= node.maxLevel) {
      return `Current: ${node.description.replace('{v}', this.formatValue(currentValue))}`;
    }

    return `Current: ${node.description.replace('{v}', this.formatValue(currentValue))}\nNext: ${node.description.replace('{v}', this.formatValue(nextValue))}`;
  }

  private formatValue(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(/\.0$/, '');
  }

  private flashNode(skillId: SkillNode['id'], color: number): void {
    const view = this.nodeViews.find((entry) => entry.node.id === skillId);

    if (!view) {
      return;
    }

    view.background.setStrokeStyle(3, color, 1);
    this.tweens.add({
      targets: view.container,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 90,
      yoyo: true,
      onComplete: () => this.refreshNode(skillId),
    });
  }

  private rewardNewAchievements(previousUnlocked: AchievementId[]): void {
    this.saveData.achievements.unlocked
      .filter((id) => !previousUnlocked.includes(id))
      .forEach((id) => {
        SaveSystem.addCoins(ACHIEVEMENT_MAP[id].reward);
      });
  }
}
