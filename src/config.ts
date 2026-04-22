import Phaser from 'phaser';
import { AchievementScene } from './scenes/AchievementScene';
import { BootScene } from './scenes/BootScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { EquipmentScene } from './scenes/EquipmentScene';
import { GameScene } from './scenes/GameScene';
import { MapSelectScene } from './scenes/MapSelectScene';
import { RuneScene } from './scenes/RuneScene';
import { SkillTreeScene } from './scenes/SkillTreeScene';
import { WORLD } from './constants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD.WIDTH,
  height: WORLD.HEIGHT,
  backgroundColor: Phaser.Display.Color.IntegerToColor(WORLD.BG_COLOR).rgba,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }
    }
  },
  scene: [BootScene, CharacterSelectScene, SkillTreeScene, RuneScene, EquipmentScene, AchievementScene, MapSelectScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
