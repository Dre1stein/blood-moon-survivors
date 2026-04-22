import Phaser from 'phaser';
import { BOSS_CONFIG, DROP_CONFIG, ELITE_CONFIG, ENEMY_CONFIG, PLAYER_CONFIG, WEAPON_CONFIG, XP_CONFIG } from '../constants';
import { CharacterSelectScene } from './CharacterSelectScene';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {}

  create(): void {
    this.createRectangleTexture('player', PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT, PLAYER_CONFIG.COLOR, '#f0f0f0');
    this.createRectangleTexture('enemy', ENEMY_CONFIG.WIDTH, ENEMY_CONFIG.HEIGHT, ENEMY_CONFIG.COLOR, '#551111');
    this.createRectangleTexture('elite-enemy', ELITE_CONFIG.SIZE, ELITE_CONFIG.SIZE, ELITE_CONFIG.COLOR, ELITE_CONFIG.BORDER);
    this.createRectangleTexture('boss', 40, 40, BOSS_CONFIG.TYPES[0].color, '#ff0000');
    this.createRectangleTexture('xp-gem', XP_CONFIG.GEM_SIZE, XP_CONFIG.GEM_SIZE, XP_CONFIG.GEM_COLOR, XP_CONFIG.GEM_BORDER);
    this.createRectangleTexture('health-gem', DROP_CONFIG.HEALTH_GEM.SIZE, DROP_CONFIG.HEALTH_GEM.SIZE, DROP_CONFIG.HEALTH_GEM.COLOR, '#ddffdd');
    this.createRectangleTexture('coin', DROP_CONFIG.COIN.SIZE, DROP_CONFIG.COIN.SIZE, DROP_CONFIG.COIN.COLOR, '#fff4a3');
    this.createRectangleTexture('bloodstone', DROP_CONFIG.BLOODSTONE.SIZE, DROP_CONFIG.BLOODSTONE.SIZE, DROP_CONFIG.BLOODSTONE.COLOR, '#ffb3ff');
    this.createRectangleTexture('equipment-box', 12, 12, 0xffffff, '#ffffff');
    this.createRectangleTexture('particle', 4, 4, 0xffffff, '#ffffff');
    this.createDotTexture('ground-dot', 4, 0xffffff);
    this.createCrossTexture('ground-cross', 8, 0xffffff);
    this.createRectangleTexture(
      'bullet-silver',
      WEAPON_CONFIG.SILVER_BULLET.SIZE,
      WEAPON_CONFIG.SILVER_BULLET.SIZE,
      WEAPON_CONFIG.SILVER_BULLET.COLOR,
      '#ffffff'
    );
    this.createRectangleTexture(
      'holy-cross',
      WEAPON_CONFIG.HOLY_CROSS.SIZE,
      WEAPON_CONFIG.HOLY_CROSS.SIZE,
      WEAPON_CONFIG.HOLY_CROSS.COLOR,
      '#fff3b0'
    );
    this.createRectangleTexture('aura-pulse', 8, 8, WEAPON_CONFIG.HOLY_AURA.COLOR, '#d9f4ff');
    this.createRectangleTexture('holy-water', WEAPON_CONFIG.HOLY_WATER.SIZE, WEAPON_CONFIG.HOLY_WATER.SIZE, WEAPON_CONFIG.HOLY_WATER.COLOR, '#d9f4ff');
    this.createRectangleTexture('blood-dagger', WEAPON_CONFIG.BLOOD_DAGGER.SIZE + 6, WEAPON_CONFIG.BLOOD_DAGGER.SIZE, WEAPON_CONFIG.BLOOD_DAGGER.COLOR, '#ffcccc');
    this.createRectangleTexture('thunder-hammer', WEAPON_CONFIG.THUNDER_HAMMER.SIZE, WEAPON_CONFIG.THUNDER_HAMMER.SIZE + 8, WEAPON_CONFIG.THUNDER_HAMMER.COLOR, '#fff7aa');

    this.scene.start(CharacterSelectScene.KEY);
  }

  private createRectangleTexture(
    key: string,
    width: number,
    height: number,
    fillColor: number,
    strokeColor: string
  ): void {
    if (this.textures.exists(key)) {
      return;
    }

    const texture = this.textures.createCanvas(key, width, height);

    if (!texture) {
      return;
    }

    const context = texture.getContext();

    context.clearRect(0, 0, width, height);
    context.fillStyle = `#${fillColor.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = strokeColor;
    context.lineWidth = 2;
    context.strokeRect(1, 1, width - 2, height - 2);
    texture.refresh();
  }

  private createDotTexture(key: string, size: number, fillColor: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    const texture = this.textures.createCanvas(key, size, size);

    if (!texture) {
      return;
    }

    const context = texture.getContext();
    context.clearRect(0, 0, size, size);
    context.fillStyle = `#${fillColor.toString(16).padStart(6, '0')}`;
    context.beginPath();
    context.arc(size * 0.5, size * 0.5, size * 0.5, 0, Math.PI * 2);
    context.fill();
    texture.refresh();
  }

  private createCrossTexture(key: string, size: number, fillColor: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    const texture = this.textures.createCanvas(key, size, size);

    if (!texture) {
      return;
    }

    const context = texture.getContext();
    const thickness = Math.max(2, Math.floor(size / 4));
    const offset = Math.floor((size - thickness) * 0.5);

    context.clearRect(0, 0, size, size);
    context.fillStyle = `#${fillColor.toString(16).padStart(6, '0')}`;
    context.fillRect(offset, 0, thickness, size);
    context.fillRect(0, offset, size, thickness);
    texture.refresh();
  }
}
