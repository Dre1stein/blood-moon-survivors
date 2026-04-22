import Phaser from 'phaser';
import { WORLD } from '../constants';
import { ACHIEVEMENTS, AchievementId, AchievementProgress, getAchievementProgress } from '../data/AchievementData';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { CharacterSelectScene } from './CharacterSelectScene';

type AchievementCardView = {
  id: AchievementId;
  border: Phaser.GameObjects.Rectangle;
  background: Phaser.GameObjects.Rectangle;
  statusText: Phaser.GameObjects.Text;
  rewardText: Phaser.GameObjects.Text;
  progressFill?: Phaser.GameObjects.Rectangle;
  progressLabel?: Phaser.GameObjects.Text;
};

export class AchievementScene extends Phaser.Scene {
  static readonly KEY = 'AchievementScene';

  private saveData!: SaveData;
  private cardViews: AchievementCardView[] = [];
  private coinText?: Phaser.GameObjects.Text;
  private bloodstoneText?: Phaser.GameObjects.Text;

  constructor() {
    super(AchievementScene.KEY);
  }

  create(): void {
    this.saveData = SaveSystem.load();

    this.cameras.main.setBackgroundColor(0x100814);
    this.add.rectangle(WORLD.WIDTH * 0.5, WORLD.HEIGHT * 0.5, WORLD.WIDTH, WORLD.HEIGHT, 0x100814);

    this.add.text(WORLD.WIDTH * 0.5, 34, 'ACHIEVEMENTS', {
      color: '#ffcc44',
      fontSize: '30px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);
    this.coinText = this.add.text(WORLD.WIDTH - 24, 26, '', {
      color: '#ffcc44',
      fontSize: '20px',
    }).setOrigin(1, 0);
    this.bloodstoneText = this.add.text(WORLD.WIDTH - 24, 48, '', {
      color: '#dd66ff',
      fontSize: '20px',
    }).setOrigin(1, 0);

    this.createCards();
    this.createBackButton();
    this.refreshUi();
  }

  private createCards(): void {
    const columns = 2;
    const cardWidth = 340;
    const cardHeight = 76;
    const gapX = 20;
    const gapY = 18;
    const startX = 50 + cardWidth * 0.5;
    const startY = 92 + cardHeight * 0.5;

    ACHIEVEMENTS.forEach((achievement, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + column * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);
      const unlocked = this.saveData.achievements.unlocked.includes(achievement.id);
      const background = this.add.rectangle(0, 0, cardWidth, cardHeight, unlocked ? 0x241814 : 0x16161b, 0.96);
      const border = this.add.rectangle(0, 0, cardWidth, cardHeight).setFillStyle(0, 0)
      .setStrokeStyle(unlocked ? 3 : 2, unlocked ? 0xffcc44 : 0x5e5e66, 1);
const title = this.add.text(-cardWidth * 0.5 + 12, -20, `${achievement.emoji} ${achievement.name}`, {
      color: unlocked ? '#ffe8a8' : '#d1d1d8',
      fontSize: '18px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
const description = this.add.text(-cardWidth * 0.5 + 12, -2, achievement.description, {
      color: unlocked ? '#f0dfcf' : '#8c8c95',
      fontSize: '14px',
      wordWrap: { width: 225 },
    }).setOrigin(0, 0.5);
      const rewardText = this.add.text(cardWidth * 0.5 - 12, -20, `🪙 +${achievement.reward}`, {
        color: '#ffcc44',
        fontSize: '14px',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      const statusText = this.add.text(cardWidth * 0.5 - 12, 20, unlocked ? '✅ UNLOCKED' : '🔒 LOCKED', {
        color: unlocked ? '#88ff88' : '#999999',
        fontSize: '13px',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);

      const children: Phaser.GameObjects.GameObject[] = [background, border, title, description, rewardText, statusText];
      let progressFill: Phaser.GameObjects.Rectangle | undefined;
      let progressLabel: Phaser.GameObjects.Text | undefined;

      if (achievement.target !== undefined) {
const progressBg = this.add.rectangle(-cardWidth * 0.5 + 12, 20, 180, 14, 0x2a2a34, 1).setOrigin(0, 0.5);
    progressFill = this.add.rectangle(-cardWidth * 0.5 + 12, 20, 0, 14, unlocked ? 0xffcc44 : 0x4c7280, 1).setOrigin(0, 0.5);
progressLabel = this.add.text(-cardWidth * 0.5 + 200, 20, '', {
      color: '#d8d8df',
      fontSize: '14px',
    }).setOrigin(0, 0.5);
        children.push(progressBg, progressFill, progressLabel);
      }

const cardIndex = this.cardViews.length;
    const container = this.add.container(x, y, children);
    container.setSize(cardWidth, cardHeight);
    container.setInteractive(new Phaser.Geom.Rectangle(-cardWidth * 0.5, -cardHeight * 0.5, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      background.setFillStyle(0x2d1d34, 0.96);
    });
    container.on('pointerout', () => {
      if (cardIndex < this.cardViews.length) {
        this.refreshCard(this.cardViews[cardIndex]);
      }
    });

    this.cardViews.push({ id: achievement.id, border, background, statusText, rewardText, progressFill, progressLabel });
    });
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

  private refreshUi(): void {
    this.coinText?.setText(`🪙 ${this.saveData.coins}`);
    this.bloodstoneText?.setText(`💎 ${this.saveData.bloodstones}`);
    this.cardViews.forEach((view) => this.refreshCard(view));
  }

  private refreshCard(view: AchievementCardView): void {
    const unlocked = this.saveData.achievements.unlocked.includes(view.id);
    const progress = this.getProgress(view.id);
    const target = progress.target ?? 0;
    const ratio = target > 0 ? Phaser.Math.Clamp(progress.value / target, 0, 1) : 0;

    view.background.setFillStyle(unlocked ? 0x241814 : 0x16161b, 0.96);
    view.border.setStrokeStyle(unlocked ? 3 : 2, unlocked ? 0xffcc44 : 0x5e5e66, 1);
    view.statusText.setText(unlocked ? '✅ UNLOCKED' : '🔒 LOCKED');
    view.statusText.setColor(unlocked ? '#88ff88' : '#999999');
    view.rewardText.setColor(unlocked ? '#ffdd66' : '#c79e3a');

    if (view.progressFill && view.progressLabel && progress.target !== undefined) {
      view.progressFill.setDisplaySize(180 * ratio, 10);
      view.progressLabel.setText(`${Math.min(progress.value, progress.target)}/${progress.target}`);
    }
  }

  private getProgress(id: AchievementId): AchievementProgress {
    return getAchievementProgress(id, this.saveData.achievements, {
      unlockedCharacters: this.saveData.unlockedCharacters,
      runes: this.saveData.runes,
      skillTree: this.saveData.skillTree,
    });
  }
}
